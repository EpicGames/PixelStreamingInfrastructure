// Copyright Epic Games, Inc. All Rights Reserved.

import {
    WebSocketTransport,
    Logger,
    SignallingProtocol,
    ITransport,
    Messages,
    MessageHelpers,
    BaseMessage,
    KeepaliveMonitor
} from '@epicgames-ps/lib-pixelstreamingcommon-ue5.7';
import { StreamController } from '../VideoPlayer/StreamController';
import { FreezeFrameController } from '../FreezeFrame/FreezeFrameController';
import { AFKController } from '../AFK/AFKController';
import { DataChannelController } from '../DataChannel/DataChannelController';
import { PeerConnectionController } from '../PeerConnectionController/PeerConnectionController';
import { AggregatedStats } from '../PeerConnectionController/AggregatedStats';
import {
    Config,
    Flags,
    ControlSchemeType,
    TextParameters,
    OptionParameters,
    NumericParameters
} from '../Config/Config';
import { InitialSettings } from '../DataChannel/InitialSettings';
import { LatencyTestResults } from '../DataChannel/LatencyTestResults';
import { FileTemplate, FileUtil } from '../Util/FileUtil';
import { InputClassesFactory } from '../Inputs/InputClassesFactory';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
import { StreamMessageController, MessageDirection } from '../UeInstanceMessage/StreamMessageController';
import { ResponseController } from '../UeInstanceMessage/ResponseController';
import { SendMessageController } from '../UeInstanceMessage/SendMessageController';
import { ToStreamerMessagesController } from '../UeInstanceMessage/ToStreamerMessagesController';
import { DataChannelSender } from '../DataChannel/DataChannelSender';
import { InputCoordTranslator } from '../Util/InputCoordTranslator';
import { PixelStreaming } from '../PixelStreaming/PixelStreaming';
import {
    DataChannelCloseEvent,
    DataChannelErrorEvent,
    DataChannelOpenEvent,
    HideFreezeFrameEvent,
    LoadFreezeFrameEvent,
    PlayStreamErrorEvent,
    PlayStreamEvent,
    PlayStreamRejectedEvent,
    ShowOnScreenKeyboardEvent,
    StreamerListMessageEvent,
    StreamerIDChangedMessageEvent
} from '../Util/EventEmitter';
import {
    DataChannelLatencyTestRequest,
    DataChannelLatencyTestResponse
} from '../DataChannel/DataChannelLatencyTestResults';
import { IURLSearchParams } from '../Util/IURLSearchParams';
import { IInputController } from '../Inputs/IInputController';
import { GamepadController } from '../Inputs/GamepadController';
import { LatencyInfo } from '../PeerConnectionController/LatencyCalculator';
import { BrowserUtils } from '../Util/BrowserUtils';

/**
 * Entry point for the WebRTC Player
 */
export class WebRtcPlayerController {
    config: Config;
    responseController: ResponseController;
    sdpConstraints: RTCOfferOptions;
    transport: ITransport;
    protocol: SignallingProtocol;
    // The primary data channel. This is bidirectional when p2p and send only when using an SFU
    sendrecvDataChannelController: DataChannelController;
    // A recv only data channel required when using an SFU
    recvDataChannelController: DataChannelController;
    dataChannelSender: DataChannelSender;
    datachannelOptions: RTCDataChannelInit;
    videoPlayer: VideoPlayer;
    streamController: StreamController;
    peerConnectionController: PeerConnectionController;
    inputClassesFactory: InputClassesFactory;
    freezeFrameController: FreezeFrameController;
    shouldShowPlayOverlay = true;
    afkController: AFKController;
    latencyStartTime: number;
    pixelStreaming: PixelStreaming;
    streamMessageController: StreamMessageController;
    sendMessageController: SendMessageController;
    toStreamerMessagesController: ToStreamerMessagesController;
    keyboardController: IInputController;
    mouseController: IInputController;
    touchController: IInputController;
    gamePadController: GamepadController;
    coordinateConverter: InputCoordTranslator;
    isUsingSFU: boolean;
    isUsingSVC: boolean;
    isQualityController: boolean;
    statsTimerHandle: number;
    file: FileTemplate;
    preferredCodec: string;
    peerConfig: RTCConfiguration;
    videoAvgQp: number;
    locallyClosed: boolean;
    enableAutoReconnect: boolean;
    forceReconnect: boolean;
    reconnectAttempt: number;
    isReconnecting: boolean;
    disconnectMessage: string;
    subscribedStream: string;
    signallingUrlBuilder: () => string;
    autoJoinTimer: ReturnType<typeof setTimeout> = undefined;
    keepalive: KeepaliveMonitor;
    playerId: string | null = null;

    /**
     *
     * @param config - the frontend config object
     * @param pixelStreaming - the PixelStreaming object
     */
    constructor(config: Config, pixelStreaming: PixelStreaming) {
        this.config = config;
        this.pixelStreaming = pixelStreaming;
        this.responseController = new ResponseController();
        this.file = new FileTemplate();

        this.sdpConstraints = {
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        };

        // set up the afk logic class and connect up its method for closing the signaling server
        this.afkController = new AFKController(
            this.config,
            this.pixelStreaming,
            this.onAfkTriggered.bind(this)
        );
        this.afkController.onAFKTimedOutCallback = () => {
            this.closeSignalingServer('You have been disconnected due to inactivity.', false);
        };

        this.freezeFrameController = new FreezeFrameController(this.pixelStreaming.videoElementParent);

        this.videoPlayer = new VideoPlayer(this.pixelStreaming.videoElementParent, this.config);
        this.videoPlayer.onVideoInitialized = () => this.handleVideoInitialized();

        // When in match viewport resolution mode, when the browser viewport is resized we send a resize command back to UE.
        this.videoPlayer.onMatchViewportResolutionCallback = (width: number, height: number) => {
            const descriptor = {
                'Resolution.Width': width,
                'Resolution.Height': height
            };

            this.streamMessageController.toStreamerHandlers.get('Command')([JSON.stringify(descriptor)]);
        };

        // Every time video player is resized in browser we need to reinitialize the mouse coordinate conversion and freeze frame sizing logic.
        this.videoPlayer.onResizePlayerCallback = () => {
            this.setUpMouseAndFreezeFrame();
        };

        this.streamController = new StreamController(this.videoPlayer);

        this.coordinateConverter = new InputCoordTranslator();

        this.sendrecvDataChannelController = new DataChannelController();
        this.recvDataChannelController = new DataChannelController();
        this.registerDataChannelEventEmitters(this.sendrecvDataChannelController);
        this.registerDataChannelEventEmitters(this.recvDataChannelController);
        this.dataChannelSender = new DataChannelSender(this.sendrecvDataChannelController);
        this.dataChannelSender.resetAfkWarningTimerOnDataSend = () =>
            this.afkController.resetAfkWarningTimer();

        this.streamMessageController = new StreamMessageController();

        // set up websocket methods
        this.transport = new WebSocketTransport(config.webSocketProtocols);
        this.protocol = new SignallingProtocol(this.transport);
        this.protocol.addListener(Messages.config.typeName, (msg: BaseMessage) =>
            this.handleOnConfigMessage(msg as Messages.config)
        );
        this.protocol.addListener(Messages.ping.typeName, (msg: BaseMessage) =>
            this.handlePingMessage(msg as Messages.ping)
        );
        this.protocol.addListener(Messages.streamerList.typeName, (msg: BaseMessage) =>
            this.handleStreamerListMessage(msg as Messages.streamerList)
        );
        this.protocol.addListener(Messages.subscribeFailed.typeName, (msg: BaseMessage) =>
            this.handleSubscribeFailedMessage(msg as Messages.subscribeFailed)
        );
        this.protocol.addListener(Messages.streamerIdChanged.typeName, (msg: BaseMessage) =>
            this.handleStreamerIDChangedMessage(msg as Messages.streamerIdChanged)
        );
        this.protocol.addListener(Messages.playerCount.typeName, (msg: BaseMessage) => {
            const playerCountMessage = msg as Messages.playerCount;
            this.pixelStreaming._onPlayerCount(playerCountMessage.count);
        });
        this.protocol.addListener(Messages.answer.typeName, (msg: BaseMessage) =>
            this.handleWebRtcAnswer(msg as Messages.answer)
        );
        this.protocol.addListener(Messages.offer.typeName, (msg: BaseMessage) =>
            this.handleWebRtcOffer(msg as Messages.offer)
        );
        this.protocol.addListener(Messages.peerDataChannels.typeName, (msg: BaseMessage) =>
            this.handleWebRtcSFUPeerDatachannels(msg as Messages.peerDataChannels)
        );
        this.protocol.addListener(Messages.iceCandidate.typeName, (msg: BaseMessage) => {
            const iceCandidateMessage = msg as Messages.iceCandidate;
            this.handleIceCandidate(iceCandidateMessage.candidate);
        });
        this.protocol.transport.addListener('open', () => {
            const BrowserSendOffer = this.config.isFlagEnabled(Flags.BrowserSendOffer);
            if (!BrowserSendOffer) {
                const message = MessageHelpers.createMessage(Messages.listStreamers);
                this.protocol.sendMessage(message);
            }
            this.reconnectAttempt = 0;
            this.isReconnecting = false;
        });
        this.protocol.transport.addListener('error', () => {
            // dont really need to do anything here since the close event should follow.
            Logger.Error(`Got a transport error.`);
        });
        this.protocol.transport.addListener('close', (event: CloseEvent) => {
            // when we refresh the page during a stream we get the going away code.
            // in that case we don't want to reconnect since we're navigating away.
            // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code
            // lists all the codes.
            const CODE_GOING_AWAY = 1001;

            const maxReconnectAttempts = this.config.getNumericSettingValue(
                NumericParameters.MaxReconnectAttempts
            );
            const attemptsLeft = this.reconnectAttempt < maxReconnectAttempts;
            const reconnectEnabled =
                this.forceReconnect || (this.enableAutoReconnect && maxReconnectAttempts > 0 && attemptsLeft);
            const willTryReconnect = reconnectEnabled && event.code != CODE_GOING_AWAY;
            const allowClickToReconnect = !willTryReconnect;
            const disconnectMessage = this.disconnectMessage ? this.disconnectMessage : event.reason;

            this.forceReconnect = false;

            // Reset the list of all possible codecs on disconnect so that if the next connection has "NegotiateCodecs" on
            // then all codecs can be negotiated
            this.config.getSettingOption(OptionParameters.PreferredCodec).options =
                BrowserUtils.getSupportedVideoCodecs();

            this.pixelStreaming._onDisconnect(disconnectMessage, allowClickToReconnect);

            this.afkController.stopAfkWarningTimer();

            // stop sending stats on interval if we have closed our connection
            if (this.statsTimerHandle) {
                window.clearInterval(this.statsTimerHandle);
            }

            // reset the stream quality icon.
            this.setVideoEncoderAvgQP(0);

            // unregister all input device event handlers on disconnect
            this.setTouchInputEnabled(false);
            this.setMouseInputEnabled(false);
            this.setKeyboardInputEnabled(false);
            this.setGamePadInputEnabled(false);

            if (willTryReconnect) {
                // need a small delay here to prevent reconnect spamming
                setTimeout(() => {
                    this.reconnectAttempt++;
                    this.doReconnect(event.reason);
                }, 2000);
            }
        });

        // set up the final webRtc player controller methods from within our application so a connection can be activated
        this.sendMessageController = new SendMessageController(
            this.dataChannelSender,
            this.streamMessageController
        );
        this.toStreamerMessagesController = new ToStreamerMessagesController(this.sendMessageController);
        this.registerMessageHandlers();
        this.streamMessageController.populateDefaultProtocol();

        this.inputClassesFactory = new InputClassesFactory(
            this.streamMessageController,
            this.videoPlayer,
            this.coordinateConverter
        );

        this.isUsingSFU = false;
        this.isUsingSVC = false;
        this.isQualityController = false;
        this.preferredCodec = '';
        this.enableAutoReconnect = true;
        this.forceReconnect = false;
        this.reconnectAttempt = 0;
        this.isReconnecting = false;

        this.config._addOnOptionSettingChangedListener(OptionParameters.StreamerId, (streamerid) => {
            if (streamerid === undefined || streamerid === '') {
                return;
            }

            // close the current peer connection and create a new one
            this.peerConnectionController.peerConnection.close();
            this.peerConnectionController.createPeerConnection(this.peerConfig, this.preferredCodec);
            this.subscribedStream = streamerid;
            const message = MessageHelpers.createMessage(Messages.subscribe, { streamerId: streamerid });
            this.protocol.sendMessage(message);
        });

        this.config._addOnOptionSettingChangedListener(
            OptionParameters.PreferredQuality,
            (preferredQuality) => {
                if (preferredQuality === undefined || preferredQuality === '') {
                    return;
                }

                let message;
                if (this.isUsingSVC) {
                    // User is using SVC so selected quality will be of the form SxTy(h). Just extract the x and y numbers
                    message = MessageHelpers.createMessage(Messages.layerPreference, {
                        spatialLayer: +preferredQuality[1] - 1,
                        temporalLayer: +preferredQuality[3] - 1
                    });
                } else {
                    // User is not using SVC so the selected quality will be either Low, Medium or High so we extract the appropriate spatial layer index
                    const allQualities = this.config.getSettingOption(
                        OptionParameters.PreferredQuality
                    ).options;
                    const qualityIndex = allQualities.indexOf(preferredQuality);
                    message = MessageHelpers.createMessage(Messages.layerPreference, {
                        spatialLayer: qualityIndex,
                        temporalLayer: 0
                    });
                }
                this.protocol.sendMessage(message);
            }
        );

        this.setVideoEncoderAvgQP(-1);

        this.signallingUrlBuilder = () => {
            const signallingServerUrl = this.config.getTextSettingValue(TextParameters.SignallingServerUrl);

            return signallingServerUrl;
        };
    }

    /**
     * Destroys the video player and makes sure resources are freed. This helps to prevent the issue in chrome
     * where it refuses to make new video players.
     */
    destroyVideoPlayer() {
        this.videoPlayer.destroy();
    }

    /**
     * Handles when a message is received
     * @param event - Message Event
     */
    handleOnMessage(event: MessageEvent) {
        const message = new Uint8Array(event.data);
        Logger.Info('Message incoming:' + message);

        //try {
        const messageType = this.streamMessageController.fromStreamerMessages.get(message[0]);
        this.streamMessageController.fromStreamerHandlers.get(messageType)(event.data);
        //} catch (e) {
        //Logger.Error(Logger.GetStackTrace(), `Custom data channel message with message type that is unknown to the Pixel Streaming protocol. Does your PixelStreamingProtocol need updating? The message type was: ${message[0]}`);
        //}
    }

    /**
     * Register message all handlers
     */
    registerMessageHandlers() {
        // From Streamer
        // Message events from the streamer have a data type of ArrayBuffer as we force this type in the DatachannelController
        this.streamMessageController.registerMessageHandler(
            MessageDirection.FromStreamer,
            'QualityControlOwnership',
            (data: ArrayBuffer) => this.onQualityControlOwnership(data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.FromStreamer,
            'Response',
            (data: ArrayBuffer) => this.responseController.onResponse(data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.FromStreamer,
            'Command',
            (data: ArrayBuffer) => {
                this.onCommand(data);
            }
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.FromStreamer,
            'FreezeFrame',
            (data: ArrayBuffer) => this.onFreezeFrameMessage(data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.FromStreamer,
            'UnfreezeFrame',
            () => this.invalidateFreezeFrameAndEnableVideo()
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.FromStreamer,
            'VideoEncoderAvgQP',
            (data: ArrayBuffer) => this.handleVideoEncoderAvgQP(data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.FromStreamer,
            'LatencyTest',
            (data: ArrayBuffer) => this.handleLatencyTestResult(data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.FromStreamer,
            'DataChannelLatencyTest',
            (data: ArrayBuffer) => this.handleDataChannelLatencyTestResponse(data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.FromStreamer,
            'InitialSettings',
            (data: ArrayBuffer) => this.handleInitialSettings(data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.FromStreamer,
            'FileExtension',
            (data: ArrayBuffer) => this.onFileExtension(data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.FromStreamer,
            'FileMimeType',
            (data: ArrayBuffer) => this.onFileMimeType(data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.FromStreamer,
            'FileContents',
            (data: ArrayBuffer) => this.onFileContents(data)
        );
        this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, 'TestEcho', () => {
            /* Do nothing */
        });
        this.streamMessageController.registerMessageHandler(
            MessageDirection.FromStreamer,
            'InputControlOwnership',
            (data: ArrayBuffer) => this.onInputControlOwnership(data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.FromStreamer,
            'GamepadResponse',
            (data: ArrayBuffer) => this.onGamepadResponse(data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.FromStreamer,
            'Multiplexed',
            () => {
                /* Do nothing as this message type is used only by the SFU */
            }
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.FromStreamer,
            'Protocol',
            (data: ArrayBuffer) => this.onProtocolMessage(data)
        );

        // To Streamer
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'IFrameRequest',
            () => this.sendMessageController.sendMessageToStreamer('IFrameRequest')
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'RequestQualityControl',
            () => this.sendMessageController.sendMessageToStreamer('RequestQualityControl')
        );
        this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, 'FpsRequest', () =>
            this.sendMessageController.sendMessageToStreamer('FpsRequest')
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'AverageBitrateRequest',
            () => this.sendMessageController.sendMessageToStreamer('AverageBitrateRequest')
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'StartStreaming',
            () => this.sendMessageController.sendMessageToStreamer('StartStreaming')
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'StopStreaming',
            () => this.sendMessageController.sendMessageToStreamer('StopStreaming')
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'LatencyTest',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('LatencyTest', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'RequestInitialSettings',
            () => this.sendMessageController.sendMessageToStreamer('RequestInitialSettings')
        );
        this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, 'TestEcho', () => {
            /* Do nothing */
        });
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'UIInteraction',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('UIInteraction', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'Command',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('Command', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'TextboxEntry',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('TextboxEntry', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'KeyDown',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('KeyDown', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'KeyUp',
            (data: Array<number | string>) => this.sendMessageController.sendMessageToStreamer('KeyUp', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'KeyPress',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('KeyPress', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'MouseEnter',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('MouseEnter', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'MouseLeave',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('MouseLeave', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'MouseDown',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('MouseDown', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'MouseUp',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('MouseUp', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'MouseMove',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('MouseMove', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'MouseWheel',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('MouseWheel', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'MouseDouble',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('MouseDouble', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'TouchStart',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('TouchStart', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'TouchEnd',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('TouchEnd', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'TouchMove',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('TouchMove', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'GamepadConnected',
            () => this.sendMessageController.sendMessageToStreamer('GamepadConnected')
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'GamepadButtonPressed',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('GamepadButtonPressed', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'GamepadButtonReleased',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('GamepadButtonReleased', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'GamepadAnalog',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('GamepadAnalog', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'GamepadDisconnected',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('GamepadDisconnected', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XREyeViews',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('XREyeViews', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XRHMDTransform',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('XRHMDTransform', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XRControllerTransform',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('XRControllerTransform', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XRSystem',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('XRSystem', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XRButtonTouched',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('XRButtonTouched', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XRButtonTouchReleased',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('XRButtonTouchReleased', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XRButtonPressed',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('XRButtonPressed', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XRButtonReleased',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('XRButtonReleased', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XRAnalog',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('XRAnalog', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'ChannelRelayStatus',
            () => {
                /* Do nothing as this message type is used only by the SFU */
            }
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'Multiplexed',
            () => {
                /* Do nothing as this message type is used only by the SFU */
            }
        );
    }

    /**
     * Activate the logic associated with a command from UE
     * @param message
     */
    onCommand(message: ArrayBuffer) {
        Logger.Info('DataChannelReceiveMessageType.Command');
        const commandAsString = new TextDecoder('utf-16').decode(message.slice(1));

        Logger.Info('Data Channel Command: ' + commandAsString);
        const command = JSON.parse(commandAsString);

        // Handle "onScreenKeyboard" event
        if (command.command === 'onScreenKeyboard') {
            this.handleOnScreenKeyboardCommand(command);
        }
    }

    handleOnScreenKeyboardCommand(command: any) {
        const data: ShowOnScreenKeyboardEvent['data'] = {
            showOnScreenKeyboard: command.showOnScreenKeyboard ?? true,
            x: command.x ?? 0,
            y: command.y ?? 0,
            contents: command.contents ?? ''
        };
        this.pixelStreaming.dispatchEvent(new ShowOnScreenKeyboardEvent(data));
    }

    /**
     * Handles a protocol message received from the streamer
     * @param message the message data from the streamer
     */
    onProtocolMessage(message: ArrayBuffer) {
        try {
            const protocolString = new TextDecoder('utf-16').decode(message.slice(1));
            const protocolJSON = JSON.parse(protocolString);
            if (!Object.prototype.hasOwnProperty.call(protocolJSON, 'Direction')) {
                Logger.Error('Malformed protocol received. Ensure the protocol message contains a direction');
            }
            const direction = protocolJSON.Direction;
            delete protocolJSON.Direction;
            Logger.Info(
                `Received new ${
                    direction == MessageDirection.FromStreamer ? 'FromStreamer' : 'ToStreamer'
                } protocol. Updating existing protocol...`
            );
            Object.keys(protocolJSON).forEach((messageType) => {
                const message = protocolJSON[messageType];
                switch (direction) {
                    case MessageDirection.ToStreamer:
                        // Check that the message contains all the relevant params
                        if (!Object.prototype.hasOwnProperty.call(message, 'id')) {
                            Logger.Error(
                                `ToStreamer->${messageType} protocol definition was malformed as it didn't contain at least an id\n
                                           Definition was: ${JSON.stringify(message, null, 2)}`
                            );
                            // return in a forEach is equivalent to a continue in a normal for loop
                            return;
                        }

                        // UE5.1 and UE5.2 don't send a structure for these message types, but they actually do have a structure so ignore updating them
                        if (
                            messageType === 'UIInteraction' ||
                            messageType === 'Command' ||
                            messageType === 'LatencyTest'
                        ) {
                            return;
                        }

                        if (this.streamMessageController.toStreamerHandlers.get(messageType)) {
                            // If we've registered a handler for this message type we can add it to our supported messages. ie registerMessageHandler(...)
                            this.streamMessageController.toStreamerMessages.set(messageType, message);
                        } else {
                            Logger.Error(
                                `There was no registered handler for "${messageType}" - try adding one using registerMessageHandler(MessageDirection.ToStreamer, "${messageType}", myHandler)`
                            );
                        }
                        break;
                    case MessageDirection.FromStreamer:
                        // Check that the message contains all the relevant params
                        if (!Object.prototype.hasOwnProperty.call(message, 'id')) {
                            Logger.Error(
                                `FromStreamer->${messageType} protocol definition was malformed as it didn't contain at least an id\n
                            Definition was: ${JSON.stringify(message, null, 2)}`
                            );
                            // return in a forEach is equivalent to a continue in a normal for loop
                            return;
                        }
                        if (this.streamMessageController.fromStreamerHandlers.get(messageType)) {
                            // If we've registered a handler for this message type. ie registerMessageHandler(...)
                            this.streamMessageController.fromStreamerMessages.set(message.id, messageType);
                        } else {
                            Logger.Error(
                                `There was no registered handler for "${message}" - try adding one using registerMessageHandler(MessageDirection.FromStreamer, "${messageType}", myHandler)`
                            );
                        }
                        break;
                    default:
                        Logger.Error(`Unknown direction: ${direction}`);
                }
            });

            // Once the protocol has been received, we can send our control messages
            this.toStreamerMessagesController.SendRequestInitialSettings();
            this.toStreamerMessagesController.SendRequestQualityControl();
        } catch (e) {
            Logger.Info(e);
        }
    }

    /**
     * Handles an input control message when it is received from the streamer
     * @param message The input control message
     */
    onInputControlOwnership(message: ArrayBuffer) {
        const view = new Uint8Array(message);
        Logger.Info('DataChannelReceiveMessageType.InputControlOwnership');
        const inputControlOwnership = new Boolean(view[1]).valueOf();
        Logger.Info(
            `Received input controller message - will your input control the stream: ${inputControlOwnership}`
        );
        this.pixelStreaming._onInputControlOwnership(inputControlOwnership);
    }

    /**
     *
     * @param message
     */
    onGamepadResponse(message: ArrayBuffer) {
        const responseString = new TextDecoder('utf-16').decode(message.slice(1));
        const responseJSON = JSON.parse(responseString);
        this.gamePadController.onGamepadResponseReceived(responseJSON.controllerId);
    }

    onAfkTriggered(): void {
        this.afkController.onAfkClick();

        // if the stream is paused play it, if we can
        if (this.videoPlayer.isPaused() && this.videoPlayer.hasVideoSource()) {
            this.playStream();
        }
    }

    /**
     * Set whether we should timeout when afk.
     * @param afkEnabled If true we timeout when idle for some given amount of time.
     */
    setAfkEnabled(afkEnabled: boolean): void {
        if (afkEnabled) {
            this.onAfkTriggered();
        } else {
            this.afkController.stopAfkWarningTimer();
        }
    }

    /**
     * Attempt a reconnection to the signalling server. Manual trigger
     */
    tryReconnect(message: string) {
        this.forceReconnect = true;
        this.doReconnect(message);
    }

    /**
     * Does the actual reconnect work. Used by the auto reconnect feature to skip the manual flag.
     */
    doReconnect(message: string) {
        // if there is no webSocketController return immediately or this will not work
        if (!this.protocol) {
            Logger.Info('This player has no protocol connection.');
            return;
        }

        this.isReconnecting = true;

        // if the connection is open, first close it and force a reconnect.
        if (this.protocol.isConnected()) {
            if (!this.forceReconnect) {
                this.disconnectMessage = `${message} Reconnecting.`;
            }
            this.closeSignalingServer(message, true);
        } else {
            this.pixelStreaming._onWebRtcAutoConnect();
            this.connectToSignallingServer();
        }
    }

    /**
     * Loads a freeze frame if it is required otherwise shows the play overlay
     */
    loadFreezeFrameOrShowPlayOverlay() {
        this.pixelStreaming.dispatchEvent(
            new LoadFreezeFrameEvent({
                shouldShowPlayOverlay: this.shouldShowPlayOverlay,
                isValid: this.freezeFrameController.valid,
                jpegData: this.freezeFrameController.jpeg
            })
        );
        if (this.shouldShowPlayOverlay === true) {
            Logger.Info('showing play overlay');
            this.resizePlayerStyle();
        } else {
            Logger.Info('showing freeze frame');
            this.freezeFrameController.showFreezeFrame();
        }
        setTimeout(() => {
            this.videoPlayer.setVideoEnabled(false);
        }, this.freezeFrameController.freezeFrameDelay);
    }

    /**
     * Process the freeze frame and load it
     * @param message The freeze frame data in bytes
     */
    onFreezeFrameMessage(message: ArrayBuffer) {
        Logger.Info('DataChannelReceiveMessageType.FreezeFrame');
        const view = new Uint8Array(message);
        this.freezeFrameController.processFreezeFrameMessage(view, () =>
            this.loadFreezeFrameOrShowPlayOverlay()
        );
    }

    /**
     * Enable the video after hiding a freeze frame
     */
    invalidateFreezeFrameAndEnableVideo() {
        Logger.Info('DataChannelReceiveMessageType.FreezeFrame');
        setTimeout(() => {
            this.pixelStreaming.dispatchEvent(new HideFreezeFrameEvent());
            this.freezeFrameController.hideFreezeFrame();
        }, this.freezeFrameController.freezeFrameDelay);
        if (this.videoPlayer.getVideoElement()) {
            this.videoPlayer.setVideoEnabled(true);
        }
    }

    /**
     * Prep datachannel data for processing file extension
     * @param data the file extension data
     */
    onFileExtension(data: ArrayBuffer) {
        const view = new Uint8Array(data);
        FileUtil.setExtensionFromBytes(view, this.file);
    }

    /**
     * Prep datachannel data for processing the file mime type
     * @param data the file mime type data
     */
    onFileMimeType(data: ArrayBuffer) {
        const view = new Uint8Array(data);
        FileUtil.setMimeTypeFromBytes(view, this.file);
    }

    /**
     * Prep datachannel data for processing the file contents
     * @param data the file contents data
     */
    onFileContents(data: ArrayBuffer) {
        const view = new Uint8Array(data);
        FileUtil.setContentsFromBytes(view, this.file);
    }

    /**
     * Plays the stream audio and video source and sets up other pieces while the stream starts
     */
    playStream() {
        if (!this.videoPlayer.getVideoElement()) {
            const message =
                'Could not play video stream because the video player was not initialized correctly.';
            this.pixelStreaming.dispatchEvent(new PlayStreamErrorEvent({ message }));
            Logger.Error(message);

            // close the connection
            this.closeSignalingServer('Stream not initialized correctly', false);
            return;
        }

        if (!this.videoPlayer.hasVideoSource()) {
            Logger.Warning('Cannot play stream, the video element has no srcObject to play.');
            return;
        }

        this.setTouchInputEnabled(this.config.isFlagEnabled(Flags.TouchInput));
        this.pixelStreaming.dispatchEvent(new PlayStreamEvent());

        if (this.streamController.audioElement.srcObject) {
            const startMuted = this.config.isFlagEnabled(Flags.StartVideoMuted);
            this.streamController.audioElement.muted = startMuted;

            if (startMuted) {
                this.playVideo();
            } else {
                this.streamController.audioElement
                    .play()
                    .then(() => {
                        this.playVideo();
                    })
                    .catch((onRejectedReason) => {
                        Logger.Info(onRejectedReason);
                        Logger.Info(
                            'Browser does not support autoplaying video without interaction - to resolve this we are going to show the play button overlay.'
                        );
                        this.pixelStreaming.dispatchEvent(
                            new PlayStreamRejectedEvent({
                                reason: onRejectedReason
                            })
                        );
                    });
            }
        } else {
            this.playVideo();
        }

        this.shouldShowPlayOverlay = false;
        this.freezeFrameController.showFreezeFrame();
    }

    /**
     * Plays the video stream
     */
    private playVideo() {
        // handle play() with promise as it is an asynchronous call
        this.videoPlayer.play().catch((onRejectedReason: string) => {
            if (this.streamController.audioElement.srcObject) {
                this.streamController.audioElement.pause();
            }
            Logger.Info(onRejectedReason);
            Logger.Info(
                'Browser does not support autoplaying video without interaction - to resolve this we are going to show the play button overlay.'
            );
            this.pixelStreaming.dispatchEvent(new PlayStreamRejectedEvent({ reason: onRejectedReason }));
        });
    }

    /**
     * Enable the video to play automatically if enableAutoplay is true
     */
    autoPlayVideoOrSetUpPlayOverlay() {
        if (this.config.isFlagEnabled(Flags.AutoPlayVideo)) {
            // attempt to play the video
            this.playStream();
        }
        this.resizePlayerStyle();
    }

    /**
     * Connect to the Signaling server
     */
    connectToSignallingServer() {
        this.locallyClosed = false;
        this.enableAutoReconnect = true;
        this.disconnectMessage = null;
        const signallingUrl = this.signallingUrlBuilder();
        this.protocol.connect(signallingUrl);
        const keepaliveDelay = this.config.getNumericSettingValue(NumericParameters.KeepaliveDelay);
        if (keepaliveDelay > 0) {
            this.keepalive = new KeepaliveMonitor(this.protocol, keepaliveDelay);
            this.keepalive.onTimeout = () => {
                // if the ping fails just disconnect
                Logger.Error(`Protocol timeout`);
                this.protocol.disconnect();
            };
        }
    }

    /**
     * This will start the handshake to the signalling server
     * @param peerConfig  - RTC Configuration Options from the Signaling server
     * @remark RTC Peer Connection on Ice Candidate event have it handled by handle Send Ice Candidate
     */
    startSession(peerConfig: RTCConfiguration) {
        this.peerConfig = peerConfig;
        // check for forcing turn
        if (this.config.isFlagEnabled(Flags.ForceTURN)) {
            // check for a turn server
            const hasTurnServer = this.checkTurnServerAvailability(peerConfig);

            // close and error if turn is forced and there is no turn server
            if (!hasTurnServer) {
                Logger.Info(
                    'No turn server was found in the Peer Connection Options. TURN cannot be forced, closing connection. Please use STUN instead'
                );
                this.closeSignalingServer(
                    'TURN cannot be forced, closing connection. Please use STUN instead.',
                    false
                );
                return;
            }
        }

        // set up the peer connection controller
        this.peerConnectionController = new PeerConnectionController(
            this.peerConfig,
            this.config,
            this.preferredCodec
        );

        // set up peer connection controller video stats
        this.peerConnectionController.onVideoStats = (event: AggregatedStats) => {
            this.handleVideoStats(event);
        };

        /* Set event handler for latency information is calculated, handle the event by propogating to the PixelStreaming API */
        this.peerConnectionController.onLatencyCalculated = (latencyInfo: LatencyInfo) => {
            this.pixelStreaming._onLatencyCalculated(latencyInfo);
        };

        /* When our PeerConnection wants to send an offer call our handler */
        this.peerConnectionController.onSendWebRTCOffer = (offer: RTCSessionDescriptionInit) => {
            this.handleSendWebRTCOffer(offer);
        };

        /* Set event handler for when local description is set */
        this.peerConnectionController.onSetLocalDescription = (sdp: RTCSessionDescriptionInit) => {
            if (sdp.type === 'offer') {
                this.handleSendWebRTCOffer(sdp);
            } else if (sdp.type === 'answer') {
                this.handleSendWebRTCAnswer(sdp);
            } else {
                Logger.Error(
                    `PeerConnectionController onSetLocalDescription was called with unexpected type ${sdp.type}`
                );
            }
        };

        /* Event handler for when PeerConnection's remote description is set */
        this.peerConnectionController.onSetRemoteDescription = (sdp: RTCSessionDescriptionInit) => {
            if (sdp.type === 'offer') {
                this.pixelStreaming._onWebRtcSdpOffer(sdp);
            } else if (sdp.type === 'answer') {
                this.pixelStreaming._onWebRtcSdpAnswer(sdp);
            } else {
                Logger.Error(
                    `PeerConnectionController onSetRemoteDescription was called with unexpected type ${sdp.type}`
                );
            }
        };

        /* When the Peer Connection ice candidate is added have it handled */
        this.peerConnectionController.onPeerIceCandidate = (
            peerConnectionIceEvent: RTCPeerConnectionIceEvent
        ) => this.handleSendIceCandidate(peerConnectionIceEvent);

        /* When the Peer Connection has a data channel created for it by the browser, handle it */
        this.peerConnectionController.onDataChannel = (datachannelEvent: RTCDataChannelEvent) =>
            this.handleDataChannel(datachannelEvent);

        // set up webRtc text overlays
        this.peerConnectionController.showTextOverlayConnecting = () =>
            this.pixelStreaming._onWebRtcConnecting();
        this.peerConnectionController.showTextOverlaySetupFailure = () =>
            this.pixelStreaming._onWebRtcFailed();
        let webRtcConnectedSent = false;
        this.peerConnectionController.onIceConnectionStateChange = () => {
            // Browsers emit "connected" when getting first connection and "completed" when finishing
            // candidate checking. However, sometimes browsers can skip "connected" and only emit "completed".
            // Therefore need to check both cases and emit onWebRtcConnected only once on the first hit.
            if (
                !webRtcConnectedSent &&
                ['connected', 'completed'].includes(
                    this.peerConnectionController.peerConnection.iceConnectionState
                )
            ) {
                this.pixelStreaming._onWebRtcConnected();
                webRtcConnectedSent = true;
            }
        };

        /* RTC Peer Connection on Track event -> handle on track */
        this.peerConnectionController.onTrack = (trackEvent: RTCTrackEvent) =>
            this.streamController.handleOnTrack(trackEvent);

        const BrowserSendOffer = this.config.isFlagEnabled(Flags.BrowserSendOffer);
        if (BrowserSendOffer) {
            // If browser is sending the offer, create an offer and send it to the streamer
            this.sendrecvDataChannelController.createDataChannel(
                this.peerConnectionController.peerConnection,
                'cirrus',
                this.datachannelOptions
            );
            this.sendrecvDataChannelController.handleOnMessage = (ev: MessageEvent<ArrayBuffer>) =>
                this.handleOnMessage(ev);
            this.peerConnectionController.createOffer(this.sdpConstraints, this.config);
        }
    }

    /**
     * Checks the peer connection options for a turn server and returns true or false
     */
    checkTurnServerAvailability(options: RTCConfiguration) {
        // if iceServers is empty return false this should not be the general use case but is here incase
        if (!options.iceServers) {
            Logger.Info('A turn sever was not found');
            return false;
        }

        // loop through the ice servers to check for a turn url
        for (const iceServer of options.iceServers) {
            for (const url of iceServer.urls) {
                if (url.includes('turn')) {
                    Logger.Info(`A turn sever was found at ${url}`);
                    return true;
                }
            }
        }

        Logger.Info('A turn sever was not found');
        return false;
    }

    /**
     * Handles when a Config Message is received contains the Peer Connection Options required (STUN and TURN Server Info)
     * @param messageConfig - Config Message received from the signaling server
     */
    handleOnConfigMessage(messageConfig: Messages.config) {
        this.resizePlayerStyle();

        // Tell the WebRtcController to start a session with the peer options sent from the signaling server
        this.startSession(messageConfig.peerConnectionOptions);
    }

    handlePingMessage(pingMessage: Messages.ping) {
        this.protocol.sendMessage(MessageHelpers.createMessage(Messages.pong, { time: pingMessage.time }));
    }

    /**
     * Handles when the signalling server gives us the list of streamer ids.
     */
    handleStreamerListMessage(messageStreamerList: Messages.streamerList) {
        Logger.Info(`Got streamer list ${messageStreamerList.ids}`);

        let wantedStreamerId: string = '';

        // get the current selected streamer id option
        const streamerIDOption = this.config.getSettingOption(OptionParameters.StreamerId);
        const existingSelection = streamerIDOption.selected.toString().trim();
        if (existingSelection) {
            // default to selected option if it exists
            wantedStreamerId = streamerIDOption.selected;
        }

        // add the streamers to the UI
        const settingOptions = [...messageStreamerList.ids]; // copy the original messageStreamerList.ids
        settingOptions.unshift(''); // add an empty option at the top
        this.config.setOptionSettingOptions(OptionParameters.StreamerId, settingOptions);

        let autoSelectedStreamerId: string = '';
        const waitForStreamer = this.config.isFlagEnabled(Flags.WaitForStreamer);
        const reconnectLimit = this.config.getNumericSettingValue(NumericParameters.MaxReconnectAttempts);
        const reconnectDelay = this.config.getNumericSettingValue(NumericParameters.StreamerAutoJoinInterval);

        // first we figure out a wanted streamer id through various means
        const useUrlParams = this.config.useUrlParams;
        const urlParams = new IURLSearchParams(window.location.search);
        if (useUrlParams && urlParams.has(OptionParameters.StreamerId)) {
            // if we've set the streamer id on the url we only want that streamer id
            wantedStreamerId = urlParams.get(OptionParameters.StreamerId);
        } else if (this.subscribedStream) {
            // we were previously subscribed to a streamer, we want that
            wantedStreamerId = this.subscribedStream;
        }

        // now lets see if we can pick it.
        if (wantedStreamerId && messageStreamerList.ids.includes(wantedStreamerId)) {
            // if the wanted stream is in the list. we pick that
            autoSelectedStreamerId = wantedStreamerId;
        } else if ((!wantedStreamerId || !waitForStreamer) && messageStreamerList.ids.length == 1) {
            // otherwise, if we're not waiting for the wanted streamer and there's only one streamer, connect to it
            autoSelectedStreamerId = messageStreamerList.ids[0];
        }

        // if we found a streamer id to auto select, select it
        if (autoSelectedStreamerId) {
            this.reconnectAttempt = 0;
            this.isReconnecting = false;
            this.config.setOptionSettingValue(OptionParameters.StreamerId, autoSelectedStreamerId);
        } else {
            // no auto selected streamer.
            // if we're waiting for a streamer then try reconnecting
            if (waitForStreamer) {
                if (this.reconnectAttempt < reconnectLimit) {
                    // still reconnects available
                    this.reconnectAttempt++;
                    this.isReconnecting = true;
                    setTimeout(() => {
                        this.protocol.sendMessage(MessageHelpers.createMessage(Messages.listStreamers));
                    }, reconnectDelay);
                } else {
                    // We've exhausted our reconnect attempts, return to main screen
                    this.reconnectAttempt = 0;
                    this.isReconnecting = false;
                    this.enableAutoReconnect = false;
                }
            }
        }

        // dispatch this event finally
        this.pixelStreaming.dispatchEvent(
            new StreamerListMessageEvent({
                messageStreamerList,
                autoSelectedStreamerId,
                wantedStreamerId
            })
        );
    }

    handleSubscribeFailedMessage(subscribeFailedMessage: Messages.subscribeFailed) {
        this.reconnectAttempt = 0;
        this.isReconnecting = false;
        this.enableAutoReconnect = false;
        this.pixelStreaming._onSubscribeFailed(subscribeFailedMessage.message);
    }

    handleStreamerIDChangedMessage(streamerIDChangedMessage: Messages.streamerIdChanged) {
        const newID = streamerIDChangedMessage.newID;

        // need to edit the selected streamer in the settings list
        const streamerListOptions = this.config.getSettingOption(OptionParameters.StreamerId);

        // temporarily prevent onChange from firing (it would try to subscribe to the streamer again)
        const oldOnChange = streamerListOptions.onChange;
        streamerListOptions.onChange = () => {};

        // change the selected entry.
        const streamerList = streamerListOptions.options;
        for (let i = 0; i < streamerList.length; ++i) {
            if (streamerList[i] == this.subscribedStream) {
                streamerList[i] = newID;
                break;
            }
        }

        // update the list
        streamerListOptions.options = streamerList;

        // update the selected entry
        streamerListOptions.selected = newID;

        // restore the old change notifier.
        streamerListOptions.onChange = oldOnChange;

        // remember which stream we're subscribe to
        this.subscribedStream = streamerIDChangedMessage.newID;

        // notify any listeners
        this.pixelStreaming.dispatchEvent(
            new StreamerIDChangedMessageEvent({
                newID
            })
        );
    }

    /**
     * Handle the RTC Answer from the signaling server
     * @param Answer - Answer SDP from the peer.
     */
    handleWebRtcAnswer(Answer: Messages.answer) {
        Logger.Info(`Got answer sdp ${Answer.sdp}`);

        // Extract the player id if it is present
        if (Answer.playerId) {
            this.playerId = Answer.playerId;
        }

        const sdpAnswer: RTCSessionDescriptionInit = {
            sdp: Answer.sdp,
            type: 'answer'
        };

        this.peerConnectionController.receiveAnswer(sdpAnswer);
        this.handlePostWebrtcNegotiation();
    }

    /**
     * Handle the RTC offer from a WebRTC peer (received through the signalling server).
     * @param Offer - Offer SDP from the peer.
     */
    handleWebRtcOffer(Offer: Messages.offer) {
        Logger.Info(`Got offer sdp ${Offer.sdp}`);

        // Extract the player id if it is present
        if (Offer.playerId) {
            this.playerId = Offer.playerId;
        }

        this.isUsingSFU = Offer.sfu ? Offer.sfu : false;
        this.isUsingSVC = Offer.scalabilityMode ? Offer.scalabilityMode != 'L1T1' : false;
        if (this.isUsingSFU || this.isUsingSVC) {
            // Disable negotiating with the sfu as the sfu only supports one codec at a time
            this.peerConnectionController.preferredCodec = '';
        }

        // NOTE: These two settings configurations are done outside of an if(this.isUsingSFU) so that users
        // can switch between a default and SFU stream and have the settings reconfigure appropriately

        const scalabilityMode = Offer.scalabilityMode ? Offer.scalabilityMode : 'L1T1';
        let availableQualities = ['Default'];
        if (this.isUsingSFU) {
            if (!this.isUsingSVC) {
                // User is using an SFU without any temporal scalability. Just offer easily readable names
                availableQualities = ['High', 'Medium', 'Low'];
            } else {
                // User is using SVC. Generate all available options.
                availableQualities = [];
                const maxSpatialLayers = +scalabilityMode[1];
                const maxTemporalLayers = +scalabilityMode[3];
                for (let s = 1; s <= maxSpatialLayers; s++) {
                    for (let t = 1; t <= maxTemporalLayers; t++) {
                        availableQualities.push(`S${s}T${t}`);
                    }
                }
            }
        }

        // Update the possible video quality options
        this.config.setOptionSettingOptions(OptionParameters.PreferredQuality, availableQualities);

        // Update the selected video quality with the highest possible resolution
        this.config.setOptionSettingValue(OptionParameters.PreferredQuality, availableQualities[0]);

        const sdpOffer: RTCSessionDescriptionInit = {
            sdp: Offer.sdp,
            type: 'offer'
        };

        this.peerConnectionController.receiveOffer(sdpOffer, this.config);
        this.handlePostWebrtcNegotiation();
    }

    /**
     * Handle when the SFU provides the peer with its data channels
     * @param DataChannels - The message from the SFU containing the data channels ids
     */
    handleWebRtcSFUPeerDatachannels(DataChannels: Messages.peerDataChannels) {
        const SendOptions: RTCDataChannelInit = {
            ordered: true,
            negotiated: true,
            id: DataChannels.sendStreamId
        };

        const unidirectional = DataChannels.sendStreamId != DataChannels.recvStreamId;

        this.sendrecvDataChannelController.createDataChannel(
            this.peerConnectionController.peerConnection,
            unidirectional ? 'send-datachannel' : 'datachannel',
            SendOptions
        );

        if (unidirectional) {
            const RecvOptions: RTCDataChannelInit = {
                ordered: true,
                negotiated: true,
                id: DataChannels.recvStreamId
            };

            this.recvDataChannelController.createDataChannel(
                this.peerConnectionController.peerConnection,
                'recv-datachannel',
                RecvOptions
            );
            this.recvDataChannelController.handleOnOpen = () =>
                this.protocol.sendMessage(MessageHelpers.createMessage(Messages.peerDataChannelsReady));
            // If we're uni-directional, only the recv data channel should handle incoming messages
            this.recvDataChannelController.handleOnMessage = (ev: MessageEvent) => this.handleOnMessage(ev);
        } else {
            // else our primary datachannel is send/recv so it can handle incoming messages
            this.sendrecvDataChannelController.handleOnMessage = (ev: MessageEvent) =>
                this.handleOnMessage(ev);
        }
    }

    handlePostWebrtcNegotiation() {
        // start the afk warning timer as PS is now running
        this.afkController.startAfkWarningTimer();
        // show the overlay that we have negotiated a connection
        this.pixelStreaming._onWebRtcSdp();

        if (this.statsTimerHandle && this.statsTimerHandle !== undefined) {
            window.clearInterval(this.statsTimerHandle);
        }

        this.statsTimerHandle = window.setInterval(() => this.getStats(), 1000);

        /*  */
        this.setMouseInputEnabled(this.config.isFlagEnabled(Flags.MouseInput));
        this.setKeyboardInputEnabled(this.config.isFlagEnabled(Flags.KeyboardInput));
        this.setGamePadInputEnabled(this.config.isFlagEnabled(Flags.GamepadInput));
    }

    /**
     * Handler for when a remote ICE candidate is received.
     * @param iceCandidateInit - Initialization data used to make the actual ICE Candidate.
     */
    handleIceCandidate(iceCandidateInit: RTCIceCandidateInit) {
        Logger.Info(`Remote ICE candidate information received: ${JSON.stringify(iceCandidateInit)}`);

        // We are using "bundle" policy for media lines so we manually set the sdpMLineIndex attribute to 0 (our assumed bundle master media line)
        // If we don't do this the browser may be unable to form a media connection
        // because some browsers are brittle if the bundle master doesn't get a candidate first.
        // Note: This assumes we are using bundle and that the bundle master is the first media line (0).
        const remoteIceCandidate = new RTCIceCandidate({
            candidate: iceCandidateInit.candidate,
            sdpMLineIndex: 0
        });

        this.peerConnectionController.handleOnIce(remoteIceCandidate);
    }

    /**
     * Send the ice Candidate to the signaling server via websocket
     * @param iceEvent - RTC Peer ConnectionIceEvent) {
     */
    handleSendIceCandidate(iceEvent: RTCPeerConnectionIceEvent) {
        if (iceEvent.candidate && iceEvent.candidate.candidate) {
            Logger.Info(`Local ICE candidate generated: ` + JSON.stringify(iceEvent.candidate));
            this.protocol.sendMessage(
                MessageHelpers.createMessage(Messages.iceCandidate, { candidate: iceEvent.candidate })
            );
        }
    }

    /**
     * Send the ice Candidate to the signaling server via websocket
     * @param iceEvent - RTC Peer ConnectionIceEvent) {
     */
    handleDataChannel(datachannelEvent: RTCDataChannelEvent) {
        Logger.Info('Data channel created for us by browser as we are a receiving peer.');
        this.sendrecvDataChannelController.dataChannel = datachannelEvent.channel;
        // Data channel was created for us, so we just need to setup its callbacks and array type
        this.sendrecvDataChannelController.setupDataChannel();
        this.sendrecvDataChannelController.handleOnMessage = (ev: MessageEvent<ArrayBuffer>) =>
            this.handleOnMessage(ev);
    }

    /**
     * Send the RTC Offer Session to the Signaling server via websocket
     * @param offer - RTC Session Description
     */
    handleSendWebRTCOffer(offer: RTCSessionDescriptionInit) {
        if (offer.type !== 'offer') {
            Logger.Error(
                `handleSendWebRTCOffer was called with type ${offer.type} - it only expects "offer"`
            );
            return;
        }

        Logger.Info('Sending the offer to the Server');

        const extraParams = {
            sdp: offer.sdp,
            minBitrateBps: 1000 * this.config.getNumericSettingValue(NumericParameters.WebRTCMinBitrate),
            maxBitrateBps: 1000 * this.config.getNumericSettingValue(NumericParameters.WebRTCMaxBitrate)
        };

        this.protocol.sendMessage(MessageHelpers.createMessage(Messages.offer, extraParams));

        // Send offer back to Pixel Streaming main class for event dispatch
        this.pixelStreaming._onWebRtcSdpOffer(offer);
    }

    /**
     * Send the RTC Offer Session to the Signaling server via websocket
     * @param answer - RTC Session Description
     */
    handleSendWebRTCAnswer(answer: RTCSessionDescriptionInit) {
        if (answer.type !== 'answer') {
            Logger.Error(
                `handleSendWebRTCAnswer was called with type ${answer.type} - it only expects "answer"`
            );
            return;
        }

        Logger.Info('Sending the answer to the Server');

        const extraParams = {
            sdp: answer.sdp,
            minBitrateBps: 1000 * this.config.getNumericSettingValue(NumericParameters.WebRTCMinBitrate),
            maxBitrateBps: 1000 * this.config.getNumericSettingValue(NumericParameters.WebRTCMaxBitrate)
        };

        this.protocol.sendMessage(MessageHelpers.createMessage(Messages.answer, extraParams));

        if (this.isUsingSFU) {
            this.protocol.sendMessage(MessageHelpers.createMessage(Messages.dataChannelRequest));
        }

        // Send answer back to Pixel Streaming main class for event dispatch
        this.pixelStreaming._onWebRtcSdpAnswer(answer);
    }

    /**
     * Set the freeze frame overlay to the player div
     */
    setUpMouseAndFreezeFrame() {
        // Calculating and normalizing positions depends on the width and height of the player.
        const playerElement = this.videoPlayer.getVideoParentElement();
        const videoElement = this.videoPlayer.getVideoElement();
        this.coordinateConverter.reconfigure(
            { width: playerElement.clientWidth, height: playerElement.clientHeight },
            { width: videoElement.videoWidth, height: videoElement.videoHeight }
        );
        this.freezeFrameController.freezeFrame.resize();
    }

    /**
     * Close the Connection to the signaling server
     */
    closeSignalingServer(message: string, allowReconnect: boolean) {
        this.locallyClosed = true;
        this.enableAutoReconnect = allowReconnect;
        this.disconnectMessage = message;
        this.protocol?.disconnect(1000, message);
    }

    /**
     * Close the peer connection
     */
    closePeerConnection() {
        this.peerConnectionController?.close();
    }

    /**
     * Close all connections
     */
    close() {
        this.closeSignalingServer('', false);
        this.closePeerConnection();
    }

    /**
     * Fires a Video Stats Event in the RTC Peer Connection
     */
    getStats() {
        this.peerConnectionController.generateStats();
    }

    /**
     * Send a Latency Test Request to the UE Instance
     */
    sendLatencyTest() {
        this.latencyStartTime = Date.now();

        this.streamMessageController.toStreamerHandlers.get('LatencyTest')([
            JSON.stringify({
                StartTime: this.latencyStartTime
            })
        ]);
    }

    /**
     * Send a Data Channel Latency Test Request to the UE Instance
     */
    sendDataChannelLatencyTest(descriptor: DataChannelLatencyTestRequest) {
        this.streamMessageController.toStreamerHandlers.get('DataChannelLatencyTest')([
            JSON.stringify(descriptor)
        ]);
    }

    /**
     * Send the MinQP encoder setting to the UE Instance.
     * @param minQP - The lower bound for QP when encoding
     * valid values are (1-51) where:
     * 1 = Best quality but highest bitrate.
     * 51 = Worst quality but lowest bitrate.
     * By default the minQP is 1 meaning the encoder is free
     * to aim for the best quality it can on the given network link.
     */
    sendEncoderMinQP(minQP: number) {
        Logger.Info(`MinQP=${minQP}\n`);

        if (minQP != null) {
            this.streamMessageController.toStreamerHandlers.get('Command')([
                JSON.stringify({
                    'Encoder.MinQP': minQP
                })
            ]);
        }
    }

    /**
     * Send the MaxQP encoder setting to the UE Instance.
     * @param maxQP - The upper bound for QP when encoding
     * valid values are (1-51) where:
     * 1 = Best quality but highest bitrate.
     * 51 = Worst quality but lowest bitrate.
     * By default the maxQP is 51 meaning the encoder is free
     * to drop quality as low as needed on the given network link.
     */
    sendEncoderMaxQP(maxQP: number) {
        Logger.Info(`MaxQP=${maxQP}\n`);

        if (maxQP != null) {
            this.streamMessageController.toStreamerHandlers.get('Command')([
                JSON.stringify({
                    'Encoder.MaxQP': maxQP
                })
            ]);
        }
    }

    /**
     * Send the MinQuality encoder setting to the UE Instance.
     * @param minQuality - The lower bound for quality when encoding
     * valid values are (0-100) where:
     * 0 = Worst quality.
     * 100 = Best quality.
     */
    sendEncoderMinQuality(minQuality: number) {
        Logger.Info(`MinQuality=${minQuality}\n`);

        if (minQuality != null) {
            this.streamMessageController.toStreamerHandlers.get('Command')([
                JSON.stringify({
                    'Encoder.MinQuality': minQuality
                })
            ]);
        }
    }

    /**
     * Send the MaxQuality encoder setting to the UE Instance.
     * @param maxQuality - The upper bound for quality when encoding
     * valid values are (0-100) where:
     * 0 = Worst quality.
     * 100 = Best quality.
     */
    sendEncoderMaxQuality(maxQuality: number) {
        Logger.Info(`MaxQuality=${maxQuality}\n`);

        if (maxQuality != null) {
            this.streamMessageController.toStreamerHandlers.get('Command')([
                JSON.stringify({
                    'Encoder.MaxQuality': maxQuality
                })
            ]);
        }
    }

    /**
     * Send the { WebRTC.MinBitrate: SomeNumber }} command to UE to set
     * the minimum bitrate that we allow WebRTC to use
     * (note setting this too high in poor networks can be problematic).
     * @param minBitrate - The minimum bitrate we would like WebRTC to not fall below.
     */
    sendWebRTCMinBitrate(minBitrate: number) {
        Logger.Info(`WebRTC Min Bitrate=${minBitrate}`);
        if (minBitrate != null) {
            this.streamMessageController.toStreamerHandlers.get('Command')([
                JSON.stringify({
                    'WebRTC.MinBitrate': minBitrate
                })
            ]);
        }
    }

    /**
     * Send the { WebRTC.MaxBitrate: SomeNumber }} command to UE to set
     * the minimum bitrate that we allow WebRTC to use
     * (note setting this too low could result in blocky video).
     * @param minBitrate - The minimum bitrate we would like WebRTC to not fall below.
     */
    sendWebRTCMaxBitrate(maxBitrate: number) {
        Logger.Info(`WebRTC Max Bitrate=${maxBitrate}`);
        if (maxBitrate != null) {
            this.streamMessageController.toStreamerHandlers.get('Command')([
                JSON.stringify({
                    'WebRTC.MaxBitrate': maxBitrate
                })
            ]);
        }
    }

    /**
     * Send the { WebRTC.Fps: SomeNumber }} UE 5.0+
     * and { WebRTC.MaxFps } UE 4.27 command to set
     * the maximum fps we would like WebRTC to stream at.
     * @param fps - The maximum stream fps.
     */
    sendWebRTCFps(fps: number) {
        Logger.Info(`WebRTC FPS=${fps}`);
        if (fps != null) {
            this.streamMessageController.toStreamerHandlers.get('Command')([
                JSON.stringify({ 'WebRTC.Fps': fps })
            ]);

            /* TODO: Remove when UE 4.27 unsupported. */
            this.streamMessageController.toStreamerHandlers.get('Command')([
                JSON.stringify({ 'WebRTC.MaxFps': fps })
            ]);
        }
    }

    /**
     * Sends the UI Descriptor `stat fps` to the UE Instance
     */
    sendShowFps(): void {
        Logger.Info('----   Sending show stat to UE   ----');

        this.streamMessageController.toStreamerHandlers.get('Command')([JSON.stringify({ 'stat.fps': '' })]);
    }

    /**
     * Send an Iframe request to the streamer
     */
    sendIframeRequest(): void {
        Logger.Info('----   Sending Request for an IFrame  ----');
        this.streamMessageController.toStreamerHandlers.get('IFrameRequest')();
    }

    /**
     * Send a UIInteraction message
     */
    emitUIInteraction(descriptor: object | string) {
        Logger.Info('----   Sending custom UIInteraction message   ----');

        this.streamMessageController.toStreamerHandlers.get('UIInteraction')([JSON.stringify(descriptor)]);
    }

    /**
     * Send a Command message
     */
    emitCommand(descriptor: object) {
        Logger.Info('----   Sending custom Command message   ----');

        this.streamMessageController.toStreamerHandlers.get('Command')([JSON.stringify(descriptor)]);
    }

    /**
     * Send raw bytes through the data channel for a registered to-streamer
     * message type. See {@link SendMessageController.sendBytesToStreamer}.
     */
    emitData(messageType: string, bytes: Uint8Array | ArrayBuffer): boolean {
        return this.sendMessageController.sendBytesToStreamer(messageType, bytes);
    }

    /**
     * Send a console command message
     */
    emitConsoleCommand(command: string) {
        Logger.Info('----   Sending custom Command:ConsoleCommand message   ----');

        this.streamMessageController.toStreamerHandlers.get('Command')([
            JSON.stringify({
                ConsoleCommand: command
            })
        ]);
    }

    /**
     * Sends a request to the UE Instance to have ownership of Quality
     */
    sendRequestQualityControlOwnership(): void {
        Logger.Info('----   Sending Request to Control Quality  ----');
        this.toStreamerMessagesController.SendRequestQualityControl();
    }

    /**
     * Send a `TextBoxEntry` message back to UE.
     * @param contents The new contents of the UE side text box.
     */
    sendTextboxEntry(contents: string) {
        Logger.Info('----   Sending TextboxEntry message  ----');
        this.streamMessageController.toStreamerHandlers.get('TextboxEntry')?.([contents]);
    }

    /**
     * Handles when a Latency Test Result are received from the UE Instance
     * @param message - Latency Test Timings
     */
    handleLatencyTestResult(message: ArrayBuffer) {
        Logger.Info('DataChannelReceiveMessageType.latencyTest');
        const latencyAsString = new TextDecoder('utf-16').decode(message.slice(1));
        const latencyTestResults: LatencyTestResults = new LatencyTestResults();
        Object.assign(latencyTestResults, JSON.parse(latencyAsString));
        latencyTestResults.processFields();

        latencyTestResults.testStartTimeMs = this.latencyStartTime;
        latencyTestResults.browserReceiptTimeMs = Date.now();

        latencyTestResults.latencyExcludingDecode = ~~(
            latencyTestResults.browserReceiptTimeMs - latencyTestResults.testStartTimeMs
        );
        latencyTestResults.testDuration = ~~(
            latencyTestResults.TransmissionTimeMs - latencyTestResults.ReceiptTimeMs
        );
        latencyTestResults.networkLatency = ~~(
            latencyTestResults.latencyExcludingDecode - latencyTestResults.testDuration
        );

        if (latencyTestResults.frameDisplayDeltaTimeMs && latencyTestResults.browserReceiptTimeMs) {
            latencyTestResults.endToEndLatency = ~~(latencyTestResults.frameDisplayDeltaTimeMs +
                latencyTestResults.networkLatency,
            +latencyTestResults.CaptureToSendMs);
        }
        this.pixelStreaming._onLatencyTestResult(latencyTestResults);
    }

    /**
     * Handles when a Data Channel Latency Test Response is received from the UE Instance
     * @param message - Data Channel Latency Test Response
     */
    handleDataChannelLatencyTestResponse(message: ArrayBuffer) {
        Logger.Info('DataChannelReceiveMessageType.dataChannelLatencyResponse');
        const responseAsString = new TextDecoder('utf-16').decode(message.slice(1));
        const latencyTestResponse: DataChannelLatencyTestResponse = JSON.parse(responseAsString);
        this.pixelStreaming._onDataChannelLatencyTestResponse(latencyTestResponse);
    }

    /**
     * Handles when the Encoder and Web RTC Settings are received from the UE Instance
     * @param message - Initial Encoder and Web RTC Settings
     */
    handleInitialSettings(message: ArrayBuffer) {
        Logger.Info('DataChannelReceiveMessageType.InitialSettings');
        const payloadAsString = new TextDecoder('utf-16').decode(message.slice(1));
        const parsedInitialSettings = JSON.parse(payloadAsString);

        const initialSettings: InitialSettings = new InitialSettings();

        if (parsedInitialSettings.Encoder) {
            initialSettings.EncoderSettings = parsedInitialSettings.Encoder;
        }

        if (parsedInitialSettings.WebRTC) {
            initialSettings.WebRTCSettings = parsedInitialSettings.WebRTC;
        }

        if (parsedInitialSettings.PixelStreaming) {
            initialSettings.PixelStreamingSettings = parsedInitialSettings.PixelStreaming;
        }

        if (
            parsedInitialSettings.ConfigOptions &&
            parsedInitialSettings.ConfigOptions.DefaultToHover !== undefined
        ) {
            this.config.setFlagEnabled(
                Flags.HoveringMouseMode,
                !!parsedInitialSettings.ConfigOptions.DefaultToHover
            );
        }

        initialSettings.ueCompatible();
        Logger.Info(payloadAsString);

        this.pixelStreaming._onInitialSettings(initialSettings);
    }

    /**
     * Handles when the Quantization Parameter are received from the UE Instance
     * @param message - Encoders Quantization Parameter
     */
    handleVideoEncoderAvgQP(message: ArrayBuffer) {
        Logger.Info('DataChannelReceiveMessageType.VideoEncoderAvgQP');
        const AvgQP = Number(new TextDecoder('utf-16').decode(message.slice(1)));
        this.setVideoEncoderAvgQP(AvgQP);
    }

    /**
     * Handles when the video element has been loaded with a srcObject
     */
    handleVideoInitialized() {
        this.pixelStreaming._onVideoInitialized();

        // either autoplay the video or set up the play overlay
        this.autoPlayVideoOrSetUpPlayOverlay();
        this.resizePlayerStyle();
        this.videoPlayer.updateVideoStreamSize();
    }

    /**
     * Flag set if the user has Quality Ownership
     * @param message - Does the current client have Quality Ownership
     */
    onQualityControlOwnership(message: ArrayBuffer) {
        const view = new Uint8Array(message);
        Logger.Info('DataChannelReceiveMessageType.QualityControlOwnership');
        this.isQualityController = new Boolean(view[1]).valueOf();
        Logger.Info(`Received quality controller message, will control quality: ${this.isQualityController}`);
        this.pixelStreaming._onQualityControlOwnership(this.isQualityController);
    }

    /**
     * Handles when the Aggregated stats are Collected
     * @param stats - Aggregated Stats
     */
    handleVideoStats(stats: AggregatedStats) {
        this.pixelStreaming._onVideoStats(stats);
    }

    /**
     * To Resize the Video Player element
     */
    resizePlayerStyle(): void {
        this.videoPlayer.resizePlayerStyle();
    }

    setPreferredCodec(codec: string) {
        this.preferredCodec = codec;
        if (this.peerConnectionController) {
            this.peerConnectionController.preferredCodec = codec;
            this.peerConnectionController.updateCodecSelection = false;
        }
    }

    setVideoEncoderAvgQP(avgQP: number) {
        this.videoAvgQp = avgQP;
        this.pixelStreaming._onVideoEncoderAvgQP(this.videoAvgQp);
    }

    /**
     * enables/disables keyboard event listeners
     */
    setKeyboardInputEnabled(isEnabled: boolean) {
        this.keyboardController?.unregister();
        if (isEnabled) {
            this.keyboardController = this.inputClassesFactory.registerKeyBoard(this.config);
        }
    }

    /**
     * enables/disables mouse event listeners
     */
    setMouseInputEnabled(isEnabled: boolean) {
        this.mouseController?.unregister();
        if (isEnabled) {
            const mouseMode = this.config.isFlagEnabled(Flags.HoveringMouseMode)
                ? ControlSchemeType.HoveringMouse
                : ControlSchemeType.LockedMouse;
            this.mouseController = this.inputClassesFactory.registerMouse(mouseMode, this.config);
        }
    }

    /**
     * enables/disables touch event listeners
     */
    setTouchInputEnabled(isEnabled: boolean) {
        this.touchController?.unregister();
        if (isEnabled) {
            this.touchController = this.inputClassesFactory.registerTouch(
                this.config.isFlagEnabled(Flags.FakeMouseWithTouches)
            );
        }
    }

    /**
     * enables/disables game pad event listeners
     */
    setGamePadInputEnabled(isEnabled: boolean) {
        this.gamePadController?.unregister();
        if (isEnabled) {
            this.gamePadController = this.inputClassesFactory.registerGamePad();
        }
    }

    registerDataChannelEventEmitters(dataChannel: DataChannelController) {
        dataChannel.onOpen = (label, event) =>
            this.pixelStreaming.dispatchEvent(new DataChannelOpenEvent({ label, event }));
        dataChannel.onClose = (label, event) =>
            this.pixelStreaming.dispatchEvent(new DataChannelCloseEvent({ label, event }));
        dataChannel.onError = (label, event) =>
            this.pixelStreaming.dispatchEvent(new DataChannelErrorEvent({ label, event }));
    }

    public registerMessageHandler(
        name: string,
        direction: MessageDirection,
        handler?: (data: ArrayBuffer | Array<number | string>) => void
    ) {
        if (direction === MessageDirection.FromStreamer && typeof handler === 'undefined') {
            Logger.Warning(`Unable to register handler for ${name} as no handler was passed`);
        }

        this.streamMessageController.registerMessageHandler(
            direction,
            name,
            (data: Array<number | string>) =>
                typeof handler === 'undefined' && direction === MessageDirection.ToStreamer
                    ? this.sendMessageController.sendMessageToStreamer(name, data)
                    : handler(data)
        );
    }
}

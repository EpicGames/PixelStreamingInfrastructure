// Copyright Epic Games, Inc. All Rights Reserved.

import { WebSocketController } from '../WebSockets/WebSocketController';
import { StreamController } from '../VideoPlayer/StreamController';
import {
    MessageAnswer,
    MessageOffer,
    MessageConfig,
    MessageStreamerList
} from '../WebSockets/MessageReceive';
import { FreezeFrameController } from '../FreezeFrame/FreezeFrameController';
import { AFKController } from '../AFK/AFKController';
import { DataChannelController } from '../DataChannel/DataChannelController';
import { PeerConnectionController } from '../PeerConnectionController/PeerConnectionController';
import { KeyboardController } from '../Inputs/KeyboardController';
import { AggregatedStats } from '../PeerConnectionController/AggregatedStats';
import {
    Config,
    Flags,
    ControlSchemeType,
    TextParameters,
    OptionParameters,
    NumericParameters
} from '../Config/Config';
import {
    EncoderSettings,
    InitialSettings,
    WebRTCSettings
} from '../DataChannel/InitialSettings';
import { LatencyTestResults } from '../DataChannel/LatencyTestResults';
import { Logger } from '../Logger/Logger';
import { FileTemplate, FileUtil } from '../Util/FileUtil';
import { InputClassesFactory } from '../Inputs/InputClassesFactory';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
import {
    StreamMessageController,
    MessageDirection
} from '../UeInstanceMessage/StreamMessageController';
import { ResponseController } from '../UeInstanceMessage/ResponseController';
import * as MessageReceive from '../WebSockets/MessageReceive';
import { MessageOnScreenKeyboard } from '../WebSockets/MessageReceive';
import { SendMessageController } from '../UeInstanceMessage/SendMessageController';
import { ToStreamerMessagesController } from '../UeInstanceMessage/ToStreamerMessagesController';
import { MouseController } from '../Inputs/MouseController';
import { GamePadController } from '../Inputs/GamepadController';
import { DataChannelSender } from '../DataChannel/DataChannelSender';
import {
    CoordinateConverter,
    UnquantizedDenormalizedUnsignedCoord
} from '../Util/CoordinateConverter';
import { PixelStreaming } from '../PixelStreaming/PixelStreaming';
import { ITouchController } from '../Inputs/ITouchController';
import {
    DataChannelCloseEvent,
    DataChannelErrorEvent,
    DataChannelOpenEvent,
    HideFreezeFrameEvent,
    LoadFreezeFrameEvent,
    PlayStreamErrorEvent,
    PlayStreamEvent,
    PlayStreamRejectedEvent,
    StreamerListMessageEvent
} from '../Util/EventEmitter';
import {
    DataChannelLatencyTestRequest,
    DataChannelLatencyTestResponse
} from "../DataChannel/DataChannelLatencyTestResults";
/**
 * Entry point for the WebRTC Player
 */
export class WebRtcPlayerController {
    config: Config;
    responseController: ResponseController;
    sdpConstraints: RTCOfferOptions;
    webSocketController: WebSocketController;
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
    videoElementParentClientRect: DOMRect;
    latencyStartTime: number;
    pixelStreaming: PixelStreaming;
    streamMessageController: StreamMessageController;
    sendMessageController: SendMessageController;
    toStreamerMessagesController: ToStreamerMessagesController;
    keyboardController: KeyboardController;
    mouseController: MouseController;
    touchController: ITouchController;
    gamePadController: GamePadController;
    coordinateConverter: CoordinateConverter;
    isUsingSFU: boolean;
    isQualityController: boolean;
    statsTimerHandle: number;
    file: FileTemplate;
    preferredCodec: string;
    peerConfig: RTCConfiguration;
    videoAvgQp: number;
    shouldReconnect: boolean;
    isReconnecting: boolean;
    reconnectAttempt: number;
    subscribedStream: string | null;
    signallingUrlBuilder: () => string;

    // if you override the disconnection message by calling the interface method setDisconnectMessageOverride
    // it will use this property to store the override message string
    disconnectMessageOverride: string;

    autoJoinTimer: ReturnType<typeof setTimeout> = undefined;

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
            this.setDisconnectMessageOverride(
                'You have been disconnected due to inactivity'
            );
            this.closeSignalingServer();
        };

        this.freezeFrameController = new FreezeFrameController(
            this.pixelStreaming.videoElementParent
        );

        this.videoPlayer = new VideoPlayer(
            this.pixelStreaming.videoElementParent,
            this.config
        );
        this.videoPlayer.onVideoInitialized = () =>
            this.handleVideoInitialized();

        // When in match viewport resolution mode, when the browser viewport is resized we send a resize command back to UE.
        this.videoPlayer.onMatchViewportResolutionCallback = (
            width: number,
            height: number
        ) => {
            const descriptor = {
                'Resolution.Width': width,
                'Resolution.Height': height
            };

            this.streamMessageController.toStreamerHandlers.get(
                'Command'
            )([JSON.stringify(descriptor)]);
        };

        // Every time video player is resized in browser we need to reinitialize the mouse coordinate conversion and freeze frame sizing logic.
        this.videoPlayer.onResizePlayerCallback = () => {
            this.setUpMouseAndFreezeFrame();
        };

        this.streamController = new StreamController(this.videoPlayer);

        this.coordinateConverter = new CoordinateConverter(this.videoPlayer);

        this.sendrecvDataChannelController = new DataChannelController();
        this.recvDataChannelController = new DataChannelController();
        this.registerDataChannelEventEmitters(
            this.sendrecvDataChannelController
        );
        this.registerDataChannelEventEmitters(this.recvDataChannelController);
        this.dataChannelSender = new DataChannelSender(
            this.sendrecvDataChannelController
        );
        this.dataChannelSender.resetAfkWarningTimerOnDataSend = () =>
            this.afkController.resetAfkWarningTimer();

        this.streamMessageController = new StreamMessageController();

        // set up websocket methods
        this.webSocketController = new WebSocketController();
        this.webSocketController.onConfig = (
            messageConfig: MessageReceive.MessageConfig
        ) => this.handleOnConfigMessage(messageConfig);
        this.webSocketController.onStreamerList = (
            messageList: MessageReceive.MessageStreamerList
        ) => this.handleStreamerListMessage(messageList);
        this.webSocketController.onWebSocketOncloseOverlayMessage = (event) => {
            this.pixelStreaming._onDisconnect(
                `Websocket disconnect (${event.code}) ${
                    event.reason != '' ? '- ' + event.reason : ''
                }`
            );
            this.setVideoEncoderAvgQP(0);
        };
        this.webSocketController.onPlayerCount = (playerCount: MessageReceive.MessagePlayerCount) => { 
            this.pixelStreaming._onPlayerCount(playerCount.count); 
        };
        this.webSocketController.onOpen.addEventListener('open', () => {
            const BrowserSendsOffer = this.config.isFlagEnabled(
                Flags.BrowserSendOffer
            );
            if(!BrowserSendsOffer)
            {
                this.webSocketController.requestStreamerList();
            }
        });
        this.webSocketController.onClose.addEventListener('close', (event : CustomEvent) => {
            this.afkController.stopAfkWarningTimer();

            // stop sending stats on interval if we have closed our connection
            if (this.statsTimerHandle && this.statsTimerHandle !== undefined) {
                window.clearInterval(this.statsTimerHandle);
            }

            // unregister all input device event handlers on disconnect
            this.setTouchInputEnabled(false);
            this.setMouseInputEnabled(false);
            this.setKeyboardInputEnabled(false);
            this.setGamePadInputEnabled(false);

            // when we refresh the page during a stream we get the going away code.
            // in that case we don't want to reconnect since we're navigating away.
            // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code
            // lists all the codes. 
            const CODE_GOING_AWAY = 1001;
            if(this.shouldReconnect && event.detail.code != CODE_GOING_AWAY && this.config.getNumericSettingValue(NumericParameters.MaxReconnectAttempts) > 0) {
                this.isReconnecting = true;
                this.reconnectAttempt++;
                this.restartStreamAutomatically();
            }
        });

        // set up the final webRtc player controller methods from within our application so a connection can be activated
        this.sendMessageController = new SendMessageController(
            this.dataChannelSender,
            this.streamMessageController
        );
        this.toStreamerMessagesController = new ToStreamerMessagesController(
            this.sendMessageController
        );
        this.registerMessageHandlers();
        this.streamMessageController.populateDefaultProtocol();

        this.inputClassesFactory = new InputClassesFactory(
            this.streamMessageController,
            this.videoPlayer,
            this.coordinateConverter
        );

        this.isUsingSFU = false;
        this.isQualityController = false;
        this.preferredCodec = '';
        this.shouldReconnect = true;
        this.isReconnecting = false;
        this.reconnectAttempt = 0;

        this.config._addOnOptionSettingChangedListener(
            OptionParameters.StreamerId,
            (streamerid) => {
                if(streamerid === "") {
                    return;
                }

                // close the current peer connection and create a new one
                this.peerConnectionController.peerConnection.close();
                this.peerConnectionController.createPeerConnection(
                    this.peerConfig,
                    this.preferredCodec
                );
                this.subscribedStream = streamerid;
                this.webSocketController.sendSubscribe(streamerid);
            }
        );

        this.setVideoEncoderAvgQP(-1);

        this.signallingUrlBuilder =  () => {
            let signallingServerUrl = this.config.getTextSettingValue(
                TextParameters.SignallingServerUrl
            );
    
            // If we are connecting to the SFU add a special url parameter to the url
            if (this.config.isFlagEnabled(Flags.BrowserSendOffer)) {
                signallingServerUrl += '?' + Flags.BrowserSendOffer + '=true';
            }
    
            // This code is no longer needed, but is a good example for how subsequent config flags can be appended
            // if (this.config.isFlagEnabled(Flags.BrowserSendOffer)) {
            //     signallingServerUrl += (signallingServerUrl.includes('?') ? '&' : '?') + Flags.BrowserSendOffer + '=true';
            // }
    
            return signallingServerUrl;
        }
    }

    /**
     * Make a request to UnquantizedAndDenormalizeUnsigned coordinates
     * @param x x axis coordinate
     * @param y y axis coordinate
     */
    requestUnquantizedAndDenormalizeUnsigned(
        x: number,
        y: number
    ): UnquantizedDenormalizedUnsignedCoord {
        return this.coordinateConverter.unquantizeAndDenormalizeUnsigned(x, y);
    }

    /**
     * Handles when a message is received
     * @param event - Message Event
     */
    handleOnMessage(event: MessageEvent) {
        const message = new Uint8Array(event.data);
        Logger.Log(Logger.GetStackTrace(), 'Message incoming:' + message, 6);

        //try {
        const messageType =
            this.streamMessageController.fromStreamerMessages.get(
                message[0]
            );
        this.streamMessageController.fromStreamerHandlers.get(messageType)(
            event.data
        );
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
        )
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
        this.streamMessageController.registerMessageHandler(
            MessageDirection.FromStreamer,
            'TestEcho',
            () => {
                /* Do nothing */
            }
        );
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
            'Protocol',
            (data: ArrayBuffer) => this.onProtocolMessage(data)
        );

        // To Streamer
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'IFrameRequest',
            () =>
                this.sendMessageController.sendMessageToStreamer(
                    'IFrameRequest'
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'RequestQualityControl',
            () =>
                this.sendMessageController.sendMessageToStreamer(
                    'RequestQualityControl'
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'FpsRequest',
            () => this.sendMessageController.sendMessageToStreamer('FpsRequest')
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'AverageBitrateRequest',
            () =>
                this.sendMessageController.sendMessageToStreamer(
                    'AverageBitrateRequest'
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'StartStreaming',
            () =>
                this.sendMessageController.sendMessageToStreamer(
                    'StartStreaming'
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'StopStreaming',
            () =>
                this.sendMessageController.sendMessageToStreamer(
                    'StopStreaming'
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'LatencyTest',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'LatencyTest', data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'RequestInitialSettings',
            () =>
                this.sendMessageController.sendMessageToStreamer(
                    'RequestInitialSettings'
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'TestEcho',
            () => {
                /* Do nothing */
            }
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'UIInteraction',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'UIInteraction', data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'Command',
            (data: Array<number | string>) => 
                this.sendMessageController.sendMessageToStreamer(
                    'Command', data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'TextboxEntry',
            (data: Array<number | string>) => 
                this.sendMessageController.sendMessageToStreamer(
                    'TextboxEntry', data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'KeyDown',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'KeyDown',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'KeyUp',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer('KeyUp', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'KeyPress',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'KeyPress',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'MouseEnter',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'MouseEnter',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'MouseLeave',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'MouseLeave',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'MouseDown',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'MouseDown',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'MouseUp',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'MouseUp',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'MouseMove',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'MouseMove',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'MouseWheel',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'MouseWheel',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'MouseDouble',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'MouseDouble',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'TouchStart',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'TouchStart',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'TouchEnd',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'TouchEnd',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'TouchMove',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'TouchMove',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'GamepadConnected',
            () =>
                this.sendMessageController.sendMessageToStreamer(
                    'GamepadConnected'
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'GamepadButtonPressed',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'GamepadButtonPressed',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'GamepadButtonReleased',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'GamepadButtonReleased',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'GamepadAnalog',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'GamepadAnalog',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'GamepadDisconnected',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'GamepadDisconnected',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XRHMDTransform',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'XRHMDTransform',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XRControllerTransform',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'XRControllerTransform',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XRSystem',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'XRSystem',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XRButtonTouched',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'XRButtonTouched',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XRButtonPressed',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'XRButtonPressed',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XRButtonReleased',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'XRButtonReleased',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XRAnalog',
            (data: Array<number | string>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'XRAnalog',
                    data
                )
        );
    }

    /**
     * Activate the logic associated with a command from UE
     * @param message
     */
    onCommand(message: ArrayBuffer) {
        Logger.Log(
            Logger.GetStackTrace(),
            'DataChannelReceiveMessageType.Command',
            6
        );
        const commandAsString = new TextDecoder('utf-16').decode(
            message.slice(1)
        );

        Logger.Log(
            Logger.GetStackTrace(),
            'Data Channel Command: ' + commandAsString,
            6
        );
        const command: MessageOnScreenKeyboard = JSON.parse(commandAsString);
        if (command.command === 'onScreenKeyboard') {
            this.pixelStreaming._activateOnScreenKeyboard(command);
        }
    }

    /**
     * Handles a protocol message received from the streamer
     * @param message the message data from the streamer
     */
    onProtocolMessage(message: ArrayBuffer) {
        try {
            const protocolString = new TextDecoder('utf-16').decode(
                message.slice(1)
            );
            const protocolJSON = JSON.parse(protocolString);
            if (
                !Object.prototype.hasOwnProperty.call(protocolJSON, 'Direction')
            ) {
                Logger.Error(
                    Logger.GetStackTrace(),
                    'Malformed protocol received. Ensure the protocol message contains a direction'
                );
            }
            const direction = protocolJSON.Direction;
            delete protocolJSON.Direction;
            Logger.Log(
                Logger.GetStackTrace(),
                `Received new ${
                    direction == MessageDirection.FromStreamer
                        ? 'FromStreamer'
                        : 'ToStreamer'
                } protocol. Updating existing protocol...`
            );
            Object.keys(protocolJSON).forEach((messageType) => {
                const message = protocolJSON[messageType];
                switch (direction) {
                    case MessageDirection.ToStreamer:
                        // Check that the message contains all the relevant params
                        if (
                            !Object.prototype.hasOwnProperty.call(
                                message,
                                'id'
                            )
                        ) {
                            Logger.Error(
                                Logger.GetStackTrace(),
                                `ToStreamer->${messageType} protocol definition was malformed as it didn't contain at least an id\n
                                           Definition was: ${JSON.stringify(
                                               message,
                                               null,
                                               2
                                           )}`
                            );
                            // return in a forEach is equivalent to a continue in a normal for loop
                            return;
                        }

                        // UE5.1 and UE5.2 don't send a structure for these message types, but they actually do have a structure so ignore updating them
                        if((messageType === "UIInteraction" || messageType === "Command" || messageType === "LatencyTest")) {
                            return;
                        }

                        if (
                            this.streamMessageController.toStreamerHandlers.get(
                                messageType
                            )
                        ) {
                            // If we've registered a handler for this message type we can add it to our supported messages. ie registerMessageHandler(...)
                            this.streamMessageController.toStreamerMessages.set(
                                messageType,
                                message
                            );
                        } else {
                            Logger.Error(
                                Logger.GetStackTrace(),
                                `There was no registered handler for "${messageType}" - try adding one using registerMessageHandler(MessageDirection.ToStreamer, "${messageType}", myHandler)`
                            );
                        }
                        break;
                    case MessageDirection.FromStreamer:
                        // Check that the message contains all the relevant params
                        if (
                            !Object.prototype.hasOwnProperty.call(message, 'id')
                        ) {
                            Logger.Error(
                                Logger.GetStackTrace(),
                                `FromStreamer->${messageType} protocol definition was malformed as it didn't contain at least an id\n
                            Definition was: ${JSON.stringify(message, null, 2)}`
                            );
                            // return in a forEach is equivalent to a continue in a normal for loop
                            return;
                        }
                        if (
                            this.streamMessageController.fromStreamerHandlers.get(
                                messageType
                            )
                        ) {
                            // If we've registered a handler for this message type. ie registerMessageHandler(...)
                            this.streamMessageController.fromStreamerMessages.set(
                                message.id,
                                messageType
                            );
                        } else {
                            Logger.Error(
                                Logger.GetStackTrace(),
                                `There was no registered handler for "${message}" - try adding one using registerMessageHandler(MessageDirection.FromStreamer, "${messageType}", myHandler)`
                            );
                        }
                        break;
                    default:
                        Logger.Error(
                            Logger.GetStackTrace(),
                            `Unknown direction: ${direction}`
                        );
                }
            });

            // Once the protocol has been received, we can send our control messages
            this.toStreamerMessagesController.SendRequestInitialSettings();
            this.toStreamerMessagesController.SendRequestQualityControl();
        } catch (e) {
            Logger.Log(Logger.GetStackTrace(), e);
        }
    }

    /**
     * Handles an input control message when it is received from the streamer
     * @param message The input control message
     */
    onInputControlOwnership(message: ArrayBuffer) {
        const view = new Uint8Array(message);
        Logger.Log(
            Logger.GetStackTrace(),
            'DataChannelReceiveMessageType.InputControlOwnership',
            6
        );
        const inputControlOwnership = new Boolean(view[1]).valueOf();
        Logger.Log(
            Logger.GetStackTrace(),
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
     * Restart the stream automatically without refreshing the page
     */
    restartStreamAutomatically() {
        // if there is no webSocketController return immediately or this will not work
        if (!this.webSocketController) {
            Logger.Log(
                Logger.GetStackTrace(),
                'The Web Socket Controller does not exist so this will not work right now.'
            );
            return;
        }

        // if a websocket object has not been created connect normally without closing
        if (
            !this.webSocketController.webSocket ||
            this.webSocketController.webSocket.readyState === WebSocket.CLOSED
        ) {
            Logger.Log(
                Logger.GetStackTrace(),
                'A websocket connection has not been made yet so we will start the stream'
            );
            this.pixelStreaming._onWebRtcAutoConnect();
            this.connectToSignallingServer();
        } else {
            // set the replay status so we get a text overlay over an action overlay
            this.pixelStreaming._showActionOrErrorOnDisconnect = false;

            // set the disconnect message
            this.setDisconnectMessageOverride('Restarting stream...');

            // close the connection
            this.closeSignalingServer();

            // wait for the connection to close and restart the connection
            const autoConnectTimeout = setTimeout(() => {
                this.pixelStreaming._onWebRtcAutoConnect();
                this.connectToSignallingServer();
                clearTimeout(autoConnectTimeout);
            }, 3000);
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
            Logger.Log(Logger.GetStackTrace(), 'showing play overlay');
            this.resizePlayerStyle();
        } else {
            Logger.Log(Logger.GetStackTrace(), 'showing freeze frame');
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
        Logger.Log(
            Logger.GetStackTrace(),
            'DataChannelReceiveMessageType.FreezeFrame',
            6
        );
        const view = new Uint8Array(message);
        this.freezeFrameController.processFreezeFrameMessage(view, () =>
            this.loadFreezeFrameOrShowPlayOverlay()
        );
    }

    /**
     * Enable the video after hiding a freeze frame
     */
    invalidateFreezeFrameAndEnableVideo() {
        Logger.Log(
            Logger.GetStackTrace(),
            'DataChannelReceiveMessageType.FreezeFrame',
            6
        );
        setTimeout(() => {
            this.pixelStreaming.dispatchEvent(
                new HideFreezeFrameEvent()
            );
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
            this.pixelStreaming.dispatchEvent(
                new PlayStreamErrorEvent({ message })
            );
            Logger.Error(Logger.GetStackTrace(), message);

            // set the disconnect message
            this.setDisconnectMessageOverride(
                'Stream not initialized correctly'
            );

            // close the connection
            this.closeSignalingServer();
            return;
        }

        if (!this.videoPlayer.hasVideoSource()) {
            Logger.Warning(
                Logger.GetStackTrace(),
                'Cannot play stream, the video element has no srcObject to play.'
            );
            return;
        }

        this.setTouchInputEnabled(this.config.isFlagEnabled(Flags.TouchInput));
        this.pixelStreaming.dispatchEvent(new PlayStreamEvent());

        if (this.streamController.audioElement.srcObject) {
            const startMuted = this.config.isFlagEnabled(Flags.StartVideoMuted)
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
                        Logger.Log(Logger.GetStackTrace(), onRejectedReason);
                        Logger.Log(
                            Logger.GetStackTrace(),
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
            Logger.Log(Logger.GetStackTrace(), onRejectedReason);
            Logger.Log(
                Logger.GetStackTrace(),
                'Browser does not support autoplaying video without interaction - to resolve this we are going to show the play button overlay.'
            );
            this.pixelStreaming.dispatchEvent(
                new PlayStreamRejectedEvent({ reason: onRejectedReason })
            );
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
        const signallingUrl = this.signallingUrlBuilder();
        this.webSocketController.connect(signallingUrl);
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
                    Logger.GetStackTrace(),
                    'No turn server was found in the Peer Connection Options. TURN cannot be forced, closing connection. Please use STUN instead'
                );
                this.setDisconnectMessageOverride(
                    'TURN cannot be forced, closing connection. Please use STUN instead.'
                );
                this.closeSignalingServer();
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
        this.peerConnectionController.onVideoStats = (event: AggregatedStats) =>
            this.handleVideoStats(event);

        /* When the Peer Connection wants to send an offer have it handled */
        this.peerConnectionController.onSendWebRTCOffer = (
            offer: RTCSessionDescriptionInit
        ) => this.handleSendWebRTCOffer(offer);

        /* When the Peer Connection wants to send an answer have it handled */
        this.peerConnectionController.onSendWebRTCAnswer = (
            offer: RTCSessionDescriptionInit
        ) => this.handleSendWebRTCAnswer(offer);

        /* When the Peer Connection ice candidate is added have it handled */
        this.peerConnectionController.onPeerIceCandidate = (
            peerConnectionIceEvent: RTCPeerConnectionIceEvent
        ) => this.handleSendIceCandidate(peerConnectionIceEvent);

        /* When the Peer Connection has a data channel created for it by the browser, handle it */
        this.peerConnectionController.onDataChannel = (
            datachannelEvent: RTCDataChannelEvent
        ) => this.handleDataChannel(datachannelEvent);

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
            if (!webRtcConnectedSent && 
                ["connected", "completed"].includes(this.peerConnectionController.peerConnection.iceConnectionState)) {
                this.pixelStreaming._onWebRtcConnected();
                webRtcConnectedSent = true;
            }
        };

        /* RTC Peer Connection on Track event -> handle on track */
        this.peerConnectionController.onTrack = (trackEvent: RTCTrackEvent) =>
            this.streamController.handleOnTrack(trackEvent);

        /* Start the Hand shake process by creating an Offer */
        const BrowserSendsOffer = this.config.isFlagEnabled(
            Flags.BrowserSendOffer
        );
        if (BrowserSendsOffer) {
            // If browser is sending the offer, create an offer and send it to the streamer
            this.sendrecvDataChannelController.createDataChannel(
                this.peerConnectionController.peerConnection,
                'cirrus',
                this.datachannelOptions
            );
            this.sendrecvDataChannelController.handleOnMessage = (
                ev: MessageEvent<ArrayBuffer>
            ) => this.handleOnMessage(ev);
            this.peerConnectionController.createOffer(
                this.sdpConstraints,
                this.config
            );
        }
    }

    /**
     * Checks the peer connection options for a turn server and returns true or false
     */
    checkTurnServerAvailability(options: RTCConfiguration) {
        // if iceServers is empty return false this should not be the general use case but is here incase
        if (!options.iceServers) {
            Logger.Info(Logger.GetStackTrace(), 'A turn sever was not found');
            return false;
        }

        // loop through the ice servers to check for a turn url
        for (const iceServer of options.iceServers) {
            for (const url of iceServer.urls) {
                if (url.includes('turn')) {
                    Logger.Log(
                        Logger.GetStackTrace(),
                        `A turn sever was found at ${url}`
                    );
                    return true;
                }
            }
        }

        Logger.Info(Logger.GetStackTrace(), 'A turn sever was not found');
        return false;
    }

    /**
     * Handles when a Config Message is received contains the Peer Connection Options required (STUN and TURN Server Info)
     * @param messageConfig - Config Message received from the signaling server
     */
    handleOnConfigMessage(messageConfig: MessageConfig) {
        this.resizePlayerStyle();

        // Tell the WebRtcController to start a session with the peer options sent from the signaling server
        this.startSession(messageConfig.peerConnectionOptions);

        // When the signaling server sends a WebRTC Answer over the websocket connection have the WebRtcController handle the message
        this.webSocketController.onWebRtcAnswer = (
            messageAnswer: MessageReceive.MessageAnswer
        ) => this.handleWebRtcAnswer(messageAnswer);
        this.webSocketController.onWebRtcOffer = (
            messageOffer: MessageReceive.MessageOffer
        ) => this.handleWebRtcOffer(messageOffer);
        this.webSocketController.onWebRtcPeerDataChannels = (
            messageDataChannels: MessageReceive.MessagePeerDataChannels
        ) => this.handleWebRtcSFUPeerDatachannels(messageDataChannels);

        // When the signaling server sends a IceCandidate over the websocket connection have the WebRtcController handle the message
        this.webSocketController.onIceCandidate = (
            iceCandidate: RTCIceCandidateInit
        ) => this.handleIceCandidate(iceCandidate);
    }

    /**
     * Handles when the signalling server gives us the list of streamer ids.
     */
    handleStreamerListMessage(messageStreamerList: MessageStreamerList) {
        Logger.Log(
            Logger.GetStackTrace(),
            `Got streamer list ${messageStreamerList.ids}`,
            6
        );

        if(this.isReconnecting) {
            if(messageStreamerList.ids.includes(this.subscribedStream)) {
                // If we're reconnecting and the previously subscribed stream has come back, resubscribe to it
                this.isReconnecting = false;
                this.reconnectAttempt = 0;
                this.webSocketController.sendSubscribe(this.subscribedStream);
            } else if(this.reconnectAttempt < this.config.getNumericSettingValue(NumericParameters.MaxReconnectAttempts)) {
                // Our previous stream hasn't come back, wait 2 seconds and request an updated stream list
                this.reconnectAttempt++;
                setTimeout(() => {
                    this.webSocketController.requestStreamerList();
                }, 2000)
            } else {
                // We've exhausted our reconnect attempts, return to main screen
                this.reconnectAttempt = 0;
                this.isReconnecting = false;
                this.shouldReconnect = false;
                this.webSocketController.close();
                
                this.config.setOptionSettingValue(
                    OptionParameters.StreamerId,
                    ""
                );
                this.config.setOptionSettingOptions(
                    OptionParameters.StreamerId,
                    []
                );
            }
        } else {
            const settingOptions = [...messageStreamerList.ids]; // copy the original messageStreamerList.ids
            settingOptions.unshift(''); // add an empty option at the top
            this.config.setOptionSettingOptions(
                OptionParameters.StreamerId,
                settingOptions
            );

            const urlParams = new URLSearchParams(window.location.search);
            let autoSelectedStreamerId: string | null = null;
            if (messageStreamerList.ids.length == 1) {
                // If there's only a single streamer, subscribe to it regardless of what is in the URL
                autoSelectedStreamerId = messageStreamerList.ids[0];
            } else if (
                urlParams.has(OptionParameters.StreamerId) &&
                messageStreamerList.ids.includes(
                    urlParams.get(OptionParameters.StreamerId)
                )
            ) {
                // If there's a streamer ID in the URL and a streamer with this ID is connected, set it as the selected streamer
                autoSelectedStreamerId = urlParams.get(OptionParameters.StreamerId);
            }
            if (autoSelectedStreamerId !== null) {
                this.config.setOptionSettingValue(
                    OptionParameters.StreamerId,
                    autoSelectedStreamerId
                );
            } else {
                // no auto selected streamer
                if (messageStreamerList.ids.length == 0 && this.config.isFlagEnabled(Flags.WaitForStreamer)) {
                    this.closeSignalingServer();
                    this.startAutoJoinTimer();
                }
            }
            this.pixelStreaming.dispatchEvent(
                new StreamerListMessageEvent({
                    messageStreamerList,
                    autoSelectedStreamerId
                })
            );
        }
    }

    startAutoJoinTimer() {
        clearTimeout(this.autoJoinTimer);
        this.autoJoinTimer = setTimeout(() => this.tryAutoJoin(), this.config.getNumericSettingValue(NumericParameters.StreamerAutoJoinInterval));
    }

    tryAutoJoin() {
        this.connectToSignallingServer();
    }

    /**
     * Handle the RTC Answer from the signaling server
     * @param Answer - Answer SDP from the peer.
     */
    handleWebRtcAnswer(Answer: MessageAnswer) {
        Logger.Log(Logger.GetStackTrace(), `Got answer sdp ${Answer.sdp}`, 6);

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
    handleWebRtcOffer(Offer: MessageOffer) {
        Logger.Log(Logger.GetStackTrace(), `Got offer sdp ${Offer.sdp}`, 6);

        this.isUsingSFU = Offer.sfu ? Offer.sfu : false;
        if (this.isUsingSFU) {
            // Disable negotiating with the sfu as the sfu only supports one codec at a time
            this.peerConnectionController.preferredCodec = '';
        }

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
    handleWebRtcSFUPeerDatachannels(
        DataChannels: MessageReceive.MessagePeerDataChannels
    ) {
        const SendOptions: RTCDataChannelInit = {
            ordered: true,
            negotiated: true,
            id: DataChannels.sendStreamId
        };

        const unidirectional =
            DataChannels.sendStreamId != DataChannels.recvStreamId;

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
                this.webSocketController.sendSFURecvDataChannelReady();
            // If we're uni-directional, only the recv data channel should handle incoming messages
            this.recvDataChannelController.handleOnMessage = (
                ev: MessageEvent
            ) => this.handleOnMessage(ev);
        } else {
            // else our primary datachannel is send/recv so it can handle incoming messages
            this.sendrecvDataChannelController.handleOnMessage = (
                ev: MessageEvent
            ) => this.handleOnMessage(ev);
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
     * When an ice Candidate is received from the Signaling server add it to the Peer Connection Client
     * @param iceCandidate - Ice Candidate from Server
     */
    handleIceCandidate(iceCandidate: RTCIceCandidateInit) {
        Logger.Log(
            Logger.GetStackTrace(),
            'Web RTC Controller: onWebRtcIce',
            6
        );

        const candidate = new RTCIceCandidate(iceCandidate);
        this.peerConnectionController.handleOnIce(candidate);
    }

    /**
     * Send the ice Candidate to the signaling server via websocket
     * @param iceEvent - RTC Peer ConnectionIceEvent) {
     */
    handleSendIceCandidate(iceEvent: RTCPeerConnectionIceEvent) {
        Logger.Log(Logger.GetStackTrace(), 'OnIceCandidate', 6);
        if (iceEvent.candidate && iceEvent.candidate.candidate) {
            this.webSocketController.sendIceCandidate(iceEvent.candidate);
        }
    }

    /**
     * Send the ice Candidate to the signaling server via websocket
     * @param iceEvent - RTC Peer ConnectionIceEvent) {
     */
    handleDataChannel(datachannelEvent: RTCDataChannelEvent) {
        Logger.Log(
            Logger.GetStackTrace(),
            'Data channel created for us by browser as we are a receiving peer.',
            6
        );
        this.sendrecvDataChannelController.dataChannel =
            datachannelEvent.channel;
        // Data channel was created for us, so we just need to setup its callbacks and array type
        this.sendrecvDataChannelController.setupDataChannel();
        this.sendrecvDataChannelController.handleOnMessage = (
            ev: MessageEvent<ArrayBuffer>
        ) => this.handleOnMessage(ev);
    }

    /**
     * Send the RTC Offer Session to the Signaling server via websocket
     * @param offer - RTC Session Description
     */
    handleSendWebRTCOffer(offer: RTCSessionDescriptionInit) {
        Logger.Log(
            Logger.GetStackTrace(),
            'Sending the offer to the Server',
            6
        );
        this.webSocketController.sendWebRtcOffer(offer);
    }

    /**
     * Send the RTC Offer Session to the Signaling server via websocket
     * @param answer - RTC Session Description
     */
    handleSendWebRTCAnswer(answer: RTCSessionDescriptionInit) {
        Logger.Log(
            Logger.GetStackTrace(),
            'Sending the answer to the Server',
            6
        );
        this.webSocketController.sendWebRtcAnswer(answer);

        if (this.isUsingSFU) {
            this.webSocketController.sendWebRtcDatachannelRequest();
        }
    }

    /**
     * Set the freeze frame overlay to the player div
     */
    setUpMouseAndFreezeFrame() {
        // Calculating and normalizing positions depends on the width and height of the player.
        this.videoElementParentClientRect = this.videoPlayer
            .getVideoParentElement()
            .getBoundingClientRect();
        this.coordinateConverter.setupNormalizeAndQuantize();
        this.freezeFrameController.freezeFrame.resize();
    }

    /**
     * Close the Connection to the signaling server
     */
    closeSignalingServer() {
        // We explicitly called close, therefore we don't want to trigger auto reconnect
        this.shouldReconnect = false;
        this.webSocketController?.close();
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
        this.closeSignalingServer();
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

        this.streamMessageController.toStreamerHandlers.get(
            'LatencyTest'
        )([JSON.stringify({
            StartTime: this.latencyStartTime
        })]);
    }

    /**
     * Send a Data Channel Latency Test Request to the UE Instance
     */
    sendDataChannelLatencyTest(descriptor: DataChannelLatencyTestRequest) {
        this.streamMessageController.toStreamerHandlers.get(
            'DataChannelLatencyTest'
        )([JSON.stringify(descriptor)]);
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
        Logger.Log(Logger.GetStackTrace(), `MinQP=${minQP}\n`, 6);

        if (minQP != null) {
            this.streamMessageController.toStreamerHandlers.get(
                'Command'
            )([JSON.stringify({
                'Encoder.MinQP': minQP
            })]);
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
        Logger.Log(Logger.GetStackTrace(), `MaxQP=${maxQP}\n`, 6);

        if (maxQP != null) {
            this.streamMessageController.toStreamerHandlers.get(
                'Command'
            )([JSON.stringify({
                'Encoder.MaxQP': maxQP
            })]);
        }
    }

    /**
     * Send the { WebRTC.MinBitrate: SomeNumber }} command to UE to set 
     * the minimum bitrate that we allow WebRTC to use 
     * (note setting this too high in poor networks can be problematic).
     * @param minBitrate - The minimum bitrate we would like WebRTC to not fall below.
     */
    sendWebRTCMinBitrate(minBitrate: number) {
        Logger.Log(Logger.GetStackTrace(), `WebRTC Min Bitrate=${minBitrate}`, 6);
        if (minBitrate != null) {
            this.streamMessageController.toStreamerHandlers.get(
                'Command'
            )([JSON.stringify({
                'WebRTC.MinBitrate': minBitrate
            })]);
        }
    }

    /**
     * Send the { WebRTC.MaxBitrate: SomeNumber }} command to UE to set 
     * the minimum bitrate that we allow WebRTC to use 
     * (note setting this too low could result in blocky video).
     * @param minBitrate - The minimum bitrate we would like WebRTC to not fall below.
     */
     sendWebRTCMaxBitrate(maxBitrate: number) {
        Logger.Log(Logger.GetStackTrace(), `WebRTC Max Bitrate=${maxBitrate}`, 6);
        if (maxBitrate != null) {
            this.streamMessageController.toStreamerHandlers.get(
                'Command'
            )([JSON.stringify({
                'WebRTC.MaxBitrate': maxBitrate
            })]);
        }
    }

    /**
     * Send the { WebRTC.Fps: SomeNumber }} UE 5.0+
     * and { WebRTC.MaxFps } UE 4.27 command to set 
     * the maximum fps we would like WebRTC to stream at. 
     * @param fps - The maximum stream fps.
     */
     sendWebRTCFps(fps: number) {
        Logger.Log(Logger.GetStackTrace(), `WebRTC FPS=${fps}`, 6);
        if (fps != null) {
            this.streamMessageController.toStreamerHandlers.get(
                'Command'
            )([JSON.stringify({'WebRTC.Fps': fps})]);

            /* TODO: Remove when UE 4.27 unsupported. */
            this.streamMessageController.toStreamerHandlers.get(
                'Command'
            )([JSON.stringify({'WebRTC.MaxFps': fps})]); 
        }
    }

    /**
     * Sends the UI Descriptor `stat fps` to the UE Instance
     */
    sendShowFps(): void {
        Logger.Log(
            Logger.GetStackTrace(),
            '----   Sending show stat to UE   ----',
            6
        );

        this.streamMessageController.toStreamerHandlers.get(
            'Command'
        )([JSON.stringify({ 'stat.fps': '' })]);
    }

    /**
     * Send an Iframe request to the streamer
     */
    sendIframeRequest(): void {
        Logger.Log(
            Logger.GetStackTrace(),
            '----   Sending Request for an IFrame  ----',
            6
        );
        this.streamMessageController.toStreamerHandlers.get('IFrameRequest')();
    }

    /**
     * Send a UIInteraction message
     */
    emitUIInteraction(descriptor: object | string) {
        Logger.Log(
            Logger.GetStackTrace(),
            '----   Sending custom UIInteraction message   ----',
            6
        );

        this.streamMessageController.toStreamerHandlers.get(
            'UIInteraction'
        )([JSON.stringify(descriptor)]);
    }

    /**
     * Send a Command message
     */
    emitCommand(descriptor: object) {
        Logger.Log(
            Logger.GetStackTrace(),
            '----   Sending custom Command message   ----',
            6
        );
        
        this.streamMessageController.toStreamerHandlers.get(
            'Command'
        )([JSON.stringify(descriptor)]);
    }

    /**
     * Send a console command message
     */
    emitConsoleCommand(command: string) {
        Logger.Log(
            Logger.GetStackTrace(),
            '----   Sending custom Command:ConsoleCommand message   ----',
            6
        );

        this.streamMessageController.toStreamerHandlers.get(
            'Command'
        )([JSON.stringify({
            ConsoleCommand: command,
        })]);
    }

    /**
     * Sends a request to the UE Instance to have ownership of Quality
     */
    sendRequestQualityControlOwnership(): void {
        Logger.Log(
            Logger.GetStackTrace(),
            '----   Sending Request to Control Quality  ----',
            6
        );
        this.toStreamerMessagesController.SendRequestQualityControl();
    }

    /**
     * Handles when a Latency Test Result are received from the UE Instance
     * @param message - Latency Test Timings
     */
    handleLatencyTestResult(message: ArrayBuffer) {
        Logger.Log(
            Logger.GetStackTrace(),
            'DataChannelReceiveMessageType.latencyTest',
            6
        );
        const latencyAsString = new TextDecoder('utf-16').decode(
            message.slice(1)
        );
        const latencyTestResults: LatencyTestResults = new LatencyTestResults();
        Object.assign(latencyTestResults, JSON.parse(latencyAsString));
        latencyTestResults.processFields();

        latencyTestResults.testStartTimeMs = this.latencyStartTime;
        latencyTestResults.browserReceiptTimeMs = Date.now();

        latencyTestResults.latencyExcludingDecode = ~~(
            latencyTestResults.browserReceiptTimeMs -
            latencyTestResults.testStartTimeMs
        );
        latencyTestResults.testDuration = ~~(
            latencyTestResults.TransmissionTimeMs -
            latencyTestResults.ReceiptTimeMs
        );
        latencyTestResults.networkLatency = ~~(
            latencyTestResults.latencyExcludingDecode -
            latencyTestResults.testDuration
        );

        if (
            latencyTestResults.frameDisplayDeltaTimeMs &&
            latencyTestResults.browserReceiptTimeMs
        ) {
            latencyTestResults.endToEndLatency =
                ~~(latencyTestResults.frameDisplayDeltaTimeMs +
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
        Logger.Log(
            Logger.GetStackTrace(),
            'DataChannelReceiveMessageType.dataChannelLatencyResponse',
            6
        );
        const responseAsString = new TextDecoder('utf-16').decode(
            message.slice(1)
        );
        const latencyTestResponse: DataChannelLatencyTestResponse = JSON.parse(responseAsString);
        this.pixelStreaming._onDataChannelLatencyTestResponse(latencyTestResponse);
    }

    /**
     * Handles when the Encoder and Web RTC Settings are received from the UE Instance
     * @param message - Initial Encoder and Web RTC Settings
     */
    handleInitialSettings(message: ArrayBuffer) {
        Logger.Log(
            Logger.GetStackTrace(),
            'DataChannelReceiveMessageType.InitialSettings',
            6
        );
        const payloadAsString = new TextDecoder('utf-16').decode(
            message.slice(1)
        );
        const parsedInitialSettings = JSON.parse(payloadAsString);

        const initialSettings: InitialSettings = new InitialSettings();

        if (parsedInitialSettings.Encoder) {
            initialSettings.EncoderSettings = parsedInitialSettings.Encoder;
        }

        if (parsedInitialSettings.WebRTC) {
            initialSettings.WebRTCSettings = parsedInitialSettings.WebRTC;
        }

        if (parsedInitialSettings.PixelStreaming) {
            initialSettings.PixelStreamingSettings =
                parsedInitialSettings.PixelStreaming;
        }

        if (parsedInitialSettings.ConfigOptions && parsedInitialSettings.ConfigOptions.DefaultToHover !== undefined) {
            this.config.setFlagEnabled(
                Flags.HoveringMouseMode,
                !!parsedInitialSettings.ConfigOptions.DefaultToHover
            );
        }

        initialSettings.ueCompatible();
        Logger.Log(Logger.GetStackTrace(), payloadAsString, 6);

        this.pixelStreaming._onInitialSettings(initialSettings);
    }

    /**
     * Handles when the Quantization Parameter are received from the UE Instance
     * @param message - Encoders Quantization Parameter
     */
    handleVideoEncoderAvgQP(message: ArrayBuffer) {
        Logger.Log(
            Logger.GetStackTrace(),
            'DataChannelReceiveMessageType.VideoEncoderAvgQP',
            6
        );
        const AvgQP = Number(
            new TextDecoder('utf-16').decode(message.slice(1))
        );
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
        Logger.Log(
            Logger.GetStackTrace(),
            'DataChannelReceiveMessageType.QualityControlOwnership',
            6
        );
        this.isQualityController = new Boolean(view[1]).valueOf();
        Logger.Log(
            Logger.GetStackTrace(),
            `Received quality controller message, will control quality: ${this.isQualityController}`
        );
        this.pixelStreaming._onQualityControlOwnership(
            this.isQualityController
        );
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

    /**
     * Get the overridden disconnect message
     */
    getDisconnectMessageOverride(): string {
        return this.disconnectMessageOverride;
    }

    /**
     * Set the override for the disconnect message
     */
    setDisconnectMessageOverride(message: string): void {
        this.disconnectMessageOverride = message;
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
        this.keyboardController?.unregisterKeyBoardEvents();
        if (isEnabled) {
            this.keyboardController = this.inputClassesFactory.registerKeyBoard(
                this.config
            );
        }
    }

    /**
     * enables/disables mouse event listeners
     */
    setMouseInputEnabled(isEnabled: boolean) {
        this.mouseController?.unregisterMouseEvents();
        if (isEnabled) {
            const mouseMode = this.config.isFlagEnabled(Flags.HoveringMouseMode)
            ? ControlSchemeType.HoveringMouse
            : ControlSchemeType.LockedMouse;
            this.mouseController =
            this.inputClassesFactory.registerMouse(mouseMode);
        }
    }

    /**
     * enables/disables touch event listeners
     */
    setTouchInputEnabled(isEnabled: boolean) {
        this.touchController?.unregisterTouchEvents();
        if (isEnabled) {
            this.touchController = this.inputClassesFactory.registerTouch(
                this.config.isFlagEnabled(Flags.FakeMouseWithTouches),
                this.videoElementParentClientRect
            );
        }
    }

    /**
     * enables/disables game pad event listeners
     */
    setGamePadInputEnabled(isEnabled: boolean) {
        this.gamePadController?.unregisterGamePadEvents();
        if (isEnabled) {
            this.gamePadController = this.inputClassesFactory.registerGamePad();
            this.gamePadController.onGamepadConnected = () => {
                this.streamMessageController.toStreamerHandlers.get('GamepadConnected')();
            }
            this.gamePadController.onGamepadDisconnected = (controllerIdx: number) => {
                this.streamMessageController.toStreamerHandlers.get('GamepadDisconnected')([controllerIdx]);
            }
        }
    }

    registerDataChannelEventEmitters(dataChannel: DataChannelController) {
        dataChannel.onOpen = (label, event) =>
            this.pixelStreaming.dispatchEvent(
                new DataChannelOpenEvent({ label, event })
            );
        dataChannel.onClose = (label, event) =>
            this.pixelStreaming.dispatchEvent(
                new DataChannelCloseEvent({ label, event })
            );
        dataChannel.onError = (label, event) =>
            this.pixelStreaming.dispatchEvent(
                new DataChannelErrorEvent({ label, event })
            );
    }

    public registerMessageHandler(name: string, direction: MessageDirection, handler?: (data: ArrayBuffer | Array<number | string>) => void) {
        if(direction === MessageDirection.FromStreamer && typeof handler === 'undefined') {
            Logger.Warning(
                Logger.GetStackTrace(),
                `Unable to register handler for ${name} as no handler was passed`
            );
        }

        
        this.streamMessageController.registerMessageHandler(
            direction,
            name,
            (data: Array<number | string>) => (typeof handler === 'undefined' && direction === MessageDirection.ToStreamer) ? 
                this.sendMessageController.sendMessageToStreamer(
                    name,
                    data
                ) :   
                handler(data)
        );
    }
}

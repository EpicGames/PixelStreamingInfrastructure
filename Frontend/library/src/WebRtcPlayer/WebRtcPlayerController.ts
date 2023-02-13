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
    OptionParameters
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
import { SendDescriptorController } from '../UeInstanceMessage/SendDescriptorController';
import { SendMessageController } from '../UeInstanceMessage/SendMessageController';
import { ToStreamerMessagesController } from '../UeInstanceMessage/ToStreamerMessagesController';
import { MouseController } from '../Inputs/MouseController';
import { GamePadController } from '../Inputs/GamepadController';
import { DataChannelSender } from '../DataChannel/DataChannelSender';
import {
    CoordinateConverter,
    UnquantizedDenormalizedUnsignedCoord
} from '../Util/CoordinateConverter';
import { Application } from '../Application/Application';
import { ITouchController } from '../Inputs/ITouchController';
import { AFKOverlay } from '../AFK/AFKOverlay';
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
    application: Application;
    streamMessageController: StreamMessageController;
    sendDescriptorController: SendDescriptorController;
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
    peerConfig: RTCConfiguration

    // if you override the disconnection message by calling the interface method setDisconnectMessageOverride
    // it will use this property to store the override message string
    disconnectMessageOverride: string;

    /**
     *
     * @param config - the frontend config object
     * @param application - the application object
     */
    constructor(config: Config, application: Application) {
        this.config = config;
        this.application = application;
        this.responseController = new ResponseController();
        this.file = new FileTemplate();

        this.sdpConstraints = {
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        };

        // set up the afk logic class and connect up its method for closing the signaling server
        const afkOverlay = new AFKOverlay(this.application.videoElementParent);
        afkOverlay.onAction(() => this.onAfkTriggered());
        this.afkController = new AFKController(this.config, afkOverlay);
        this.afkController.onAFKTimedOutCallback = () => {
            this.setDisconnectMessageOverride(
                'You have been disconnected due to inactivity'
            );
            this.closeSignalingServer();
        };

        this.freezeFrameController = new FreezeFrameController(
            this.application.videoElementParent
        );

        this.videoPlayer = new VideoPlayer(
            this.application.videoElementParent,
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

            this.sendDescriptorController.emitCommand(descriptor);
        };

        // Every time video player is resized in browser we need to reinitialize the mouse coordinate conversion and freeze frame sizing logic.
        this.videoPlayer.onResizePlayerCallback = () => {
            this.setUpMouseAndFreezeFrame();
        };

        this.streamController = new StreamController(this.videoPlayer);

        this.coordinateConverter = new CoordinateConverter(this.videoPlayer);

        this.sendrecvDataChannelController = new DataChannelController();
        this.recvDataChannelController = new DataChannelController();
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
        this.webSocketController.onWebSocketOncloseOverlayMessage = (event) =>
            this.application.onDisconnect(
                `Websocket disconnect (${event.code}) ${
                    event.reason != '' ? '- ' + event.reason : ''
                }`
            );
        this.webSocketController.onOpen.addEventListener('open', () => {
            this.webSocketController.requestStreamerList();
        });
        this.webSocketController.onClose.addEventListener('close', () => {
            this.afkController.stopAfkWarningTimer();

            // stop sending stats on interval if we have closed our connection
            if (this.statsTimerHandle && this.statsTimerHandle !== undefined) {
                window.clearInterval(this.statsTimerHandle);
            }
        });

        // set up the final webRtc player controller methods from within our application so a connection can be activated
        this.sendDescriptorController = new SendDescriptorController(
            this.dataChannelSender,
            this.streamMessageController
        );
        this.sendMessageController = new SendMessageController(
            this.dataChannelSender,
            this.streamMessageController
        );
        this.toStreamerMessagesController = new ToStreamerMessagesController(
            this.sendMessageController
        );
        this.registerMessageHandlers();
        this.streamMessageController.populateDefaultProtocol();

        // now that the application has finished instantiating connect the rest of the afk methods to the afk logic class
        this.afkController.showAfkOverlay = () =>
            this.application.showAfkOverlay(this.afkController.countDown);
        this.afkController.hideCurrentOverlay = () =>
            this.application.hideCurrentOverlay();

        this.inputClassesFactory = new InputClassesFactory(
            this.streamMessageController,
            this.videoPlayer,
            this.coordinateConverter
        );

        this.isUsingSFU = false;
        this.isQualityController = false;
        this.preferredCodec = '';

        this.config.addOnOptionSettingChangedListener(OptionParameters.StreamerId, (streamerid) => {
                // close the current peer connection and create a new one
                this.peerConnectionController.peerConnection.close();
                this.peerConnectionController.createPeerConnection(this.peerConfig, this.preferredCodec);
                this.webSocketController.sendSubscribe(streamerid);
            }
        );
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
            this.streamMessageController.fromStreamerMessages.getFromValue(
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
            () =>
                this.sendMessageController.sendMessageToStreamer('LatencyTest')
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
            (data: object) =>
                this.sendDescriptorController.emitUIInteraction(data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'Command',
            (data: object) => this.sendDescriptorController.emitCommand(data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'KeyDown',
            (data: Array<number>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'KeyDown',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'KeyUp',
            (data: Array<number>) =>
                this.sendMessageController.sendMessageToStreamer('KeyUp', data)
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'KeyPress',
            (data: Array<number>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'KeyPress',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'MouseEnter',
            (data: Array<number>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'MouseEnter',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'MouseLeave',
            (data: Array<number>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'MouseLeave',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'MouseDown',
            (data: Array<number>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'MouseDown',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'MouseUp',
            (data: Array<number>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'MouseUp',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'MouseMove',
            (data: Array<number>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'MouseMove',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'MouseWheel',
            (data: Array<number>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'MouseWheel',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'MouseDouble',
            (data: Array<number>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'MouseDouble',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'TouchStart',
            (data: Array<number>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'TouchStart',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'TouchEnd',
            (data: Array<number>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'TouchEnd',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'TouchMove',
            (data: Array<number>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'TouchMove',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'GamepadButtonPressed',
            (data: Array<number>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'GamepadButtonPressed',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'GamepadButtonReleased',
            (data: Array<number>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'GamepadButtonReleased',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'GamepadAnalog',
            (data: Array<number>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'GamepadAnalog',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XRHMDTransform',
            (data: Array<number>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'XRHMDTransform',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XRControllerTransform',
            (data: Array<number>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'XRControllerTransform',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XRSystem',
            (data: Array<number>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'XRSystem',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XRButtonTouched',
            (data: Array<number>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'XRButtonTouched',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XRButtonPressed',
            (data: Array<number>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'XRButtonPressed',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XRButtonReleased',
            (data: Array<number>) =>
                this.sendMessageController.sendMessageToStreamer(
                    'XRButtonReleased',
                    data
                )
        );
        this.streamMessageController.registerMessageHandler(
            MessageDirection.ToStreamer,
            'XRAnalog',
            (data: Array<number>) =>
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
            this.application.activateOnScreenKeyboard(command);
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
                            ) ||
                            !Object.prototype.hasOwnProperty.call(
                                message,
                                'byteLength'
                            )
                        ) {
                            Logger.Error(
                                Logger.GetStackTrace(),
                                `ToStreamer->${messageType} protocol definition was malformed as it didn't contain at least an id and a byteLength\n
                                           Definition was: ${JSON.stringify(message, null, 2)}`
                            );
                            // return in a forEach is equivalent to a continue in a normal for loop
                            return;
                        }
                        if (
                            message.byteLength > 0 &&
                            !Object.prototype.hasOwnProperty.call(
                                message,
                                'structure'
                            )
                        ) {
                            // If we specify a bytelength, will must have a corresponding structure
                            Logger.Error(
                                Logger.GetStackTrace(),
                                `ToStreamer->${messageType} protocol definition was malformed as it specified a byteLength but no accompanying structure`
                            );
                            // return in a forEach is equivalent to a continue in a normal for loop
                            return;
                        }

                        if (
                            this.streamMessageController.toStreamerHandlers.get(
                                messageType
                            )
                        ) {
                            // If we've registered a handler for this message type we can add it to our supported messages. ie registerMessageHandler(...)
                            this.streamMessageController.toStreamerMessages.add(
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
                            this.streamMessageController.fromStreamerMessages.add(
                                messageType,
                                message.id
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
        this.application.onInputControlOwnership(inputControlOwnership);
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
        if (!this.webSocketController.webSocket) {
            Logger.Log(
                Logger.GetStackTrace(),
                'A websocket connection has not been made yet so we will start the stream'
            );
            this.application.onWebRtcAutoConnect();
            this.connectToSignallingServer();
        } else {
            // set the replay status so we get a text overlay over an action overlay
            this.application.showActionOrErrorOnDisconnect = false;

            // set the disconnect message
            this.setDisconnectMessageOverride('Restarting stream...');

            // close the connection
            this.closeSignalingServer();

            // wait for the connection to close and restart the connection
            const autoConnectTimeout = setTimeout(() => {
                this.application.onWebRtcAutoConnect();
                this.connectToSignallingServer();
                clearTimeout(autoConnectTimeout);
            }, 3000);
        }
    }

    /**
     * Loads a freeze frame if it is required otherwise shows the play overlay
     */
    loadFreezeFrameOrShowPlayOverlay() {
        if (this.shouldShowPlayOverlay === true) {
            Logger.Log(Logger.GetStackTrace(), 'showing play overlay');
            this.application.showPlayOverlay();
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
            this.application.showErrorOverlay(
                'Could not play video stream because the video player was not initialized correctly.'
            );
            Logger.Error(
                Logger.GetStackTrace(),
                'Could not player video stream because the video player was not initialized correctly.'
            );

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

        this.touchController = this.inputClassesFactory.registerTouch(
            this.config.isFlagEnabled(Flags.FakeMouseWithTouches),
            this.videoElementParentClientRect
        );
        this.application.hideCurrentOverlay();

        if (this.streamController.audioElement.srcObject) {
            this.streamController.audioElement.muted =
                this.config.isFlagEnabled(Flags.StartVideoMuted);

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
                    this.application.showPlayOverlay();
                });
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
            this.application.showPlayOverlay();
        });
    }

    /**
     * Enable the video to play automatically if enableAutoplay is true
     */
    autoPlayVideoOrSetUpPlayOverlay() {
        if (this.config.isFlagEnabled(Flags.AutoPlayVideo)) {
            // attempt to play the video
            this.playStream();
        } else {
            this.application.showPlayOverlay();
        }
        this.resizePlayerStyle();
    }

    buildSignallingServerUrl() {
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

    /**
     * Connect to the Signaling server
     */
    connectToSignallingServer() {
        const signallingUrl = this.buildSignallingServerUrl();
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
            this.application.onWebRtcConnecting();
        this.peerConnectionController.showTextOverlaySetupFailure = () =>
            this.application.onWebRtcFailed();

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

		const settingOptions = [...messageStreamerList.ids] // copy the original messageStreamerList.ids
		settingOptions.unshift('') // add an empty option at the top
        this.config.setOptionSettingOptions(OptionParameters.StreamerId, settingOptions);

        const urlParams = new URLSearchParams(window.location.search);
        if(messageStreamerList.ids.length == 1) {
            // If there's only a single streamer, subscribe to it regardless of what is in the URL
            this.config.setOptionSettingValue(OptionParameters.StreamerId, messageStreamerList.ids[0]);
        } else if (this.config.isFlagEnabled(Flags.PreferSFU) && messageStreamerList.ids.includes("SFU")) {
            // If the SFU toggle is on and there's an SFU connected, subscribe to it regardless of what is in the URL
            this.config.setOptionSettingValue(OptionParameters.StreamerId, "SFU");
        } else if (urlParams.has(OptionParameters.StreamerId) && messageStreamerList.ids.includes(urlParams.get(OptionParameters.StreamerId))) {
            // If there's a streamer ID in the URL and a streamer with this ID is connected, set it as the selected streamer
            this.config.setOptionSettingValue(OptionParameters.StreamerId, urlParams.get(OptionParameters.StreamerId));
        }
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
        this.application.onWebRtcSdp();

        if (this.statsTimerHandle && this.statsTimerHandle !== undefined) {
            window.clearInterval(this.statsTimerHandle);
        }

        this.statsTimerHandle = window.setInterval(() => this.getStats(), 1000);

        /*  */
        this.activateRegisterMouse();
        this.keyboardController = this.inputClassesFactory.registerKeyBoard(
            this.config
        );
        this.gamePadController = this.inputClassesFactory.registerGamePad();
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
     * registers the mouse for use in WebRtcPlayerController
     */
    activateRegisterMouse() {
        const mouseMode = this.config.isFlagEnabled(Flags.HoveringMouseMode)
            ? ControlSchemeType.HoveringMouse
            : ControlSchemeType.LockedMouse;
        this.mouseController =
            this.inputClassesFactory.registerMouse(mouseMode);
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
        this.webSocketController.close();
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
        this.sendDescriptorController.sendLatencyTest({
            StartTime: this.latencyStartTime
        });
    }

    /**
     * Send the Encoder Settings to the UE Instance as a UE UI Descriptor.
     * @param encoder - Encoder Settings
     */
    sendEncoderSettings(encoder: EncoderSettings) {
        Logger.Log(
            Logger.GetStackTrace(),
            '----   Encoder Settings    ----\n' +
                JSON.stringify(encoder, undefined, 4) +
                '\n-------------------------------',
            6
        );

        if (encoder.MinQP != null) {
            this.sendDescriptorController.emitCommand({
                'Encoder.MinQP': encoder.MinQP
            });
        }
        if (encoder.MaxQP != null) {
            this.sendDescriptorController.emitCommand({
                'Encoder.MaxQP': encoder.MaxQP
            });
        }
    }

    /**
     * Send the WebRTC Settings to the UE Instance as a UE UI Descriptor.
     * @param webRTC - Web RTC Settings
     */
    sendWebRtcSettings(webRTC: WebRTCSettings) {
        Logger.Log(
            Logger.GetStackTrace(),
            '----   WebRTC Settings    ----\n' +
                JSON.stringify(webRTC, undefined, 4) +
                '\n-------------------------------',
            6
        );

        // 4.27 and 5 compatibility
        if (webRTC.FPS != null) {
            this.sendDescriptorController.emitCommand({
                'WebRTC.Fps': webRTC.FPS
            });
            this.sendDescriptorController.emitCommand({
                'WebRTC.MaxFps': webRTC.FPS
            });
        }
        if (webRTC.MinBitrate != null) {
            this.sendDescriptorController.emitCommand({
                'PixelStreaming.WebRTC.MinBitrate': webRTC.MinBitrate
            });
        }
        if (webRTC.MaxBitrate != null) {
            this.sendDescriptorController.emitCommand({
                'PixelStreaming.WebRTC.MaxBitrate ': webRTC.MaxBitrate
            });
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
        this.sendDescriptorController.emitCommand({ 'stat.fps': '' });
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
        this.application.onLatencyTestResult(latencyTestResults);
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

        if (parsedInitialSettings.ConfigOptions) {
            this.config.setFlagEnabled(
                Flags.HoveringMouseMode,
                !!parsedInitialSettings.ConfigOptions.DefaultToHover
            );
        }

        initialSettings.ueCompatible();
        Logger.Log(Logger.GetStackTrace(), payloadAsString, 6);

        this.application.onInitialSettings(initialSettings);
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
        this.application.onVideoEncoderAvgQP(AvgQP);
    }

    /**
     * Handles when the video element has been loaded with a srcObject
     */
    handleVideoInitialized() {
        this.application.onVideoInitialized();

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
        this.application.onQualityControlOwnership(this.isQualityController);
    }

    /**
     * Handles when the Aggregated stats are Collected
     * @param stats - Aggregated Stats
     */
    handleVideoStats(stats: AggregatedStats) {
        this.application.onVideoStats(stats);
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
}

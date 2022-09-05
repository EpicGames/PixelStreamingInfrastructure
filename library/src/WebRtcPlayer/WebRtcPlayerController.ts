import { WebSocketController } from "../WebSockets/WebSocketController";
import { StreamController } from "../VideoPlayer/StreamController";
import { MessageInstanceState, MessageAnswer, MessageAuthResponse, MessageConfig } from "../WebSockets/MessageReceive";
import { UiController } from "../Ui/UiController";
import { FreezeFrameController } from "../FreezeFrame/FreezeFrameController";
import { AfkLogic } from "../Afk/AfkLogic";
import { DataChannelController } from "../DataChannel/DataChannelController";
import { PeerConnectionController } from "../PeerConnectionController/PeerConnectionController"
import { KeyboardController } from "../Inputs/KeyboardController";
import { TouchController } from "../Inputs/TouchController";
import { AggregatedStats } from "../PeerConnectionController/AggregatedStats";
import { IWebRtcPlayerController } from "./IWebRtcPlayerController";
import { IDelegate } from "../Delegate/IDelegate";
import { Config } from "../Config/Config";
import { Encoder, InitialSettings, WebRTC } from "../DataChannel/InitialSettings";
import { LatencyTestResults } from "../DataChannel/LatencyTestResults";
import { Logger } from "../Logger/Logger";
import { FileLogic } from "../FileManager/FileLogic";
import { InputClassesFactory } from "../Inputs/InputClassesFactory";
import { MicController } from "../MicPlayer/MicController";
import { VideoPlayer } from "../VideoPlayer/VideoPlayer";
import { StreamMessageController, MessageDirection } from "../UeInstanceMessage/StreamMessageController";
import { CommandController } from "../UeInstanceMessage/CommandController";
import { ResponseController } from "../UeInstanceMessage/ResponseController";
import * as MessageReceive from "../WebSockets/MessageReceive";
import { IInitialSettings } from "../DataChannel/IInitialSettings";
import { ILatencyTestResults } from "../DataChannel/ILatencyTestResults";
import { IStreamMessageController } from "../UeInstanceMessage/IStreamMessageController";
import { SendDescriptorController } from "../UeInstanceMessage/SendDescriptorController";
import { SendMessageController } from "../UeInstanceMessage/SendMessageController";
import { ToStreamerMessagesController } from "../UeInstanceMessage/ToStreamerMessagesController";
import { MouseController } from "../Inputs/MouseController";
import { FakeTouchController } from "../Inputs/FakeTouchController";
import { GamePadController } from "../Inputs/GamepadController";
import { GyroController } from "../Inputs/GyroController";
import { DataChannelSender } from "../DataChannel/DataChannelSender";
import { NormalizeAndQuantize } from "../NormalizeAndQuantize/NormalizeAndQuantize";
/**
 * Entry point for the Web RTC Player
 */
export class webRtcPlayerController implements IWebRtcPlayerController {
	config: Config;
	commandController: CommandController;
	responseController: ResponseController;
	sdpConstraints: RTCOfferOptions;
	webSocketController: WebSocketController;
	dataChannelController: DataChannelController;
	dataChannelSender: DataChannelSender;
	datachannelOptions: RTCDataChannelInit;
	videoPlayer: VideoPlayer;
	streamController: StreamController;
	peerConnectionController: PeerConnectionController;
	uiController: UiController;
	inputClassesFactory: InputClassesFactory;
	freezeFrameController: FreezeFrameController;
	shouldShowPlayOverlay: boolean = true;
	afkLogic: AfkLogic;
	playerElementClientRect: DOMRect;
	lastTimeResized = new Date().getTime();
	matchViewportResolution: boolean;
	resizeTimeout: ReturnType<typeof setTimeout>;
	latencyStartTime: number;
	delegate: IDelegate;
	fileLogic: FileLogic;
	streamMessageController: IStreamMessageController;
	sendDescriptorController: SendDescriptorController;
	sendMessageController: SendMessageController;
	toStreamerMessagesController: ToStreamerMessagesController;
	keyboardController: KeyboardController;
	mouseController: MouseController;
	touchController: TouchController | FakeTouchController;
	gamePadController: GamePadController;
	gyroController: GyroController;
	normalizeAndQuantize: NormalizeAndQuantize;


	// if you override the disconnection message by calling the interface method setDisconnectMessageOverride
	// it will use this property to store the override message string
	disconnectMessageOverride: string;

	// for mic support 
	urlParams: URLSearchParams;
	micController: MicController;

	/**
	 * 
	 * @param config - the frontend config object 
	 * @param delegate - the delegate interface object 
	 */
	constructor(config: Config, delegate: IDelegate) {
		this.config = config;
		this.delegate = delegate;
		this.commandController = new CommandController();
		this.responseController = new ResponseController();
		this.fileLogic = new FileLogic();

		this.sdpConstraints = {
			offerToReceiveAudio: true,
			offerToReceiveVideo: true
		}

		// set up the afk logic class and connect up its method for closing the signaling server 
		this.afkLogic = new AfkLogic(this.config.controlScheme, this.config.afkTimeout);
		this.afkLogic.setDisconnectMessageOverride = (message: string) => this.setDisconnectMessageOverride(message);
		this.afkLogic.closeWebSocket = () => this.closeSignalingServer();

		this.freezeFrameController = new FreezeFrameController(this.config.playerElement);

		this.videoPlayer = new VideoPlayer(this.config.playerElement, this.config.startVideoMuted);
		this.streamController = new StreamController(this.videoPlayer);

		this.normalizeAndQuantize = new NormalizeAndQuantize(this.videoPlayer);

		this.uiController = new UiController(this.videoPlayer);
		this.uiController.setUpMouseAndFreezeFrame = (element: HTMLDivElement) => this.setUpMouseAndFreezeFrame(element);

		this.dataChannelController = new DataChannelController();
		this.dataChannelController.dataChannel.onmessage = (ev: MessageEvent<any>) => this.handelOnMessage(ev);
		this.dataChannelController.dataChannel.onopen = () => this.handleDataChannelConnected();
		this.dataChannelSender = new DataChannelSender(this.dataChannelController);
		this.dataChannelSender.resetAfkWarningTimerOnDataSend = () => this.afkLogic.resetAfkWarningTimer();

		this.streamMessageController = new StreamMessageController();

		// set up websocket methods
		this.webSocketController = new WebSocketController(this.config.signallingServerAddress);
		this.webSocketController.onConfig = (messageConfig: MessageReceive.MessageConfig) => this.handleOnConfigMessage(messageConfig);
		this.webSocketController.onInstanceStateChange = (instanceState: MessageReceive.MessageInstanceState) => this.handleInstanceStateChange(instanceState);
		this.webSocketController.onAuthenticationResponse = (authResponse: MessageReceive.MessageAuthResponse) => this.handleAuthenticationResponse(authResponse);
		this.webSocketController.onWebSocketOncloseOverlayMessage = (event) => this.delegate.onDisconnect(`${event.code} - ${event.reason}`);

		// set up the final webRtc player controller methods from within our delegate so a connection can be activated
		this.sendDescriptorController = new SendDescriptorController(this.dataChannelSender, this.streamMessageController);
		this.sendMessageController = new SendMessageController(this.dataChannelSender, this.streamMessageController);
		this.toStreamerMessagesController = new ToStreamerMessagesController(this.sendMessageController);
		this.delegate.setIWebRtcPlayerController(this);
		this.registerMessageHandlers();
		this.streamMessageController.populateDefaultProtocol();

		// now that the delegate has finished instantiating connect the rest of the afk methods to the afk logic class
		this.afkLogic.showAfkOverlay = () => this.delegate.showAfkOverlay(this.afkLogic.countDown);
		this.afkLogic.updateAfkCountdown = () => this.delegate.updateAfkOverlay(this.afkLogic.countDown);
		this.afkLogic.hideCurrentOverlay = () => this.delegate.hideCurrentOverlay();
		this.webSocketController.stopAfkWarningTimer = () => this.afkLogic.stopAfkWarningTimer();

		this.inputClassesFactory = new InputClassesFactory(this.streamMessageController, this.videoPlayer);
	}

	/**
	 * Handles when a message is received 
	 * @param event - Message Event
	 */
	handelOnMessage(event: MessageEvent) {
		let message = new Uint8Array(event.data);
		Logger.Log(Logger.GetStackTrace(), "Message incoming:" + message, 6);

		//try {
		let messageType = this.streamMessageController.fromStreamerMessages.getFromValue(message[0]);
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
		this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "QualityControlOwnership", (data: any) => this.onQualityControlOwnership(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "Response", (data: any) => this.responseController.onResponse(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "Command", (data: any) => this.commandController.onCommand(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "FreezeFrame", (data: any) => this.onFreezeFrameMessage(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "UnfreezeFrame", () => this.invalidateFreezeFrameAndEnableVideo());
		this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "VideoEncoderAvgQP", (data: any) => this.handleVideoEncoderAvgQP(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "LatencyTest", (data: any) => this.handleLatencyTestResult(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "InitialSettings", (data: any) => this.handleInitialSettings(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "FileExtension", (data: any) => this.onFileExtension(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "FileMimeType", (data: any) => this.onFileMimeType(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "FileContents", (data: any) => this.onFileContents(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "TestEcho", () => {/* Do nothing */ });
		this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "InputControlOwnership", (data: any) => this.onInputControlOwnership(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.FromStreamer, "Protocol", (data: any) => this.onProtocolMessage(data));

		// To Streamer 
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "IFrameRequest", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "RequestQualityControl", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "FpsRequest", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "AverageBitrateRequest", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "StartStreaming", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "StopStreaming", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "LatencyTest", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "RequestInitialSettings", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "TestEcho", () => { /* Do nothing */ });
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "UIInteraction", (data: any) => this.sendDescriptorController.emitUIInteraction(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "Command", (data: any) => this.sendDescriptorController.emitCommand(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "KeyDown", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "KeyUp", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "KeyPress", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "MouseEnter", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "MouseLeave", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "MouseDown", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "MouseUp", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "MouseMove", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "MouseWheel", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "MouseDouble", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "TouchStart", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "TouchEnd", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "TouchMove", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "GamepadButtonPressed", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "GamepadButtonReleased", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
		this.streamMessageController.registerMessageHandler(MessageDirection.ToStreamer, "GamepadAnalog", (data: any) => this.sendMessageController.sendMessageToStreamer(data));
	}

	onProtocolMessage(message: Uint8Array) {
		try {
			let protocolString = new TextDecoder("utf-16").decode(message.slice(1));
			let protocolJSON = JSON.parse(protocolString);
			if (!protocolJSON.hasOwnProperty("Direction")) {
				Logger.Error(Logger.GetStackTrace(), 'Malformed protocol received. Ensure the protocol message contains a direction');
			}
			let direction = protocolJSON.Direction;
			delete protocolJSON.Direction;
			Logger.Log(Logger.GetStackTrace(), `Received new ${direction == MessageDirection.FromStreamer ? "FromStreamer" : "ToStreamer"} protocol. Updating existing protocol...`);
			Object.keys(protocolJSON).forEach((messageType) => {
				let message = protocolJSON[messageType];
				switch (direction) {
					case MessageDirection.ToStreamer:
						// Check that the message contains all the relevant params
						if (!message.hasOwnProperty("id") || !message.hasOwnProperty("byteLength")) {
							Logger.Error(Logger.GetStackTrace(), `ToStreamer->${messageType} protocol definition was malformed as it didn't contain at least an id and a byteLength\n
										   Definition was: ${JSON.stringify(message, null, 2)}`);
							// return in a forEach is equivalent to a continue in a normal for loop
							return;
						}
						if (message.byteLength > 0 && !message.hasOwnProperty("structure")) {
							// If we specify a bytelength, will must have a corresponding structure
							Logger.Error(Logger.GetStackTrace(), `ToStreamer->${messageType} protocol definition was malformed as it specified a byteLength but no accompanying structure`);
							// return in a forEach is equivalent to a continue in a normal for loop
							return;
						}

						if (this.streamMessageController.toStreamerHandlers.get(messageType)) {
							// If we've registered a handler for this message type we can add it to our supported messages. ie registerMessageHandler(...)
							this.streamMessageController.toStreamerMessages.add(messageType, message);
						} else {
							Logger.Error(Logger.GetStackTrace(), `There was no registered handler for "${messageType}" - try adding one using registerMessageHandler(MessageDirection.ToStreamer, "${messageType}", myHandler)`);
						}
						break;
					case MessageDirection.FromStreamer:
						// Check that the message contains all the relevant params
						if (!message.hasOwnProperty("id")) {
							Logger.Error(Logger.GetStackTrace(), `FromStreamer->${messageType} protocol definition was malformed as it didn't contain at least an id\n
							Definition was: ${JSON.stringify(message, null, 2)}`);
							// return in a forEach is equivalent to a continue in a normal for loop
							return;
						}
						if (this.streamMessageController.fromStreamerHandlers.get(messageType)) {
							// If we've registered a handler for this message type. ie registerMessageHandler(...)
							this.streamMessageController.fromStreamerMessages.add(messageType, message.id);
						} else {
							Logger.Error(Logger.GetStackTrace(), `There was no registered handler for "${message}" - try adding one using registerMessageHandler(MessageDirection.FromStreamer, "${messageType}", myHandler)`);
						}
						break;
					default:
						Logger.Error(Logger.GetStackTrace(), `Unknown direction: ${direction}`);
				}
			});

			// Once the protocol has been received, we can send our control messages
			this.toStreamerMessagesController.SendRequestInitialSettings();
			this.toStreamerMessagesController.SendRequestQualityControl();
		} catch (e) {
			Logger.Log(Logger.GetStackTrace(), e);
		}
	}

	onInputControlOwnership(message: Uint8Array) {
		Logger.Log(Logger.GetStackTrace(), "DataChannelReceiveMessageType.InputControlOwnership", 6);
		let inputControlOwnership = new Boolean(message[1]).valueOf();
		Logger.Log(Logger.GetStackTrace(), `Received input controller message - will your input control the stream: ${inputControlOwnership}`);
		this.delegate.onInputControlOwnership(inputControlOwnership);
	}

	/**
	 * connect up the onAfkClick action with a method so it can be exposed to the delegate
	 */
	onAfkClick(): void {
		this.afkLogic.onAfkClick();

		// if the stream is paused play it
		if (this.videoPlayer.videoElement.paused === true) {
			this.playStream();
		}
	}

	/**
	 * Restart the stream automaticity without refreshing the page
	 */
	restartStreamAutomaticity() {
		// if there is no webSocketController return immediately or this will not work
		if (!this.webSocketController) {
			Logger.Log(Logger.GetStackTrace(), "The Web Socket Controller does not exist so this will not work right now.");
			return;
		}

		// if a websocket object has not been created connect normally without closing 
		if (!this.webSocketController.webSocket) {
			Logger.Log(Logger.GetStackTrace(), "A websocket connection has not been made yet so we will start the stream");
			this.delegate.onWebRtcAutoConnect();
			this.connectToSignallingSever();

		} else {
			// set the replay status so we get a text overlay over an action overlay
			this.delegate.showActionOrErrorOnDisconnect = false;

			// set the disconnect message
			this.setDisconnectMessageOverride("Restarting stream manually");

			// close the connection 
			this.closeSignalingServer();

			// wait for the connection to close and restart the connection
			let autoConnectTimeout = setTimeout(() => {
				this.delegate.onWebRtcAutoConnect();
				this.connectToSignallingSever();
				clearTimeout(autoConnectTimeout);
			}, 3000);
		}
	}

	/**
	 * Sets if we are enlarging the display to fill the window for freeze frames and ui controller
	 * @param isFilling is the display filling or not
	 */
	setEnlargeToFillDisplay(isFilling: boolean) {
		this.freezeFrameController.freezeFrame.enlargeDisplayToFillWindow = isFilling;
		this.uiController.enlargeDisplayToFillWindow = isFilling;
	}

	/**
	 * Loads a freeze frame if it is required otherwise shows the play overlay
	 */
	loadFreezeFrameOrShowPlayOverlay() {
		if (this.shouldShowPlayOverlay === true) {
			Logger.Log(Logger.GetStackTrace(), "showing play overlay");
			this.delegate.showPlayOverlay();
			this.resizePlayerStyle();
		} else {
			Logger.Log(Logger.GetStackTrace(), "showing freeze frame");
			this.freezeFrameController.showFreezeFrame();
		}
		this.videoPlayer.setVideoEnabled(false);
	}

	/**
	 * Process the freeze frame and load it
	 * @param message The freeze frame data in bytes 
	 */
	onFreezeFrameMessage(message: Uint8Array) {
		Logger.Log(Logger.GetStackTrace(), "DataChannelReceiveMessageType.FreezeFrame", 6);
		let view = new Uint8Array(message);
		this.freezeFrameController.processFreezeFrameMessage(view, () => this.loadFreezeFrameOrShowPlayOverlay());
	}

	/**
	 * Enable the video after hiding a freeze frame
	 */
	invalidateFreezeFrameAndEnableVideo() {
		Logger.Log(Logger.GetStackTrace(), "DataChannelReceiveMessageType.FreezeFrame", 6);
		//this.isReceivingFreezeFrame = false;

		this.freezeFrameController.hideFreezeFrame();
		if (this.videoPlayer.videoElement) {
			this.videoPlayer.setVideoEnabled(true);
		}
	}

	/**
	 * Prep datachannel data for processing file extension
	 * @param data the file extension data  
	 */
	onFileExtension(data: any) {
		let view = new Uint8Array(data);
		this.fileLogic.processFileExtension(view);
	}

	/**
	 * Prep datachannel data for processing the file mime type
	 * @param data the file mime type data  
	 */
	onFileMimeType(data: any) {
		let view = new Uint8Array(data);
		this.fileLogic.processFileMimeType(view);
	}

	/**
	 * Prep datachannel data for processing the file contents 
	 * @param data the file contents data  
	 */
	onFileContents(data: any) {
		let view = new Uint8Array(data);
		this.fileLogic.processFileContents(view);
	}

	/**
	 * Plays the stream audio and video source and sets up other pieces while the stream starts
	 */
	playStream() {
		if (!this.videoPlayer.videoElement) {
			this.delegate.showErrorOverlay("Could not player video stream because the video player was not initialised correctly.");
			Logger.Error(Logger.GetStackTrace(), "Could not player video stream because the video player was not initialised correctly.");

			// set the disconnect message
			this.setDisconnectMessageOverride("Stream not initialised correctly");

			// close the connection 
			this.closeSignalingServer();
		} else {
			this.touchController = this.inputClassesFactory.registerTouch(this.config.fakeMouseWithTouches);
			if (this.streamController.audioElement) {
				this.streamController.audioElement.play().then(() => {
					this.playVideo();
				}).catch((onRejectedReason) => {
					Logger.Log(Logger.GetStackTrace(), onRejectedReason);
					Logger.Log(Logger.GetStackTrace(), "Browser does not support autoplaying video without interaction - to resolve this we are going to show the play button overlay.");
					this.delegate.showPlayOverlay();
				});
			} else {
				this.playVideo();
			}
			this.shouldShowPlayOverlay = false;
			this.freezeFrameController.showFreezeFrame();
			this.delegate.hideCurrentOverlay();
		}
	}

	/**
	 * Plays the video stream
	 */
	private playVideo() {
		// // handle play() with .then as it is an asynchronous call  
		this.videoPlayer.videoElement.play().catch((onRejectedReason: string) => {
			if (this.streamController.audioElement.srcObject) {
				this.streamController.audioElement.pause();
			}
			Logger.Log(Logger.GetStackTrace(), onRejectedReason);
			Logger.Log(Logger.GetStackTrace(), "Browser does not support autoplaying video without interaction - to resolve this we are going to show the play button overlay.");
			this.delegate.showPlayOverlay();
		});
	}

	/**
	 * Enable the video to play automaticity if enableSpsAutoplay is true
	 */
	autoPlayVideoOrSetUpPlayOverlay() {
		if (this.config.enableSpsAutoplay === true) {

			// set up the auto play on the video element  
			this.videoPlayer.videoElement.autoplay = true;

			// attempt to play the video
			this.playStream();
		} else {
			this.delegate.showPlayOverlay();
		}
	}

	/**
	 * Connect to the Signaling server
	 */
	connectToSignallingSever() {
		this.webSocketController.connect();
	}

	/**
	 * This will start the handshake to the signalling server
	 * @param peerConfig  - RTC Configuration Options from the Signaling server
	 * @remark RTC Peer Connection on Ice Candidate event have it handled by handle Send Ice Candidate
	 */
	startSession(peerConfig: RTCConfiguration) {
		// set up url params for STUN, Mic and SFU
		this.urlParams = new URLSearchParams(window.location.search);

		// check for forcing turn
		if (this.urlParams.has('ForceTURN')) {
			// check for a turn server
			const hasTurnServer = this.checkTurnServerAvailability(peerConfig);

			// close and error if turn is forced and there is no turn server
			if (!hasTurnServer) {
				Logger.Info(Logger.GetStackTrace(), "No turn server was found in the Peer Connection Options. TURN cannot be forced, closing connection. Please use STUN instead");
				this.setDisconnectMessageOverride("TURN cannot be forced, closing connection. Please use STUN instead.");
				this.closeSignalingServer();
				return;
			}
		}

		// set up the peer connection controller
		this.peerConnectionController = new PeerConnectionController(peerConfig, this.urlParams.has('ForceTURN'));

		//set up mic controller
		this.micController = new MicController(this.urlParams)

		// set up peer connection controller video stats
		this.peerConnectionController.onVideoStats = (event: AggregatedStats) => this.handleVideoStats(event);

		/* When the Peer Connection Wants to send an offer have it handled */
		this.peerConnectionController.onSendWebRTCOffer = (offer: RTCSessionDescriptionInit) => this.handleSendWebRTCOffer(offer);

		/* When the Peer connection ice candidate is added have it handled */
		this.peerConnectionController.onPeerIceCandidate = (peerConnectionIceEvent: RTCPeerConnectionIceEvent) => this.handleSendIceCandidate(peerConnectionIceEvent);

		// handel mic connections with promise
		this.dataChannelController.createDataChannel(this.peerConnectionController.peerConnection, "cirrus", this.datachannelOptions);

		// set up webRtc text overlays 
		this.peerConnectionController.showTextOverlayConnecting = () => this.delegate.onWebRtcConnecting();
		this.peerConnectionController.showTextOverlaySetupFailure = () => this.delegate.onWebRtcFailed();

		/* RTC Peer Connection on Track event -> handle on track */
		this.peerConnectionController.onTrack = (trackEvent: RTCTrackEvent) => this.streamController.handleOnTrack(trackEvent);

		/* Start the Hand shake process by creating an Offer */
		this.peerConnectionController.createOffer(this.sdpConstraints, this.micController.useMic);
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
					Logger.Log(Logger.GetStackTrace(), `A turn sever was found at ${url}`);
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

		// Tell the WebRtcController to start a session with the peer options sent from the signaling server
		this.startSession(messageConfig.peerConnectionOptions);

		// When the signaling server sends a WebRTC Answer over the websocket connection have the WebRtcController handle the message
		this.webSocketController.onWebRtcAnswer = (messageAnswer: MessageReceive.MessageAnswer) => this.handleWebRtcAnswer(messageAnswer);

		// When the signaling server sends a IceCandidate over the websocket connection have the WebRtcController handle the message
		this.webSocketController.onIceCandidate = (iceCandidate: RTCIceCandidateInit) => this.handleIceCandidate(iceCandidate);
	}

	/**
	 * Handle the RTC Answer from the signaling server
	 * @param Answer - Answer Message from the Signaling server
	 */
	handleWebRtcAnswer(Answer: MessageAnswer) {
		Logger.Log(Logger.GetStackTrace(), "There is an answer", 6);

		let sdpAnswer: RTCSessionDescriptionInit = {
			sdp: Answer.sdp,
			type: "answer"
		}

		this.peerConnectionController.handleAnswer(sdpAnswer);

		// start the afk warning timer as the container is now running
		this.afkLogic.startAfkWarningTimer();

		// show the overlay that we have an answer
		this.delegate.onWebRtcAnswer();
	}

	/**
	 * When an ice Candidate is received from the Signaling server add it to the Peer Connection Client
	 * @param iceCandidate - Ice Candidate from Server
	 */
	handleIceCandidate(iceCandidate: RTCIceCandidateInit) {
		Logger.Log(Logger.GetStackTrace(), "Web RTC Controller: onWebRtcIce", 6);

		let candidate = new RTCIceCandidate(iceCandidate);
		this.peerConnectionController.handleOnIce(candidate);
	}

	/**
	 * Send the ice Candidate to the signaling server via websocket
	   * @param iceEvent - RTC Peer ConnectionIceEvent) {
	 */
	handleSendIceCandidate(iceEvent: RTCPeerConnectionIceEvent) {
		Logger.Log(Logger.GetStackTrace(), "OnIceCandidate", 6);
		if (iceEvent.candidate && iceEvent.candidate.candidate) {
			this.webSocketController.sendIceCandidate(iceEvent.candidate);
		}
	}

	/**
	 * Send the RTC Offer Session to the Signaling server via websocket
	 * @param offer - RTC Session Description
	 */
	handleSendWebRTCOffer(offer: RTCSessionDescriptionInit) {
		Logger.Log(Logger.GetStackTrace(), "Sending the offer to the Server", 6);
		this.webSocketController.sendWebRtcOffer(offer);
	}

	/**
	 * registers the mouse for use in IWebRtcPlayerController
	 */
	activateRegisterMouse() {
		this.mouseController = this.inputClassesFactory.registerMouse(this.config.controlScheme);
	}

	/**
	 * Sets up the Data channel Keyboard, Mouse, UE Control Message, UE Descriptor
	 */
	handleDataChannelConnected() {
		Logger.Log(Logger.GetStackTrace(), "Data Channel is open", 6);

		// show the connected overlay 
		this.delegate.onWebRtcConnected();

		this.videoPlayer.setMouseEnterAndLeaveEvents((event: any) => {
			this.mouseController.sendMouseEnter();
			this.mouseController.pressMouseButtons(event.buttons, event.x, event.y);
		}, (event: any) => {
			this.mouseController.sendMouseLeave();
			this.mouseController.releaseMouseButtons(event.buttons, event.x, event.y);
		});

		this.activateRegisterMouse()
		this.keyboardController = this.inputClassesFactory.registerKeyBoard(this.config.suppressBrowserKeys);
		this.gamePadController = this.inputClassesFactory.registerGamePad();

		this.resizePlayerStyle();

		setInterval(() => this.getStats(), 1000);

		// either autoplay the video or set up the play overlay
		this.autoPlayVideoOrSetUpPlayOverlay();

		this.resizePlayerStyle();

		this.sendDescriptorController.emitCommand(`r.setres ${this.videoPlayer.videoElement.clientWidth} x ${this.videoPlayer.videoElement.clientHeight}`);

		this.delegate.onVideoInitialised();

		this.uiController.updateVideoStreamSize = () => this.updateVideoStreamSize();
	}

	/**
	 * Handles when the web socket receives an authentication response
	 * @param authResponse - Authentication Response
	 */
	handleAuthenticationResponse(authResponse: MessageAuthResponse) {
		this.delegate.onAuthenticationResponse(authResponse);
	}

	/**
	 * Handles when the stream size changes
	 */
	updateVideoStreamSize() {
		// Call the setter before calling this function
		if (!this.matchViewportResolution) {
			return;
		}

		let now = new Date().getTime();
		if (now - this.lastTimeResized > 1000) {
			// get the root div from config 
			if (!this.config.playerElement) {
				return;
			}
			this.sendDescriptorController.emitCommand(`r.setres ${this.videoPlayer.videoElement.clientWidth} x ${this.videoPlayer.videoElement.clientHeight}`);
			this.lastTimeResized = new Date().getTime();
		}
		else {
			Logger.Log(Logger.GetStackTrace(), 'Resizing too often - skipping', 6);
			clearTimeout(this.resizeTimeout);
			this.resizeTimeout = setTimeout(this.updateVideoStreamSize, 1000);
		}
	}

	/**
	 * Handles when the Instance State Changes
	 * @param instanceState  - Instance State 
	 */
	handleInstanceStateChange(instanceState: MessageInstanceState) {
		this.delegate.onInstanceStateChange(instanceState)
	}

	/**
	 * Set the freeze frame overlay to the player div
	 * @param playerElement - The div element of the Player
	 */
	setUpMouseAndFreezeFrame(playerElement: HTMLDivElement) {
		// Calculating and normalizing positions depends on the width and height of the player.
		this.playerElementClientRect = playerElement.getBoundingClientRect();
		this.normalizeAndQuantize.setupNormalizeAndQuantize();
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
		this.sendDescriptorController.sendLatencyTest(this.latencyStartTime);
	}

	/**
	 * Send the Encoder Settings to the UE Instance as a UE UI Descriptor.
	 * @param encoder - Encoder Settings
	 */
	sendEncoderSettings(encoder: Encoder) {
		Logger.Log(Logger.GetStackTrace(), "----   Encoder Settings    ----\n" + JSON.stringify(encoder, undefined, 4) + "\n-------------------------------", 6);

		if (encoder.RateControl != null && (encoder.RateControl == "CBR" || "VBR" || "ConstQP")) {
			this.sendDescriptorController.emitCommand("PixelStreaming.Encoder.RateControl " + encoder.RateControl);
		}
		if (encoder.TargetBitrate != null) {
			this.sendDescriptorController.emitCommand("PixelStreaming.Encoder.TargetBitrate " + (encoder.TargetBitrate > 0 ? encoder.TargetBitrate : -1));
		}
		if (encoder.MaxBitrate != null) {
			this.sendDescriptorController.emitCommand("PixelStreaming.Encoder.MaxBitrateVBR " + (encoder.MaxBitrate > 0 ? encoder.MaxBitrate : 1));
		}
		if (encoder.MinQP != null) {
			this.sendDescriptorController.emitCommand("PixelStreaming.Encoder.MinQP " + encoder.MinQP);
		}
		if (encoder.MaxQP != null) {
			this.sendDescriptorController.emitCommand("PixelStreaming.Encoder.MaxQP " + encoder.MaxQP);
		}
		if (encoder.FillerData != null) {
			this.sendDescriptorController.emitCommand("PixelStreaming.Encoder.EnableFillerData " + Number(encoder.FillerData).valueOf());
		}
		if (encoder.MultiPass != null && (encoder.MultiPass == "DISABLED" || "QUARTER" || "FULL")) {
			this.sendDescriptorController.emitCommand("PixelStreaming.Encoder.Multipass " + encoder.MultiPass);
		}
	}

	/**
	 * Send the WebRTC Settings to the UE Instance as a UE UI Descriptor.
	 * @param webRTC - Web RTC Settings 
	 */
	sendWebRtcSettings(webRTC: WebRTC) {
		Logger.Log(Logger.GetStackTrace(), "----   WebRTC Settings    ----\n" + JSON.stringify(webRTC, undefined, 4) + "\n-------------------------------", 6);

		if (webRTC.DegradationPref != null && (webRTC.DegradationPref == "BALANCED" || "MAINTAIN_FRAMERATE" || "MAINTAIN_RESOLUTION")) {
			this.sendDescriptorController.emitCommand("PixelStreaming.WebRTC.DegradationPreference " + webRTC.DegradationPref);
		}

		if (webRTC.FPS != null) {
			this.sendDescriptorController.emitCommand("PixelStreaming.WebRTC.Fps " + webRTC.FPS);
			this.sendDescriptorController.emitCommand("PixelStreaming.WebRTC.MaxFps " + webRTC.FPS);
		}

		if (webRTC.MinBitrate != null) {
			this.sendDescriptorController.emitCommand("PixelStreaming.WebRTC.MinBitrate " + webRTC.MinBitrate);
		}
		if (webRTC.MaxBitrate != null) {
			this.sendDescriptorController.emitCommand("PixelStreaming.WebRTC.MaxBitrate " + webRTC.MaxBitrate);
		}
		if (webRTC.LowQP != null) {
			this.sendDescriptorController.emitCommand("PixelStreaming.WebRTC.LowQpThreshold " + webRTC.LowQP);
		}
		if (webRTC.HighQP != null) {
			this.sendDescriptorController.emitCommand("PixelStreaming.WebRTC.HighQpThreshold " + webRTC.HighQP);
		}
	}

	/**
	 * Send Aggregated Stats to the Signaling Server
	 * @param stats - Aggregated Stats
	 */
	sendStatsToSignallingServer(stats: AggregatedStats) {
		Logger.Log(Logger.GetStackTrace(), "----   Sending Aggregated Stats to Signaling Server   ----\n" + JSON.stringify(stats, undefined, 4) + "\n-----------------------------------------------------------", 6);
		this.webSocketController.sendStats(stats);
	}

	/**
	 * Sends a UI Interaction Descriptor to the UE Instance
	 * @param message - String to send to the UE Instance
	 */
	sendUeUiDescriptor(message: string): void {
		Logger.Log(Logger.GetStackTrace(), "----   UE UI Interaction String   ----\n" + JSON.stringify(message, undefined, 4) + "\n---------------------------------------", 6);
		this.sendDescriptorController.emitUIInteraction(message);
	}

	/**
	 * Sends the UI Descriptor `stat fps` to the UE Instance 
	 */
	sendShowFps(): void {
		Logger.Log(Logger.GetStackTrace(), "----   Sending show stat to UE   ----", 6);
		this.sendDescriptorController.emitCommand("stat fps");
	}

	sendIframeRequest(): void {
		Logger.Log(Logger.GetStackTrace(), "----   Sending Request for an IFrame  ----", 6);
		this.streamMessageController.toStreamerHandlers.get("IFrameRequest");
	}

	/**
	 * Sends a request to the UE Instance to have ownership of Quality
	 */
	sendRequestQualityControlOwnership(): void {
		Logger.Log(Logger.GetStackTrace(), "----   Sending Request to Control Quality  ----", 6);
		this.toStreamerMessagesController.SendRequestQualityControl();
	}

	/**
	 * Handles when a Latency Test Result are received from the UE Instance
	 * @param message - Latency Test Timings
	 */
	handleLatencyTestResult(message: Uint8Array) {
		Logger.Log(Logger.GetStackTrace(), "DataChannelReceiveMessageType.latencyTest", 6);
		let latencyAsString = new TextDecoder("utf-16").decode(message.slice(1));
		let iLatencyTestResults: ILatencyTestResults = JSON.parse(latencyAsString);
		let latencyTestResults: LatencyTestResults = new LatencyTestResults();
		Object.assign(latencyTestResults, iLatencyTestResults);
		latencyTestResults.processFields();

		latencyTestResults.testStartTimeMs = this.latencyStartTime;
		latencyTestResults.browserReceiptTimeMs = Date.now();

		latencyTestResults.latencyExcludingDecode = ~~(latencyTestResults.browserReceiptTimeMs - latencyTestResults.testStartTimeMs);
		latencyTestResults.testDuration = ~~(latencyTestResults.TransmissionTimeMs - latencyTestResults.ReceiptTimeMs);
		latencyTestResults.networkLatency = ~~(latencyTestResults.latencyExcludingDecode - latencyTestResults.testDuration);

		if (latencyTestResults.frameDisplayDeltaTimeMs && latencyTestResults.browserReceiptTimeMs) {
			latencyTestResults.endToEndLatency = ~~(latencyTestResults.frameDisplayDeltaTimeMs + latencyTestResults.networkLatency, + latencyTestResults.CaptureToSendMs);
		}
		this.delegate.onLatencyTestResult(latencyTestResults);
	}

	/**
	 * Handles when the Encoder and Web RTC Settings are received from the UE Instance
	 * @param message - Initial Encoder and Web RTC Settings
	 */
	handleInitialSettings(message: Uint8Array) {
		Logger.Log(Logger.GetStackTrace(), "DataChannelReceiveMessageType.InitialSettings", 6);
		let payloadAsString = new TextDecoder("utf-16").decode(message.slice(1));
		let iInitialSettings: IInitialSettings = JSON.parse(payloadAsString);
		let initialSettings: InitialSettings = new InitialSettings();
		Object.assign(initialSettings, iInitialSettings);
		initialSettings.ueCompatible()
		Logger.Log(Logger.GetStackTrace(), payloadAsString, 6);

		this.delegate.onInitialSettings(initialSettings);
	}

	/**
	 * Handles when the Quantization Parameter are received from the UE Instance
	 * @param message - Encoders Quantization Parameter
	 */
	handleVideoEncoderAvgQP(message: Uint8Array) {
		Logger.Log(Logger.GetStackTrace(), "DataChannelReceiveMessageType.VideoEncoderAvgQP", 6);
		let AvgQP = Number(new TextDecoder("utf-16").decode(message.slice(1)));
		this.delegate.onVideoEncoderAvgQP(AvgQP);
	}

	/**
	 * Flag set if the user has Quality Ownership
	 * @param message - Does the current client have Quality Ownership
	 */
	onQualityControlOwnership(message: Uint8Array) {
		Logger.Log(Logger.GetStackTrace(), "DataChannelReceiveMessageType.QualityControlOwnership", 6);
		let QualityOwnership = new Boolean(message[1]).valueOf();
		Logger.Log(Logger.GetStackTrace(), `Received quality controller message, will control quality: ${QualityOwnership}`);
		this.delegate.onQualityControlOwnership(QualityOwnership);
	}

	/**
	 * Handles when the Aggregated stats are Collected
	 * @param stats - Aggregated Stats
	 */
	handleVideoStats(stats: AggregatedStats) {
		this.delegate.onVideoStats(stats);
	}

	/**
	* To Resize the Video Player element
	*/
	resizePlayerStyle(): void {
		this.uiController.resizePlayerStyle();
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
}
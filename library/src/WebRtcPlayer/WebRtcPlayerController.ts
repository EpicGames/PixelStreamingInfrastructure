import { WebSocketController } from "../WebSockets/WebSocketController";
import { StreamController } from "../VideoPlayer/StreamController";
import { MessageInstanceState, MessageAnswer, MessageAuthResponse, MessageConfig } from "../WebSockets/MessageReceive";
import { UiController } from "../Ui/UiController";
import { FreezeFrameController } from "../FreezeFrame/FreezeFrameController";
import { AfkLogic } from "../Afk/AfkLogic";
import { DataChannelController } from "../DataChannel/DataChannelController";
import { PeerConnectionController } from "../PeerConnectionController/PeerConnectionController"
import { KeyboardController } from "../Inputs/KeyboardController";
import { ITouchController } from "../Inputs/ITouchController";
import { UeDescriptorUi } from "../UeInstanceMessage/UeDescriptorUi";
import { UeControlMessage } from "../UeInstanceMessage/UeControlMessage";
import { AggregatedStats } from "../PeerConnectionController/AggregatedStats";
import { IWebRtcPlayerController } from "./IWebRtcPlayerController";
import { IDelegate } from "../Delegate/IDelegate";
import { Config } from "../Config/Config";
import { Encoder, InitialSettings, WebRTC } from "../DataChannel/InitialSettings";
import { LatencyTestResults } from "../DataChannel/LatencyTestResults";
import { Logger } from "../Logger/Logger";
import { InputController } from "../Inputs/InputController";
import { MicController } from "../MicPlayer/MicController";
import { VideoPlayer } from "../VideoPlayer/VideoPlayer";
import * as MessageReceive from "../WebSockets/MessageReceive";
/**
 * Entry point for the Web RTC Player
 */
export class webRtcPlayerController implements IWebRtcPlayerController {
	config: Config;
	sdpConstraints: RTCOfferOptions;
	webSocketController: WebSocketController;
	dataChannelController: DataChannelController;
	datachannelOptions: RTCDataChannelInit;
	videoPlayer: VideoPlayer;
	streamController: StreamController;
	keyboardController: KeyboardController;
	touchController: ITouchController;
	ueControlMessage: UeControlMessage;
	ueDescriptorUi: UeDescriptorUi;
	peerConnectionController: PeerConnectionController;
	uiController: UiController;
	inputController: InputController;
	freezeFrameController: FreezeFrameController;
	shouldShowPlayOverlay: boolean = true;
	afkLogic: AfkLogic;
	playerElementClientRect: DOMRect;
	lastTimeResized = new Date().getTime();
	matchViewportResolution: boolean;
	resizeTimeout: ReturnType<typeof setTimeout>;
	latencyStartTime: number;
	delegate: IDelegate;

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

		this.sdpConstraints = {
			offerToReceiveAudio: true,
			offerToReceiveVideo: true
		}

		// set up the afk logic class and connect up its method for closing the signaling server 
		this.afkLogic = new AfkLogic(this.config.controlScheme, this.config.afkTimeout);
		this.afkLogic.closeWebSocket = () => this.closeSignalingServer();

		this.freezeFrameController = new FreezeFrameController(this.config.playerElement);

		this.videoPlayer = new VideoPlayer(this.config.playerElement, this.config.startVideoMuted);
		this.streamController = new StreamController(this.videoPlayer);

		this.uiController = new UiController(this.videoPlayer);
		this.uiController.setUpMouseAndFreezeFrame = (element: HTMLDivElement) => this.setUpMouseAndFreezeFrame(element);

		this.dataChannelController = new DataChannelController();
		this.dataChannelController.handleOnOpen = () => this.handleDataChannelConnected();
		this.dataChannelController.onLatencyTestResult = (latencyTestResults: LatencyTestResults) => this.handleLatencyTestResult(latencyTestResults);
		this.dataChannelController.onVideoEncoderAvgQP = (AvgQP: number) => this.handleVideoEncoderAvgQP(AvgQP);
		this.dataChannelController.OnInitialSettings = (InitialSettings: InitialSettings) => this.handleInitialSettings(InitialSettings);
		this.dataChannelController.onQualityControlOwnership = (hasQualityOwnership: boolean) => this.handleQualityControlOwnership(hasQualityOwnership);
		this.dataChannelController.resetAfkWarningTimerOnDataSend = () => this.afkLogic.resetAfkWarningTimer();

		// set up websocket methods
		this.webSocketController = new WebSocketController(this.config.signallingServerAddress);
		this.webSocketController.onConfig = (messageConfig: MessageReceive.MessageConfig) => this.handleOnConfigMessage(messageConfig);
		this.webSocketController.onInstanceStateChange = (instanceState: MessageReceive.MessageInstanceState) => this.handleInstanceStateChange(instanceState);
		this.webSocketController.onAuthenticationResponse = (authResponse: MessageReceive.MessageAuthResponse) => this.handleAuthenticationResponse(authResponse);
		this.webSocketController.onWebSocketOncloseOverlayMessage = (event) => this.delegate.onDisconnect(`${event.code} - ${event.reason}`);

		// set up the final webRtc player controller methods from within our delegate so a connection can be activated
		this.delegate.setIWebRtcPlayerController(this);

		// now that the delegate has finished instantiating connect the rest of the afk methods to the afk logic class
		this.afkLogic.showAfkOverlay = () => this.delegate.showAfkOverlay(this.afkLogic.countDown);
		this.afkLogic.updateAfkCountdown = () => this.delegate.updateAfkOverlay(this.afkLogic.countDown);
		this.afkLogic.hideCurrentOverlay = () => this.delegate.hideCurrentOverlay();
		this.webSocketController.stopAfkWarningTimer = () => this.afkLogic.stopAfkWarningTimer();
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
	 * Enable the video after hiding a freeze frame
	 */
	InvalidateFreezeFrameAndEnableVideo() {
		this.freezeFrameController.hideFreezeFrame();
		if (this.videoPlayer.videoElement) {
			this.videoPlayer.setVideoEnabled(true);
		}
	}

	/**
	 * Plays the stream audio and video source and sets up other pieces while the stream starts
	 */
	playStream() {
		if (!this.videoPlayer.videoElement) {
			this.delegate.showErrorOverlay("Could not player video stream because the video player was not initialised correctly.");
			Logger.Error(Logger.GetStackTrace(), "Could not player video stream because the video player was not initialised correctly.");
			// close the connection 
			this.closeSignalingServer();
		} else {
			this.inputController.registerTouch(this.config.fakeMouseWithTouches, this.videoPlayer.videoElement);
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

		// send and request initial stats
		this.ueControlMessage.SendRequestInitialSettings();
		this.ueControlMessage.SendRequestQualityControl();
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
				Logger.Error(Logger.GetStackTrace(), "No turn server was found in the Peer Connection Options from your signaling server. Turn cannot be forced");
				this.closeSignalingServer();
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
		this.inputController.registerMouse(this.config.controlScheme);
	}

	/**
	 * Sets up the Data channel Keyboard, Mouse, UE Control Message, UE Descriptor
	 */
	handleDataChannelConnected() {
		Logger.Log(Logger.GetStackTrace(), "Data Channel is open", 6);

		// show the connected overlay 
		this.delegate.onWebRtcConnected();

		this.inputController = new InputController(this.dataChannelController, this.videoPlayer);

		this.ueControlMessage = new UeControlMessage(this.dataChannelController);
		this.ueDescriptorUi = new UeDescriptorUi(this.dataChannelController);

		this.activateRegisterMouse()
		this.inputController.registerKeyBoard(this.config.suppressBrowserKeys);
		this.inputController.registerGamePad();

		this.videoPlayer.setMouseEnterAndLeaveEvents(() => this.inputController.mouseController.sendMouseEnter(), () => this.inputController.mouseController.sendMouseLeave());

		this.resizePlayerStyle();

		this.dataChannelController.processFreezeFrameMessage = (view) => this.freezeFrameController.processFreezeFrameMessage(view, () => this.loadFreezeFrameOrShowPlayOverlay());
		this.dataChannelController.onUnFreezeFrame = () => this.InvalidateFreezeFrameAndEnableVideo();

		setInterval(() => this.getStats(), 1000);

		// either autoplay the video or set up the play overlay
		this.autoPlayVideoOrSetUpPlayOverlay();

		this.resizePlayerStyle();

		this.ueDescriptorUi.sendUpdateVideoStreamSize(this.videoPlayer.videoElement.clientWidth, this.videoPlayer.videoElement.clientHeight);

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
			this.ueDescriptorUi.sendUpdateVideoStreamSize(this.videoPlayer.videoElement.clientWidth, this.videoPlayer.videoElement.clientHeight)
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
		this.ueControlMessage.sendLatencyTest(this.latencyStartTime);
	}

	/**
	 * Send the Encoder Settings to the UE Instance as a UE UI Descriptor.
	 * @param encoder - Encoder Settings
	 */
	sendEncoderSettings(encoder: Encoder) {
		Logger.Log(Logger.GetStackTrace(), "----   Encoder Settings    ----\n" + JSON.stringify(encoder, undefined, 4) + "\n-------------------------------", 6);

		if (encoder.RateControl != null) {
			this.ueDescriptorUi.sendEncoderRateControl(encoder.RateControl);
		}
		if (encoder.TargetBitrate != null) {
			this.ueDescriptorUi.sendEncoderTargetBitRate(encoder.TargetBitrate);
		}
		if (encoder.MaxBitrate != null) {
			this.ueDescriptorUi.sendEncoderMaxBitrateVbr(encoder.MaxBitrate);
		}
		if (encoder.MinQP != null) {
			this.ueDescriptorUi.sendEncoderMinQP(encoder.MinQP);
		}
		if (encoder.MaxQP != null) {
			this.ueDescriptorUi.sendEncoderMaxQP(encoder.MaxQP);
		}
		if (encoder.FillerData != null) {
			this.ueDescriptorUi.sendEncoderEnableFillerData(encoder.FillerData);
		}
		if (encoder.MultiPass != null) {
			this.ueDescriptorUi.sendEncoderMultiPass(encoder.MultiPass);
		}
	}

	/**
	 * Send the WebRTC Settings to the UE Instance as a UE UI Descriptor.
	 * @param webRTC - Web RTC Settings 
	 */
	sendWebRtcSettings(webRTC: WebRTC) {
		Logger.Log(Logger.GetStackTrace(), "----   WebRTC Settings    ----\n" + JSON.stringify(webRTC, undefined, 4) + "\n-------------------------------", 6);

		if (webRTC.DegradationPref != null) {
			this.ueDescriptorUi.sendWebRtcDegradationPreference(webRTC.DegradationPref)
		}

		if (webRTC.FPS != null) {
			this.ueDescriptorUi.sendWebRtcFps(webRTC.FPS);
			this.ueDescriptorUi.sendWebRtcMaxFps(webRTC.FPS);
		}

		if (webRTC.MinBitrate != null) {
			this.ueDescriptorUi.sendWebRtcMinBitrate(webRTC.MinBitrate);
		}
		if (webRTC.MaxBitrate != null) {
			this.ueDescriptorUi.sendWebRtcMaxBitrate(webRTC.MaxBitrate);
		}
		if (webRTC.LowQP != null) {
			this.ueDescriptorUi.sendWebRtcLowQpThreshold(webRTC.LowQP);
		}
		if (webRTC.HighQP != null) {
			this.ueDescriptorUi.sendWebRtcHighQpThreshold(webRTC.HighQP);
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
		this.ueDescriptorUi.sendUiInteraction(message);
	}

	/**
	 * Sends the UI Descriptor `stat fps` to the UE Instance 
	 */
	sendShowFps(): void {
		Logger.Log(Logger.GetStackTrace(), "----   Sending show stat to UE   ----", 6);
		this.ueDescriptorUi.sendShowFps();
	}

	/**
	 * Sends a request to the UE Instance to have ownership of Quality
	 */
	sendRequestQualityControlOwnership(): void {
		Logger.Log(Logger.GetStackTrace(), "----   Sending Request to Control Quality  ----", 6);
		this.ueControlMessage.SendRequestQualityControl();
	}

	/**
	 * Handles when a Latency Test Result are received from the UE Instance
	 * @param latencyTimings - Latency Test Timings
	 */
	handleLatencyTestResult(latencyTimings: LatencyTestResults) {
		latencyTimings.testStartTimeMs = this.latencyStartTime;
		latencyTimings.browserReceiptTimeMs = Date.now();

		latencyTimings.latencyExcludingDecode = ~~(latencyTimings.browserReceiptTimeMs - latencyTimings.testStartTimeMs);
		latencyTimings.testDuration = ~~(latencyTimings.TransmissionTimeMs - latencyTimings.ReceiptTimeMs);
		latencyTimings.networkLatency = ~~(latencyTimings.latencyExcludingDecode - latencyTimings.testDuration);

		if (latencyTimings.frameDisplayDeltaTimeMs && latencyTimings.browserReceiptTimeMs) {
			latencyTimings.endToEndLatency = ~~(latencyTimings.frameDisplayDeltaTimeMs + latencyTimings.networkLatency, + latencyTimings.CaptureToSendMs);
		}
		this.delegate.onLatencyTestResult(latencyTimings);
	}

	/**
	 * Handles when the Encoder and Web RTC Settings are received from the UE Instance
	 * @param settings - Initial Encoder and Web RTC Settings
	 */
	handleInitialSettings(settings: InitialSettings) {
		this.delegate.onInitialSettings(settings);
	}

	/**
	 * Handles when the Quantization Parameter are received from the UE Instance
	 * @param AvgQP - Encoders Quantization Parameter
	 */
	handleVideoEncoderAvgQP(AvgQP: number) {
		this.delegate.onVideoEncoderAvgQP(AvgQP);
	}

	/**
	 * Flag set if the user has Quality Ownership
	 * @param hasQualityOwnership - Does the current client have Quality Ownership
	 */
	handleQualityControlOwnership(hasQualityOwnership: boolean) {
		this.delegate.onQualityControlOwnership(hasQualityOwnership);
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
}
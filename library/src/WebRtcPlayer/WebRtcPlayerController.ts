import { WebSocketController } from "../WebSockets/WebSocketController";
import { VideoPlayerController } from "../VideoPlayer/VideoPlayerController";
import { MessageInstanceState, MessageAnswer, MessageAuthResponse, MessageConfig } from "../WebSockets/MessageReceive";
import { UiController } from "../Ui/UiController";
import { FreezeFrameController } from "../FreezeFrame/FreezeFrameController";
import { AfkLogic } from "../Afk/AfkLogic";
import { DataChannelController } from "../DataChannel/DataChannelController";
import { PeerConnectionController } from "../PeerConnectionController/PeerConnectionController"
import { MouseController } from "../Inputs/MouseController";
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
	videoPlayerController: VideoPlayerController;
	keyboardController: KeyboardController;
	mouseController: MouseController
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
		this.videoPlayerController = new VideoPlayerController(this.videoPlayer);

		this.uiController = new UiController(this.videoPlayer);
		this.uiController.setUpMouseAndFreezeFrame = this.setUpMouseAndFreezeFrame.bind(this);

		this.dataChannelController = new DataChannelController();
		this.dataChannelController.handleOnOpen = this.handleDataChannelConnected.bind(this);
		this.dataChannelController.onLatencyTestResult = this.handleLatencyTestResult.bind(this);
		this.dataChannelController.onVideoEncoderAvgQP = this.handleVideoEncoderAvgQP.bind(this);
		this.dataChannelController.OnInitialSettings = this.handleInitialSettings.bind(this);
		this.dataChannelController.onQualityControlOwnership = this.handleQualityControlOwnership.bind(this);
		this.dataChannelController.resetAfkWarningTimerOnDataSend = () => this.afkLogic.resetAfkWarningTimer();

		// set up websocket methods
		this.webSocketController = new WebSocketController(this.config.signallingServerAddress);
		this.webSocketController.onConfig = this.handleOnConfigMessage.bind(this);
		this.webSocketController.onInstanceStateChange = this.handleInstanceStateChange.bind(this);
		this.webSocketController.onAuthenticationResponse = this.handleAuthenticationResponse.bind(this);
		this.webSocketController.onWebSocketOncloseOverlayMessage = this.delegate.onDisconnect.bind(this.delegate);

		// set up the final webRtc player controller methods from within our delegate so a connection can be activated
		this.setUpWebRtcConnectionForActivation();

		// now that the delegate has finished instantiating connect the rest of the afk methods to the afk logic class
		this.afkLogic.showAfkOverlay = () => this.delegate.showAfkOverlay(this.afkLogic.countDown);
		this.afkLogic.updateAfkCountdown = () => this.delegate.updateAfkOverlay(this.afkLogic.countDown);
		this.afkLogic.hideCurrentOverlay = () => this.delegate.hideCurrentOverlay();
	}

	/**
	 * connect up the onAfkClick action with a method so it can be exposed to the delegate
	 */
	onAfkClick(): void {
		this.afkLogic.onAfkClick();
	}

	/**
	 * Restart the stream automaticity without refreshing the page
	 */
	restartStreamAutomaticity() {
		// if there is no webSocketController return immediately or this will not work
		if (!this.webSocketController) {
			console.log("The Web Socket Controller does not exist so this will not work right now.")
			return;
		}

		// if a websocket object has not been created connect normally without closing 
		if (!this.webSocketController.webSocket) {
			console.log("A websocket connection has not been made yet please click to start the stream")
		} else {
			// close the connection 
			this.webSocketController.close();

			// wait for the connection to close and restart the connection
			setTimeout(() => { this.setUpWebRtcConnectionForActivation() }, 3000);
		}
	}

	/**
	 * Activate the setIWebRtcPlayerController method within our delegate to set up the final webRtc player controller methods so a webRtc connection can be made 
	 */
	setUpWebRtcConnectionForActivation() {
		this.delegate.setIWebRtcPlayerController(this);
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
			console.log("showing play overlay")
			this.delegate.showPlayOverlay();
			this.resizePlayerStyle();
		} else {
			console.log("showing freeze frame")
			this.freezeFrameController.showFreezeFrame();
		}
		this.videoPlayerController.setVideoEnabled(false);
	}

	/**
	 * Enable the video after hiding a freeze frame
	 */
	InvalidateFreezeFrameAndEnableVideo() {
		this.freezeFrameController.hideFreezeFrame();
		if (this.videoPlayer.videoElement) {
			this.videoPlayerController.setVideoEnabled(true);
		}
	}

	/**
	 * Plays the stream and sets up other pieces while the stream starts also handles if the video cannot play
	 */
	playStream() {
		if (this.videoPlayer && this.videoPlayer.videoElement) {
			// handle play() with .then as it is an asynchronous call  
			this.videoPlayer.videoElement.play().then(() => {
				this.shouldShowPlayOverlay = false;
				this.videoPlayerController.PlayAudioTrack();
				this.ueControlMessage.SendRequestInitialSettings();
				this.ueControlMessage.SendRequestQualityControl();
				this.freezeFrameController.showFreezeFrame();
				this.delegate.hideCurrentOverlay();
				this.inputController.registerTouch(this.config.fakeMouseWithTouches, this.config.playerElement);
				this.afkLogic.startAfkWarningTimer();
			}).catch((onRejectedReason: string) => {
				console.log(onRejectedReason);
				console.log("Browser does not support autoplaying video without interaction - to resolve this we are going to show the play button overlay.")
				this.delegate.showPlayOverlay();
			});
		} else {
			console.error("Could not player video stream because webRtcPlayerObj.video was not valid.")
		}
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

		// set up the peer connection controller
		this.peerConnectionController = new PeerConnectionController(peerConfig, this.urlParams);

		//set up mic controller
		this.micController = new MicController(this.urlParams)

		// set up peer connection controller video stats
		this.peerConnectionController.onVideoStats = this.handleVideoStats.bind(this);

		/* When the Peer Connection Wants to send an offer have it handled */
		this.peerConnectionController.onSendWebRTCOffer = this.handleSendWebRTCOffer.bind(this);

		/* When the Peer connection ice candidate is added have it handled */
		this.peerConnectionController.onPeerIceCandidate = this.handleSendIceCandidate.bind(this);

		// handel mic connections with promise
		this.dataChannelController.createDataChannel(this.peerConnectionController.peerConnection, "cirrus", this.datachannelOptions);

		// set up webRtc text overlays 
		this.peerConnectionController.showTextOverlayConnecting = this.delegate.onWebRtcConnecting.bind(this.delegate);
		this.peerConnectionController.showTextOverlaySetupFailure = this.delegate.onWebRtcFailed.bind(this.delegate);

		/* RTC Peer Connection on Track event -> handle on track */
		this.peerConnectionController.onTrack = this.videoPlayerController.handleOnTrack.bind(this.videoPlayerController);

		/* Start the Hand shake process by creating an Offer */
		this.peerConnectionController.createOffer(this.sdpConstraints, this.micController.useMic);
	}

	/**
	 * Handles when a Config Message is received contains the Peer Connection Options required (STUN and TURN Server Info)
	 * @param messageConfig - Config Message received from the signaling server
	 */
	handleOnConfigMessage(messageConfig: MessageConfig) {

		/* Tell the WebRtcController to start a session with the peer options sent from the signaling server */
		this.startSession(messageConfig.peerConnectionOptions);

		/* When the signaling server sends a WebRTC Answer over the websocket connection have the WebRtcController handle the message */
		this.webSocketController.onWebRtcAnswer = this.handleWebRtcAnswer.bind(this);

		/* When the signaling server sends a IceCandidate over the websocket connection have the WebRtcController handle the message  */
		this.webSocketController.onIceCandidate = this.handleIceCandidate.bind(this);
	}

	/**
	 * Handle the RTC Answer from the signaling server
	 * @param Answer - Answer Message from the Signaling server
	 */
	handleWebRtcAnswer(Answer: MessageAnswer) {
		Logger.verboseLog("There is an answer")

		let sdpAnswer: RTCSessionDescriptionInit = {
			sdp: Answer.sdp,
			type: "answer"
		}

		this.peerConnectionController.handleAnswer(sdpAnswer);
		this.delegate.onWebRtcAnswer();

	}

	/**
	 * When an ice Candidate is received from the Signaling server add it to the Peer Connection Client
	 * @param iceCandidate - Ice Candidate from Server
	 */
	handleIceCandidate(iceCandidate: RTCIceCandidateInit) {
		Logger.verboseLog("Web RTC Controller: onWebRtcIce");

		let candidate = new RTCIceCandidate(iceCandidate);
		this.peerConnectionController.handleOnIce(candidate);
	}

	/**
	 * Send the ice Candidate to the signaling server via websocket
	   * @param iceEvent - RTC Peer ConnectionIceEvent) {
	 */
	handleSendIceCandidate(iceEvent: RTCPeerConnectionIceEvent) {
		Logger.verboseLog("OnIceCandidate");
		if (iceEvent.candidate && iceEvent.candidate.candidate) {
			this.webSocketController.sendIceCandidate(iceEvent.candidate);
		}
	}

	/**
	 * Send the RTC Offer Session to the Signaling server via websocket
	 * @param offer - RTC Session Description
	 */
	handleSendWebRTCOffer(offer: RTCSessionDescriptionInit) {
		Logger.verboseLog("Sending the offer to the Server");
		this.webSocketController.sendWebRtcOffer(offer);
	}

	/**
	 * registers the mouse for use in IWebRtcPlayerController
	 */
	activateRegisterMouse() {
		this.inputController.registerMouse(this.config.controlScheme, this.videoPlayerController);
	}

	/**
	 * Sets up the Data channel Keyboard, Mouse, UE Control Message, UE Descriptor
	 */
	handleDataChannelConnected() {
		Logger.verboseLog("Data Channel is open");

		// show the connected overlay 
		this.delegate.onWebRtcConnected();

		this.inputController = new InputController(this.dataChannelController, this.videoPlayer);

		this.ueControlMessage = new UeControlMessage(this.dataChannelController);
		this.ueDescriptorUi = new UeDescriptorUi(this.dataChannelController);

		this.videoPlayerController.setUpMouseHandlerEvents();

		this.activateRegisterMouse()
		this.inputController.registerKeyBoard(this.config.suppressBrowserKeys);
		this.inputController.registerGamePad();

		this.videoPlayerController.mouseController = this.inputController.mouseController;

		this.resizePlayerStyle();

		Logger.verboseLog("onVideoInitialised");

		this.dataChannelController.processFreezeFrameMessage = (view) => this.freezeFrameController.processFreezeFrameMessage(view, () => this.loadFreezeFrameOrShowPlayOverlay());
		this.dataChannelController.onUnFreezeFrame = () => this.InvalidateFreezeFrameAndEnableVideo();

		setInterval(this.getStats.bind(this), 1000);

		// either autoplay the video or set up the play overlay
		this.autoPlayVideoOrSetUpPlayOverlay();

		this.resizePlayerStyle();

		this.ueDescriptorUi.sendUpdateVideoStreamSize(this.videoPlayer.videoElement.clientWidth, this.videoPlayer.videoElement.clientHeight);

		this.delegate.onVideoInitialised();

		this.uiController.updateVideoStreamSize = this.updateVideoStreamSize.bind(this);
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
			Logger.verboseLog('Resizing too often - skipping');
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
		console.log("----   Encoder Settings    ----\n" + JSON.stringify(encoder, undefined, 4) + "\n-------------------------------");

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
		console.log("----   WebRTC Settings    ----\n" + JSON.stringify(webRTC, undefined, 4) + "\n-------------------------------");

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
		//console.log("----   Sending Aggregated Stats to Signaling Server   ----\n" + JSON.stringify(stats, undefined, 4) + "\n-----------------------------------------------------------");
		this.webSocketController.sendStats(stats);
	}

	/**
	 * Sends a UI Interaction Descriptor to the UE Instance
	 * @param message - String to send to the UE Instance
	 */
	sendUeUiDescriptor(message: string): void {
		//console.log("----   UE UI Interaction String   ----\n" + JSON.stringify(message, undefined, 4) + "\n---------------------------------------");
		this.ueDescriptorUi.sendUiInteraction(message);
	}

	/**
	 * Sends the UI Descriptor `stat fps` to the UE Instance 
	 */
	sendShowFps(): void {
		//console.log("----   Sending show stat to UE   ----");
		this.ueDescriptorUi.sendShowFps();
	}

	/**
	 * Sends a request to the UE Instance to have ownership of Quality
	 */
	sendRequestQualityControlOwnership(): void {
		//console.log("----   Sending Request to Control Quality  ----");
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
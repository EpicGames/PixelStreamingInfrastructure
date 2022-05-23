import { InitialSettings } from "../DataChannel/InitialSettings";
import { LatencyTestResults } from "../DataChannel/LatencyTestResults"
import { Overlay } from "../Overlay/Overlay";
import { IOverlay } from "../Overlay/IOverlay";
import { IFreezeFrameOverlay } from "../Overlay/IFreezeFrameOverlay";
import { FreezeFrameOverlay } from "../Overlay/FreezeFrameOverlay";
import { AfkLogic } from "../Overlay/AfkLogic";
import { AggregatedStats } from "../PeerConnectionController/AggregatedStats";
import { IWebRtcPlayerController } from "../WebRtcPlayer/IWebRtcPlayerController";
import { MessageInstanceState, InstanceState, MessageAuthResponse, MessageAuthResponseOutcomeType } from '../WebSockets/MessageReceive';
import { Config } from "..";
import { IDelegate } from "./IDelegate";
import { AfkOverlay } from "../Overlay/AfkOverlay";

/**
 * Provides common base functionality for delegates that implement the IDelegate interface
*/
export class DelegateBase implements IDelegate {
	public iWebRtcController: IWebRtcPlayerController;
	public config: Config;
	overlay: IOverlay;
	afkOverlay: AfkOverlay;
	//freezeFrameOverlay: IFreezeFrameOverlay = new FreezeFrameOverlay();
	shouldShowPlayOverlay = true;

	/**
	 * @param config - A newly instantiated config object  
	 * returns the base delegate object with the config inside it along with a new instance of the Overlay controller class 
	 */
	constructor(config: Config) {
		this.config = config;

		// create the freeze frame image element 
		//let freezeFrameImageHtml = document.createElement('img');
		//freezeFrameImageHtml.style.position = 'absolute';

		// create the freeze frame div html and append the freeze frame image element  
		//let freezeFrameHtml = document.createElement('div');
		//freezeFrameHtml.id = 'freezeFrameOverlay';
		//freezeFrameHtml.style.display = 'none';
		//freezeFrameHtml.style.pointerEvents = 'none';
		//freezeFrameHtml.style.position = 'absolute';
		//freezeFrameHtml.style.zIndex = '20';
		//freezeFrameHtml.appendChild(freezeFrameImageHtml);

		// connect up functionality for the freeze frames to return a new play overlay 
		//this.freezeFrameOverlay.returnNewPlayOverlay = () => this.onShowPlayOverlay(this.iWebRtcController.playOverlayEvent);

		// make a new freeze frame overlay  
		//this.createNewFreezeFrameOverlay(freezeFrameHtml.id, undefined, freezeFrameHtml, undefined);

		// deactivate the overlay for now until we need to show it
		//this.freezeFrameOverlay.invalidateFreezeFrameOverlay();

		// create the afkLogic class 
		//this.afkLogic = new AfkLogic(this.config.controlScheme, this.config.afkTimeout);

		// set the event to occur if the logic closes the websocket connection
		//this.afkLogic.closeWebSocket = () => this.iWebRtcController.closeSignalingServer();

		// give the webRtcPlayerController the ability to start the afk inactivity watcher
		//this.startAfkWatch = () => this.afkLogic.startAfkWarningTimer();

		// give the webRtcPlayerController the ability to reset the afk inactivity watcher
		//this.resetAfkWatch = () => this.afkLogic.resetAfkWarningTimer();

		this.createNewAfkOverlay();
	}

	/**
	 * Creates an afk overlay and sets the html update contents 
	 */
	createNewAfkOverlay() {
		// create the afk overlay html 
		let afkOverlayHtml = document.createElement('div') as HTMLDivElement;
		afkOverlayHtml.id = 'afkOverlay';

		// set the afk overlay parameters so an new overlay can be instantiated but not applied 
		this.afkOverlay = this.returnNewAfkOverlay(false, "videoPlayOverlay", 'clickableState', afkOverlayHtml, undefined);

		// set the afk overlays update html that uses its own countdown timer number 
		this.afkOverlay.updateOverlayContents = () => {
			this.afkOverlay.currentElement.innerHTML = `<center>No activity detected<br>Disconnecting in ${this.afkOverlay.getCountDown()} seconds<br>Click to continue<br></center>`
		}
	}

	/**
	 * Set the afk click event listener. This should be done after iWebRtcController has been instantiated
	 */
	setAfkOverlayClickEvent() {
		// Build the AFK overlay Event Listener after the fact as it requires afk logic
		this.afkOverlay.overlayClickEvent = () => this.iWebRtcController.onAfkEventListener(this.afkOverlay);
	}

	/**
	 * Returns a new overlay element
	 * @param buildOnCreation build the overlay immediately on instantiation 
	 * @param overlayDivId the id for the base div of the overlay  
	 * @param overlayDivClass the html class you are applying 
	 * @param overlayHtmlElement the created html element you are applying
	 * @param overlayClickEvent the event listener you are applying to your custom element
	 */
	returnNewOverlay(buildOnCreation: boolean, overlayDivId?: string, overlayDivClass?: string, overlayHtmlElement?: HTMLElement, overlayClickEvent?: EventListener) {
		return new Overlay(this.config.playerElement, buildOnCreation, overlayDivId, overlayDivClass, overlayHtmlElement, overlayClickEvent);
	}

	/**
	 * Returns a new afk overlay element
	 * @param buildOnCreation build the overlay immediately on instantiation 
	 * @param overlayDivId the id for the base div of the overlay  
	 * @param overlayDivClass the html class you are applying 
	 * @param overlayHtmlElement the created html element you are applying
	 * @param overlayClickEvent the event listener you are applying to your custom element
	 */
	returnNewAfkOverlay(buildOnCreation: boolean, overlayDivId?: string, overlayDivClass?: string, overlayHtmlElement?: HTMLElement, overlayClickEvent?: EventListener) {
		return new AfkOverlay(this.config.playerElement, buildOnCreation, overlayDivId, overlayDivClass, overlayHtmlElement, overlayClickEvent);
	}

	/**
	 * Returns a new freeze frame overlay element
	 * @param buildOnCreation build the overlay immediately on instantiation 
	 * @param overlayDivId the id for the base div of the overlay  
	 * @param overlayDivClass the html class you are applying 
	 * @param overlayHtmlElement the created html element you are applying
	 * @param overlayClickEvent the event listener you are applying to your custom element
	 */
	returnNewFreezeFrameOverlay(buildOnCreation: boolean, overlayDivId: string, overlayDivClass?: string, overlayHtmlElement?: HTMLElement, overlayClickEvent?: EventListener) {
		//this.freezeFrameOverlay.createNewOverlayElement(this.config.playerElement, overlayDivId, overlayDivClass, overlayHtmlElement, overlayClickEvent)
	}

	/**
	 * Instantiate the WebRTCPlayerController interface to provide WebRTCPlayerController functionality within this class and set up anything that requires it 
	 * @param iWebRtcPlayerController 
	 */
	setIWebRtcPlayerController(iWebRtcPlayerController: IWebRtcPlayerController) {
		this.iWebRtcController = iWebRtcPlayerController;
		this.iWebRtcController.resizePlayerStyle();

		this.setAfkOverlayClickEvent();

		// update the freeze frame object in the webRtc player controller with the new overlay  
		//this.iWebRtcController.freezeFrame.setFreezeFrameOverlay(//this.freezeFrameOverlay);

		this.setWebRtcConnectOverlay();
	}

	setWebRtcConnectOverlay() {
		// set up if the auto play will be used or regular click to start
		if (!this.config.enableSpsAutoplay) {
			// Build the webRtc connect overlay Event Listener and show the connect overlay

			// set up the html 
			let webRtcConnectOverlayHtml = document.createElement('div');
			webRtcConnectOverlayHtml.id = 'playButton';
			webRtcConnectOverlayHtml.innerHTML = 'Click to start';

			// set up the event listener 
			let connectOverlayEvent = () => {
				this.iWebRtcController.connectToSignallingSever();
			}

			// create the webRtc connect overlay
			this.overlay = this.returnNewOverlay(true, 'videoPlayOverlay', 'clickableState', webRtcConnectOverlayHtml, connectOverlayEvent);

		} else {
			this.iWebRtcController.connectToSignallingSever();
		}
	}

	/**
	 * Set up functionality to happen when an instance state change occurs
	 * @param instanceState - the message instance state 
	 */
	onInstanceStateChange(instanceState: MessageInstanceState) {
		let onInstanceStateChangeHtml = document.createElement('div');
		onInstanceStateChangeHtml.id = 'messageOverlay';

		switch (instanceState.state) {
			case InstanceState.UNALLOCATED:
				onInstanceStateChangeHtml.innerHTML = "Instance Unallocated: " + instanceState.details;
				break;
			case InstanceState.FAILED:
				onInstanceStateChangeHtml.innerHTML = "UE Instance Failed: " + instanceState.details;
				break;
			case InstanceState.PENDING:

				// check if there is already and instance pending if so return 
				let preExistingPendingMessage = document.getElementById('messageOverlay') as HTMLDivElement;
				if (preExistingPendingMessage.classList.contains("instance-pending")) {
					return;
				}

				// sometimes the first states from the ss may be empty if so just make it manually this code will change when we update the SS
				if (instanceState.details == undefined || instanceState.details == null) {
					onInstanceStateChangeHtml.innerHTML = "Your application is pending";
				} else {
					onInstanceStateChangeHtml.innerHTML = instanceState.details;
				}

				onInstanceStateChangeHtml.className = "instance-pending";

				var spinnerSpan: HTMLSpanElement = document.createElement('span');
				spinnerSpan.className = "visually-hidden"
				spinnerSpan.innerHTML = "Loading..."

				var spinnerDiv: HTMLDivElement = document.createElement('div');
				spinnerDiv.id = "loading-spinner"
				spinnerDiv.className = "spinner-border ms-2"
				spinnerDiv.setAttribute("role", "status");

				spinnerDiv.appendChild(spinnerSpan);
				onInstanceStateChangeHtml.appendChild(spinnerDiv);

				break;
			case InstanceState.READY:
				onInstanceStateChangeHtml.innerHTML = "Instance is Ready: " + instanceState.details;
				break;
			default:
				onInstanceStateChangeHtml.innerHTML = "Unhandled Instance State" + instanceState.state + " " + instanceState.details;
				break;
		}

		// create the overlay 
		this.overlay = this.returnNewOverlay(true, 'videoPlayOverlay', 'textDisplayState', onInstanceStateChangeHtml, undefined);
	}

	/**
	 * Set up functionality to happen when receiving an auth response 
	 * @param authResponse - the auth response message type
	 */
	onAuthenticationResponse(authResponse: MessageAuthResponse) {
		let onAuthenticationResponseHtml = document.createElement('div');
		onAuthenticationResponseHtml.id = 'messageOverlay';

		switch (authResponse.outcome) {
			case MessageAuthResponseOutcomeType.AUTHENTICATED:
				onAuthenticationResponseHtml.innerHTML = "Authentication has succeeded. Requesting Instance";
				break;
			case MessageAuthResponseOutcomeType.INVALID_TOKEN:
				onAuthenticationResponseHtml.innerHTML = "Invalid Token: " + authResponse.error;
				break;
			case MessageAuthResponseOutcomeType.REDIRECT:
				onAuthenticationResponseHtml.innerHTML = "Redirecting to: " + authResponse.redirect;
				break;
			case MessageAuthResponseOutcomeType.ERROR:
				onAuthenticationResponseHtml.innerHTML = "Error: " + authResponse.error;
				break;
			default:
				onAuthenticationResponseHtml.innerHTML = "Unhandled Auth Response: " + authResponse.outcome;
				break;
		}

		// create the overlay 
		this.overlay = this.returnNewOverlay(true, 'videoPlayOverlay', 'textDisplayState', onAuthenticationResponseHtml, undefined);
	}

	/**
	 * Set up functionality to happen when receiving a webRTC answer 
	 */
	onWebRtcAnswer() {

		// set up the new html element for the overlay 
		let onWebRtcAnswerHtml = document.createElement('div');
		onWebRtcAnswerHtml.id = 'messageOverlay';
		onWebRtcAnswerHtml.innerHTML = "RTC Answer";

		// create the overlay 
		this.overlay = this.returnNewOverlay(true, 'videoPlayOverlay', 'textDisplayState', onWebRtcAnswerHtml, undefined);
	}

	/**
	 * Creates the play overlay for playing the video stream
	 */
	onShowPlayOverlay(overlayClickEvent: EventListener) {

		// set up the html 
		let playOverlayHtml = document.createElement('img');
		playOverlayHtml.id = 'playButton';
		playOverlayHtml.src = Images.playButton;
		playOverlayHtml.alt = 'Start Streaming';

		// create the webRtc connect overlay
		this.overlay = this.returnNewOverlay(true, 'videoPlayOverlay', 'clickableState', playOverlayHtml, overlayClickEvent);

		// set shouldShowPlayOverlay to false in this class and also in the freeze
		this.shouldShowPlayOverlay = false;
		//this.iWebRtcController.freezeFrame.setShouldShowPlayOverlay(this.shouldShowPlayOverlay);
	}

	/**
	 * Event fired when the video is disconnected
	 */
	onDisconnect(event: CloseEvent) {

		// set up the new html element for the overlay 
		let onDisconnectHtml = document.createElement('div');
		onDisconnectHtml.id = 'messageOverlay';
		onDisconnectHtml.innerHTML = `Disconnected: ${event.code} -  ${event.reason}`;

		// create the overlay 
		this.overlay = this.returnNewOverlay(true, 'videoPlayOverlay', 'textDisplayState', onDisconnectHtml, undefined);
	}

	/**
	 * Handles when Web Rtc is connecting 
	 */
	onWebRtcConnecting() {

		// set up the new html element for the overlay 
		let onWebRtcConnectingHtml = document.createElement('div');
		onWebRtcConnectingHtml.id = 'messageOverlay';
		onWebRtcConnectingHtml.innerHTML = 'WebRTC connected, waiting for video';

		// create the overlay 
		this.overlay = this.returnNewOverlay(true, 'videoPlayOverlay', 'textDisplayState', onWebRtcConnectingHtml, undefined);
	}

	/**
	 * Handles when Web Rtc has connected 
	 */
	onWebRtcConnected() {

		// set up the new html element for the overlay 
		let onWebRtcConnectedHtml = document.createElement('div');
		onWebRtcConnectedHtml.id = 'messageOverlay';
		onWebRtcConnectedHtml.innerHTML = "Starting connection to server, please wait";

		// create the overlay 
		this.overlay = this.returnNewOverlay(true, 'videoPlayOverlay', 'textDisplayState', onWebRtcConnectedHtml, undefined);
	}

	/**
	 * Handles when Web Rtc fails to connect 
	 */
	onWebRtcFailed() {

		// set up the new html element for the overlay 
		let onWebRtcFailedHtml = document.createElement('div');
		onWebRtcFailedHtml.id = 'messageOverlay';
		onWebRtcFailedHtml.innerHTML = "Unable to setup video";

		// create the overlay 
		this.overlay = this.returnNewOverlay(true, 'videoPlayOverlay', 'textDisplayState', onWebRtcFailedHtml, undefined);
	}

	/**
	 * Starts the AFK inactivity watcher
	 */
	startAfkWatch() { }

	/**
	 * Resets the AFK inactivity watcher
	 */
	resetAfkWatch() { }

	/**
	 * Set up methods and functions to run when the video is initialised 
	 */
	onVideoInitialised() { }

	/**
	 * Set up functionality to happen when receiving latency test results 
	 * @param latency - latency test results object
	 */
	onLatencyTestResult(latency: LatencyTestResults) { }

	/**
	 * Set up functionality to happen when receiving video statistics 
	 * @param videoStats - video statistics as a aggregate stats object 
	 */
	onVideoStats(videoStats: AggregatedStats) { }

	/**
	 * Set up functionality to happen when calculating the average video encoder qp 
	 * @param QP - the quality number of the stream
	 */
	onVideoEncoderAvgQP(QP: number) { }

	/**
	 * Set up functionality to happen when receiving and handling initial settings for the UE app 
	 * @param settings - initial UE app settings  
	 */
	onInitialSettings(settings: InitialSettings) { }

	/**
	 * Set up functionality to happen when setting quality control ownership of a stream 
	 * @param hasQualityOwnership - does this user have quality ownership of the stream true / false
	 */
	onQualityControlOwnership(hasQualityOwnership: boolean) { }
}
export class Images {
	static playButton: string = "data:image/png;base64,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"
}

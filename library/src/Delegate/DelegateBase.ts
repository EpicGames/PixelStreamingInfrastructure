import { InitialSettings } from "../DataChannel/InitialSettings";
import { LatencyTestResults } from "../DataChannel/LatencyTestResults"
import { Overlay } from "../Overlay/Overlay";
import { IOverlay } from "../Overlay/IOverlay";
import { AggregatedStats } from "../PeerConnectionController/AggregatedStats";
import { IWebRtcPlayerController } from "../WebRtcPlayer/IWebRtcPlayerController";
import { MessageInstanceState, MessageAuthResponse } from "../WebSockets/MessageReceive";
import { Config, FreezeFrameLogic, AfkLogic, IAfkLogic } from "..";
import { IDelegate } from "./IDelegate";

/**
 * Provides common base functionality for delegates that implement the IDelegate interface
*/
export class DelegateBase implements IDelegate {
	public iWebRtcController: IWebRtcPlayerController;
	public config: Config;
	overlay: IOverlay;
	afkLogic: IAfkLogic;
	freezeFrameLogic: FreezeFrameLogic;

	/**
	 * @param config - A newly instantiated config object  
	 * returns the base delegate object with the config inside it along with a new instance of the Overlay controller class 
	 */
	constructor(config: Config) {
		this.config = config;

		// create the afkLogic class 
		this.afkLogic = new AfkLogic(this.config.controlScheme, this.config.afkTimeout);

		// set the event to occur if the logic closes the websocket connection
		this.afkLogic.closeWebSocket = () => this.iWebRtcController.closeSignalingServer();

		// give the webRtcPlayerController the ability to start the afk inactivity watcher
		this.startAfkWatch = () => this.afkLogic.startAfkWarningTimer();

		// give the webRtcPlayerController the ability to reset the afk inactivity watcher
		this.resetAfkWatch = () => this.afkLogic.resetAfkWarningTimer();

		// create the afk overlay html 
		let afkOverlayHtml = document.createElement('div') as HTMLDivElement;
		afkOverlayHtml.id = 'afkOverlay';

		// Build the AFK overlay Event Listener
		let afkOverlayEvent = () => {
			// The user clicked so start the timer again and carry on.
			this.afkLogic.afkOverlay.hideOverlay();
			clearInterval(this.afkLogic.countdownTimer);
			this.afkLogic.startAfkWarningTimer();
		}

		// set the afk overlay parameters so an new overlay can be instantiated inside the class when required 
		this.afkLogic.afkOverlay.setOverlayParameters(this.returnNewOverlay('clickableState', afkOverlayHtml, afkOverlayEvent));

		// set the afk overlays update html that uses its own countdown timer number 
		this.afkLogic.afkOverlay.setAfkOverlayUpdateHtml('<center>No activity detected<br>Disconnecting in ' + this.afkLogic.afkOverlay.countdown + ' seconds<br>Click to continue<br></center>');
	}

	/**
	 * Returns a new overlay object and shows it in the playerDiv element 
	 * @param htmlClass the html class you are applying 
	 * @param htmlElement the created html element you are applying
	 * @param onClickEvent the event listener you are applying to your custom element
	 * @returns Overlay object 
	 */
	returnNewOverlay(htmlClass?: string, htmlElement?: HTMLElement, onClickEvent?: EventListener) {
		return new Overlay(this.config.playerElement, htmlClass, htmlElement, onClickEvent)
	}

	/**
	 * acts as an override for instantiating the WebRTCPlayerController interface to provide WebRTCPlayerController functionality  
	 * @param iWebRtcPlayerController 
	 */
	setIWebRtcPlayerController(iWebRtcPlayerController: IWebRtcPlayerController) {
		this.iWebRtcController = iWebRtcPlayerController;

		// set up the html 
		let connectOverlayHtml = document.createElement('div');
		connectOverlayHtml.id = 'playButton';
		connectOverlayHtml.innerHTML = 'Click to start';

		// set up the event listener 
		let connectOverlayEvent = () => {
			iWebRtcPlayerController.connectToSignallingSever();
		}

		// create the overlay
		this.overlay = this.returnNewOverlay('clickableState', connectOverlayHtml, connectOverlayEvent);
	}

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

	/**
	 * Set up functionality to happen when an instance state change occurs
	 * @param instanceState - the message instance state 
	 */
	onInstanceStateChange(instanceState: MessageInstanceState) { }

	/**
	 * Set up functionality to happen when receiving an auth response 
	 * @param authResponse - the auth response message type
	 */
	onAuthenticationResponse(authResponse: MessageAuthResponse) { }

	/**
	 * Set up functionality to happen when receiving a webRTC answer 
	 */
	onWebRtcAnswer() { }

	/**
	 * Starts the AFK inactivity watcher
	 */
	startAfkWatch() { }

	/**
	 * Resets the AFK inactivity watcher
	 */
	resetAfkWatch() { }

	/**
	 * Event fired when the video is disconnected
	 */
	onDisconnect(event: CloseEvent) {

		// set up the new html element for the overlay 
		let onDisconnectHtml = document.createElement('div');
		onDisconnectHtml.id = 'messageOverlay';
		onDisconnectHtml.innerHTML = `Disconnected: ${event.code} -  ${event.reason}`;

		// create the overlay 
		this.overlay = this.returnNewOverlay('textDisplayState', onDisconnectHtml, undefined);
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
		this.overlay = this.returnNewOverlay('textDisplayState', onWebRtcConnectingHtml, undefined);
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
		this.overlay = this.returnNewOverlay('textDisplayState', onWebRtcConnectedHtml, undefined);
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
		this.overlay = this.returnNewOverlay('textDisplayState', onWebRtcFailedHtml, undefined);
	}
}

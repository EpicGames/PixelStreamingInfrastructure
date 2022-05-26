import { Config } from "..";
import { IDelegate } from "./IDelegate";
import { InitialSettings } from "../DataChannel/InitialSettings";
import { LatencyTestResults } from "../DataChannel/LatencyTestResults"
import { ActionOverlay } from "../Overlay/ActionOverlay";
import { AfkOverlay } from "../Overlay/AfkOverlay";
import { IOverlay } from "../Overlay/IOverlay";
import { ITextOverlay } from "../Overlay/ITextOverlay";
import { AggregatedStats } from "../PeerConnectionController/AggregatedStats";
import { IWebRtcPlayerController } from "../WebRtcPlayer/IWebRtcPlayerController";
import { MessageInstanceState, InstanceState, MessageAuthResponse, MessageAuthResponseOutcomeType } from '../WebSockets/MessageReceive';

/**
 * Provides common base functionality for delegates that implement the IDelegate interface
*/
export class DelegateBase implements IDelegate {
	public iWebRtcController: IWebRtcPlayerController;
	public config: Config;
	currentOverlay: IOverlay;
	connectOverlay: ActionOverlay;
	playOverlay: ActionOverlay;
	afkOverlay: AfkOverlay;
	infoOverlay: ITextOverlay;
	errorOverlay: ITextOverlay;
	shouldShowPlayOverlay = true;

	/**
	 * @param config - A newly instantiated config object  
	 * returns the base delegate object with the config inside it along with a new instance of the Overlay controller class 
	 */
	constructor(config: Config) {
		this.config = config;
	}

	hideCurrentOverlay() { };

	showConnectOverlay() { 
		this.connectOverlay.show();
	};

	showPlayOverlay() { 
		this.playOverlay.show();
	};

	showTextOverlay(text: string) { };

	showErrorOverlay(text: string) { };

	onConnectAction() { };

	onPlayAction() { };



	showAfkOverlay(countDown: number) { };

	updateAfkOverlay(countDown: number) { };

	onAfkAction() { };

	/**
	 * Creates an afk overlay and sets the html update contents 
	 */
	// createNewAfkOverlay() {
	// 	// create the afk overlay html 
	// 	let afkOverlayHtml = document.createElement('div') as HTMLDivElement;
	// 	afkOverlayHtml.id = 'afkOverlay';

	// 	// set the afk overlay parameters so an new overlay can be instantiated but not applied 
	// 	this.afkOverlay = this.returnNewAfkOverlay(false, "videoPlayOverlay", 'clickableState', afkOverlayHtml, undefined);

	// 	// set the afk overlays update html that uses its own countdown timer number 
	// 	this.afkOverlay.updateOverlayContents = () => {
	// 		this.afkOverlay.currentElement.innerHTML = `<center>No activity detected<br>Disconnecting in ${this.afkOverlay.getCountDown()} seconds<br>Click to continue<br></center>`
	// 	}
	// }

	/**
	 * Set the afk click event listener. This should be done after iWebRtcController has been instantiated
	 */
	// setAfkOverlayClickEvent() {
	// 	// Build the AFK overlay Event Listener after the fact as it requires afk logic
	// 	this.afkOverlay.overlayClickEvent = () => this.iWebRtcController.onAfkEventListener(this.afkOverlay);
	// }



	/**
	 * Instantiate the WebRTCPlayerController interface to provide WebRTCPlayerController functionality within this class and set up anything that requires it 
	 * @param iWebRtcPlayerController 
	 */
	setIWebRtcPlayerController(iWebRtcPlayerController: IWebRtcPlayerController) {
		this.iWebRtcController = iWebRtcPlayerController;
		this.iWebRtcController.resizePlayerStyle();

		//this.setAfkOverlayClickEvent();

		// update the freeze frame object in the webRtc player controller with the new overlay  
		//this.iWebRtcController.freezeFrame.setFreezeFrameOverlay(//this.freezeFrameOverlay);

		this.setWebRtcConnectOverlay();
	}

	/**
	 * Create the webRtc connect overlay based on the autoplay option. This should be done after iWebRtcController has been instantiated
	 */
	setWebRtcConnectOverlay() {
		// set up if the auto play will be used or regular click to start
		if (!this.config.enableSpsAutoplay) {
			// Build the webRtc connect overlay Event Listener and show the connect overlay

			// set up the html 
			// let webRtcConnectOverlayHtml = document.createElement('div');
			// webRtcConnectOverlayHtml.id = 'playButton';
			// webRtcConnectOverlayHtml.innerHTML = 'Click to start';

			// set up the event listener 
			let connectOverlayEvent = () => {
				//EventEmitter.emit("connectToSignallingSever", undefined);
			}

			// create the webRtc connect overlay
			//this.overlay = this.returnNewOverlay(true, 'videoPlayOverlay', 'clickableState', webRtcConnectOverlayHtml, connectOverlayEvent);

		} else {
			//EventEmitter.emit("connectToSignallingSever", undefined);
		}
	}

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
	onWebRtcAnswer() {

		// set up the new html element for the overlay 
		// let onWebRtcAnswerHtml = document.createElement('div');
		// onWebRtcAnswerHtml.id = 'messageOverlay';
		// onWebRtcAnswerHtml.innerHTML = "RTC Answer";

		// create the overlay 
		//this.overlay = this.returnNewOverlay(true, 'videoPlayOverlay', 'textDisplayState', onWebRtcAnswerHtml, undefined);
	}

	/**
	 * Creates the play overlay for playing the video stream
	 */
	onShowPlayOverlay() {

		// set up the html 
		// let playOverlayHtml = document.createElement('img');
		// playOverlayHtml.id = 'playButton';
		// playOverlayHtml.src = Images.playButton;
		// playOverlayHtml.alt = 'Start Streaming';

		let overlayClickEvent = () => {
			//EventEmitter.emit("playStream", undefined);
		}

		// create the webRtc connect overlay
		//this.overlay = this.returnNewOverlay(true, 'videoPlayOverlay', 'clickableState', playOverlayHtml, overlayClickEvent);

		// set shouldShowPlayOverlay to false in this class and also in the freeze
		this.shouldShowPlayOverlay = false;
		//this.iWebRtcController.freezeFrame.setShouldShowPlayOverlay(this.shouldShowPlayOverlay);
	}

	/**
	 * Event fired when the video is disconnected
	 */
	onDisconnect(event: CloseEvent) {

		// set up the new html element for the overlay 
		// let onDisconnectHtml = document.createElement('div');
		// onDisconnectHtml.id = 'messageOverlay';
		// onDisconnectHtml.innerHTML = `Disconnected: ${event.code} -  ${event.reason}`;

		// create the overlay 
		//this.overlay = this.returnNewOverlay(true, 'videoPlayOverlay', 'textDisplayState', onDisconnectHtml, undefined);
	}

	/**
	 * Handles when Web Rtc is connecting 
	 */
	onWebRtcConnecting() {
		// set up the new html element for the overlay 
		// let onWebRtcConnectedHtml = document.createElement('div');
		// onWebRtcConnectedHtml.id = 'messageOverlay';
		// onWebRtcConnectedHtml.innerHTML = "Starting connection to server, please wait";

		// create the overlay 
		//this.overlay = this.returnNewOverlay(true, 'videoPlayOverlay', 'textDisplayState', onWebRtcConnectedHtml, undefined);
	}

	/**
	 * Handles when Web Rtc has connected 
	 */
	onWebRtcConnected() {
		// set up the new html element for the overlay 
		// let onWebRtcConnectingHtml = document.createElement('div');
		// onWebRtcConnectingHtml.id = 'messageOverlay';
		// onWebRtcConnectingHtml.innerHTML = 'WebRTC connected, waiting for video';

		// create the overlay 
		//this.overlay = this.returnNewOverlay(true, 'videoPlayOverlay', 'textDisplayState', onWebRtcConnectingHtml, undefined);
	}

	/**
	 * Handles when Web Rtc fails to connect 
	 */
	onWebRtcFailed() {

		// set up the new html element for the overlay 
		// let onWebRtcFailedHtml = document.createElement('div');
		// onWebRtcFailedHtml.id = 'messageOverlay';
		// onWebRtcFailedHtml.innerHTML = "Unable to setup video";

		// create the overlay 
		//this.overlay = this.returnNewOverlay(true, 'videoPlayOverlay', 'textDisplayState', onWebRtcFailedHtml, undefined);
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
}

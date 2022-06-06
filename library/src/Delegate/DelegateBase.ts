import { Config } from "..";
import { IDelegate } from "./IDelegate";
import { InitialSettings } from "../DataChannel/InitialSettings";
import { LatencyTestResults } from "../DataChannel/LatencyTestResults"
import { IActionOverlay } from "../Overlay/IActionOverlay";
import { IAfkOverlay } from "../Overlay/IAfkOverlay";
import { IOverlay } from "../Overlay/IOverlay";
import { ITextOverlay } from "../Overlay/ITextOverlay";
import { AggregatedStats } from "../PeerConnectionController/AggregatedStats";
import { IWebRtcPlayerController } from "../WebRtcPlayer/IWebRtcPlayerController";
import { MessageInstanceState, MessageAuthResponse } from '../WebSockets/MessageReceive';

/**
 * Provides common base functionality for delegates that implement the IDelegate interface
*/
export class DelegateBase implements IDelegate {
	public iWebRtcController: IWebRtcPlayerController;
	public config: Config;

	// set the overlay placeholders 
	currentOverlay: IOverlay;
	connectOverlay: IActionOverlay;
	playOverlay: IActionOverlay;
	afkOverlay: IAfkOverlay;
	infoOverlay: ITextOverlay;
	errorOverlay: ITextOverlay;

	/**
	 * @param config - A newly instantiated config object  
	 * returns the base delegate object with the config inside it along with a new instance of the Overlay controller class 
	 */
	constructor(config: Config) {
		this.config = config;
	}

	/**
	 * Hides the current overlay 
	 */
	hideCurrentOverlay() {
		if (this.currentOverlay != null) {
			this.currentOverlay.hide();
			this.currentOverlay = null;
		}
	}

	/**
	 * Shows the connect overlay 
	 */
	showConnectOverlay() {
		this.hideCurrentOverlay();
		this.connectOverlay.show();
		this.currentOverlay = this.connectOverlay;
	}

	/**
	 * Shows the play overlay 
	 */
	showPlayOverlay() {
		this.hideCurrentOverlay();
		this.playOverlay.show();
		this.currentOverlay = this.playOverlay;
	}

	/**
	 * Shows the text overlay 
	 */
	showTextOverlay(text: string) {
		this.hideCurrentOverlay();
		this.infoOverlay.update(text);
		this.infoOverlay.show();
		this.currentOverlay = this.infoOverlay;
	}

	/**
	 * Shows the error overlay 
	 */
	showErrorOverlay(text: string) {
		this.hideCurrentOverlay();
		this.errorOverlay.update(text);
		this.errorOverlay.show();
		this.currentOverlay = this.errorOverlay;
	}

	/**
	 * Activates the connect overlays action 
	 */
	onConnectAction() {
		this.connectOverlay.activate();
	}

	/**
	 * Activates the play overlays action 
	 */
	onPlayAction() {
		this.playOverlay.activate();
	}

	/**
	 * Shows the afk overlay 
	 * @param countDown the countdown number for the afk countdown 
	 */
	showAfkOverlay(countDown: number) {
		this.hideCurrentOverlay();
		this.updateAfkOverlay(countDown);
		this.afkOverlay.show();
		this.currentOverlay = this.afkOverlay;
	}

	/**
	 * Update the afk overlays countdown number 
	 * @param countDown the new countdown number 
	 */
	updateAfkOverlay(countDown: number) {
		this.afkOverlay.update(countDown);
	}

	/**
	 * Activates the afk overlays action 
	 */
	onAfkAction() {
		this.afkOverlay.activate();
	}

	/**
	 * Instantiate the WebRTCPlayerController interface to provide WebRTCPlayerController functionality within this class and set up anything that requires it 
	 * @param iWebRtcPlayerController 
	 */
	setIWebRtcPlayerController(iWebRtcPlayerController: IWebRtcPlayerController) {
		this.iWebRtcController = iWebRtcPlayerController;

		this.iWebRtcController.resizePlayerStyle();

		// set up the connect overlays action
		this.setWebRtcConnectOverlay();

		// set up the afk overlays action 
		this.afkOverlay.onAction(() => this.iWebRtcController.onAfkClick());

		// set up the play overlays action 
		this.playOverlay.onAction(() => this.iWebRtcController.playStream());
	}

	/**
	 * Create the webRtc connect overlay based on the autoplay option. This should be done after iWebRtcController has been instantiated
	 */
	setWebRtcConnectOverlay() {
		// set up if the auto play will be used or regular click to start
		if (!this.config.enableSpsAutoplay) {
			// Build the webRtc connect overlay Event Listener and show the connect overlay
			this.connectOverlay.onAction(() => this.iWebRtcController.connectToSignallingSever());
			this.showConnectOverlay();
		} else {
			// if autoplaying show an info overlay while while waiting for the connection to begin 
			this.showTextOverlay("Auto Connecting Now");
			this.iWebRtcController.connectToSignallingSever();
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
		this.showTextOverlay("RTC Answer");
	}

	/**
	 * Event fired when the video is disconnected
	 */
	onDisconnect(event: CloseEvent) {
		this.showErrorOverlay(`Disconnected: ${event.code} -  ${event.reason}`);
	}

	/**
	 * Handles when Web Rtc is connecting 
	 */
	onWebRtcConnecting() {
		this.showTextOverlay("Starting connection to server, please wait");
	}

	/**
	 * Handles when Web Rtc has connected 
	 */
	onWebRtcConnected() {
		this.showTextOverlay("WebRTC connected, waiting for video");
	}

	/**
	 * Handles when Web Rtc fails to connect 
	 */
	onWebRtcFailed() {
		this.showErrorOverlay("Unable to setup video");
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

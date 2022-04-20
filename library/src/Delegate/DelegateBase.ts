import { InitialSettings } from "../DataChannel/InitialSettings";
import { LatencyTestResults } from "../DataChannel/LatencyTestResults"
import { OverlayController } from "../Overlay/OverlayController";
import { AggregatedStats } from "../PeerConnectionController/AggregatedStats";
import { IWebRtcPlayerController } from "../WebRtcPlayer/IWebRtcPlayerController";
import { MessageInstanceState, MessageAuthResponse } from "../WebSockets/MessageReceive";
import { Config } from "..";
import { IDelegate } from "./IDelegate";

/**
 * Provides common base functionality for delegates that implement the IDelegate interface
*/
export class DelegateBase implements IDelegate {
	public overlayController: OverlayController;
	public iWebRTCController: IWebRtcPlayerController;
	public config: Config;

	/**
	  * @param config - A newly instantiated config object  
	* returns the base delegate object with the config inside it along with a new instance of the Overlay controller class 
	*/
	constructor(config: Config) {
		this.config = config;
		this.overlayController = new OverlayController(config.playerElement);
	}

	/**
	 * acts as an override for instantiating the WebRTCPlayerController interface to provide WebRTCPlayerController functionality  
	 * @param iWebRtcPlayerController 
	 */
	setIWebRtcPlayerController(iWebRtcPlayerController: IWebRtcPlayerController) {
		this.iWebRTCController = iWebRtcPlayerController;
		let connectOverlayEvent = () => {
			iWebRtcPlayerController.connectToSignallingSever();
		}
		this.overlayController.showConnectOverlay(connectOverlayEvent);
	}

	/**
	 * Set up the WebRtcPlayerController to run automaticity on startup for headless testing and ease of use
	 * @param iWebRtcPlayerController - a webrtc controller type  
	 */
	setIWebRtcPlayerControllerAutoplay(iWebRtcPlayerController: IWebRtcPlayerController) { }

	/**
	 * Set up methods and functions to run when the video is initialised 
	 */
	onVideoInitialised() { }

	/**
 * Event fired when the video is disconnected
 */
	onDisconnect() { }

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
}

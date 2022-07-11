import { InitialSettings } from "../DataChannel/InitialSettings";
import { LatencyTestResults } from "../DataChannel/LatencyTestResults"
import { IActionOverlay } from "../Overlay/IActionOverlay";
import { IAfkOverlay } from "../Overlay/IAfkOverlay";
import { IOverlay } from "../Overlay/IOverlay";
import { ITextOverlay } from "../Overlay/ITextOverlay";
import { AggregatedStats } from "../PeerConnectionController/AggregatedStats";
import { IWebRtcPlayerController } from "../WebRtcPlayer/IWebRtcPlayerController";
import { MessageInstanceState, MessageAuthResponse } from "../WebSockets/MessageReceive";

/**
 * Delegate is an interface connecting methods from within the libspsfrontend to the user's functions for methods in their frontend implementation
*/
export interface IDelegate {

	// placeholders for overlays 
	currentOverlay: IOverlay;
	connectOverlay: IActionOverlay;
	playOverlay: IActionOverlay;
	disconnectOverlay: IActionOverlay;
	afkOverlay: IAfkOverlay;
	infoOverlay: ITextOverlay;
	errorOverlay: ITextOverlay;

	showDisconnectOverlay(updateText: string): void;

	updateDisconnectOverlay(updateText: string): void;

	onDisconnectionAction(): void;

	/**
	 * Hides the current overlay 
	 */
	hideCurrentOverlay(): void;

	/**
	 * Shows a text overlay to alert the user the stream is currently loading
	 */
	onStreamLoading(): void;

	/**
	 * Show the webRtcAutoConnect Overlay and connect
	 */
	onWebRtcAutoConnect(): void;

	/**
	 * Shows the play overlay 
	 */
	showPlayOverlay(): void;

	/**
	 * Shows the connect overlay 
	 */
	showConnectOverlay(): void;

	/**
	 * Shows the afk overlay 
	 * @param countDown the countdown number for the afk overlay  
	 */
	showAfkOverlay(countDown: number): void;

	/**
	 * Updates the afk overlay countdown number 
	 * @param countDown the new countdown number 
	 */
	updateAfkOverlay(countDown: number): void;

	/**
	 * Shows the text overlay 
	 * @param text a string of text to be inserted into the text overlay 
	 */
	showTextOverlay(text: string): void;

	/**
	 * Shows the error overlay 
	 * @param text a string of text to be inserted into the error overlay 
	 */
	showErrorOverlay(text: string): void;

	/**
	 * Activates the connect overlays action 
	 */
	onConnectAction(): void;

	/**
	 * Activates the play overlays action 
	 */
	onPlayAction(): void;

	/**
	 * Activates the afk overlays action 
	 */
	onAfkAction(): void;

	/**
	 * Show the Connect Overlay or autoplay 
	 */
	showConnectOrAutoConnectOverlays(): void;

	/**
	 * Acts as an override for instantiating the WebRTCPlayerController interface to provide WebRTCPlayerController functionality  
	 * @param iWebRtcPlayerController 
	 */
	setIWebRtcPlayerController(iWebRtcPlayerController: IWebRtcPlayerController): void;

	/**
	 * Set up methods and functions to run when the video is initialised 
	 */
	onVideoInitialised(): void;

	/**
	 * Set up functionality to happen when receiving latency test results 
	 * @param latency - latency test results object
	 */
	onLatencyTestResult(latency: LatencyTestResults): void;

	/**
	 * Set up functionality to happen when receiving video statistics 
	 * @param videoStats - video statistics as a aggregate stats object 
	 */
	onVideoStats(videoStats: AggregatedStats): void;

	/**
	 * Set up functionality to happen when calculating the average video encoder qp 
	 * @param QP - the quality number of the stream
	 */
	onVideoEncoderAvgQP(QP: number): void;

	/**
	 * Set up functionality to happen when receiving and handling initial settings for the UE app 
	 * @param settings - initial UE app settings  
	 */
	onInitialSettings(settings: InitialSettings): void;

	/**
	 * Set up functionality to happen when setting quality control ownership of a stream 
	 * @param hasQualityOwnership - does this user have quality ownership of the stream true / false
	 */
	onQualityControlOwnership(hasQualityOwnership: boolean): void;

	/**
	 * Set up functionality to happen when an instance state change occurs
	 * @param instanceState - the message instance state
	 */
	onInstanceStateChange(instanceState: MessageInstanceState): void;

	/**
	 * Set up functionality to happen when receiving an auth response
	 * @param authResponse - the auth response message type
	 */
	onAuthenticationResponse(authResponse: MessageAuthResponse): void;

	/**
	 * Set up functionality to happen when receiving a webRTC answer
	 */
	onWebRtcAnswer(): void;

	/**
	 * Event fired when the video is disconnected
	 */
	onDisconnect(eventString: string): void;

	/**
	 * Handles when Web Rtc is connecting 
	 */
	onWebRtcConnecting(): void;

	/**
	 * Handles when Web Rtc has connected 
	 */
	onWebRtcConnected(): void;

	/**
	 * Handles when Web Rtc fails to connect 
	 */
	onWebRtcFailed(): void;
}

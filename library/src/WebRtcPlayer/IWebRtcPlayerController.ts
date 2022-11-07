import { Encoder, WebRTC } from "../DataChannel/InitialSettings";
import { UnquantisedAndDenormaliseUnsigned } from "../NormalizeAndQuantize/NormalizeAndQuantize";
import { AggregatedStats } from "../PeerConnectionController/AggregatedStats";

/**
 * Interface for the Web RTC Player Controller
 */
export interface IWebRtcPlayerController {
    matchViewportResolution: boolean;

    /**
     * Make a request to UnquantisedAndDenormaliseUnsigned coordinates 
     * @param x x axis coordinate 
     * @param y y axis coordinate
     */
    requestUnquantisedAndDenormaliseUnsigned(x: number, y: number): UnquantisedAndDenormaliseUnsigned;

    /**
     * Activate the events for when an afk overlay is clicked 
     */
    onAfkClick(): void;

    /**
     * Activate the streams video source 
     */
    playStream(): void;

    /**
     * Connect to the Signaling server
     */
    connectToSignallingSever(): void;

    /**
     * Close the Connection to the signaling server
     */
    closeSignalingServer(): void;

    /**
     * Restart the stream automaticity without refreshing the page
     */
    restartStreamAutomaticity(): void;

    /**
     * Send an Iframe request to the streamer
     */
    requestKeyFrame(): void;

    /**
     * Send the Encoder Settings to the UE Instance as a UE UI Descriptor.
     * @param encoder - Encoder Settings
     */
    sendEncoderSettings(encoder: Encoder): void;

    /**
   * Send the WebRTC Settings to the UE Instance as a UE UI Descriptor.
   * @param webRTC - Web RTC Settings 
   */
    sendWebRtcSettings(webRTC: WebRTC): void;

    /**
     * Sends the UI Descriptor `stat fps` to the UE Instance 
     */
    sendShowFps(): void;

    /**
     * Sends a request to the UE Instance to have ownership of Quality
     */
    sendRequestQualityControlOwnership(): void;

    /**
     * Send a Latency Test Request to the UE Instance
     */
    sendLatencyTest(): void;

    /**
     * Send Aggregated Stats to the Signaling Server
     * @param stats - Aggregated Stats
     */
    sendStatsToSignallingServer(stats: AggregatedStats): void;

    /**
    * To Resize the Video Player element
    */
    resizePlayerStyle(): void;

    /**
     * Registers the mouse
     */
    activateRegisterMouse(): void;

    /**
     * Sets if we are enlarging the display to fill the window for freeze frames and ui 
     * @param isFilling is the display filling or not
     */
    setEnlargeToFillDisplay(isFilling: boolean): void;

    /**
     * Handles when the stream size changes
     */
    updateVideoStreamSize(): void;

    /**
     * Get the overridden disconnect message
     */
    getDisconnectMessageOverride(): string;

    /**
     * Set the override for the disconnect message
     */
    setDisconnectMessageOverride(message: string): void;
}
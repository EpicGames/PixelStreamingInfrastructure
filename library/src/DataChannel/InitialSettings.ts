import { IEncoder, IInitialSettings, IPixelStreaming, IWebRTC } from "../DataChannel/IInitialSettings"

/**
 * Latency Test Results Data
 */
export class InitialSettings implements IInitialSettings {

    PixelStreaming?: IPixelStreaming;
    Encoder?: IEncoder;
    WebRTC?: IWebRTC;


    constructor() {
        this.PixelStreaming = new PixelStreaming()
        this.Encoder = new Encoder()
        this.WebRTC = new WebRTC()
    }

    /**
     * Checks for compatibility with the FPS and MaxFPS stats between 4.27 and 5
     */
    ueCompatible() {
        if (this.WebRTC.MaxFPS != null) {
            this.WebRTC.FPS = this.WebRTC.MaxFPS
        }
    }

}

/**
 * A class for handling pixel streaming details 
 */
export class PixelStreaming implements IPixelStreaming {
    AllowPixelStreamingCommands?: boolean;
    DisableLatencyTest?: boolean;
}

/**
 * A class for handling enoder stats 
 */
export class Encoder implements IEncoder {
    TargetBitrate?: number;
    MaxBitrate?: number;
    MinQP?: number;
    MaxQP?: number;
    RateControl?: "CBR" | "VBR" | "ConstQP";
    FillerData?: boolean;
    MultiPass?: "DISABLED" | "QUARTER" | "FULL";


}

/**
 * A class for handling web rtc stats 
 */
export class WebRTC implements IWebRTC {
    DegradationPref?: "BALANCED" | "MAINTAIN_FRAMERATE" | "MAINTAIN_RESOLUTION";
    MinBitrate?: number;
    MaxBitrate?: number;
    LowQP?: number;
    HighQP?: number;
    // UE4.27 compatible
    MaxFPS?: number;
    // UE5 compatible
    FPS?: number;


}

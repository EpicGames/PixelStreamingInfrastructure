import { IEncoder, IInitialSettings, IPixelStreaming, IWebRTC } from "../DataChannel/IInitialSettings"

/**
 * Latency Test Results Data
 */
export class InitialSettings implements IInitialSettings {

    PixelStreaming?: IPixelStreaming;
    Encoder?: IEncoder;
    WebRTC?: IWebRTC;


    constructor(){
        this.PixelStreaming = new PixelStreaming()
        this.Encoder = new Encoder()
        this.WebRTC = new WebRTC()
    }

    ueCompatible() {
        if (this.WebRTC.MaxFPS != null) {
            this.WebRTC.FPS = this.WebRTC.MaxFPS
        }
    }

}



export class PixelStreaming implements IPixelStreaming {
    AllowPixelStreamingCommands?: boolean;
    DisableLatencyTest?: boolean;
}

export class Encoder implements IEncoder {
    TargetBitrate?: number;
    MaxBitrate?: number;
    MinQP?: number;
    MaxQP?: number;
    RateControl?: "CBR" | "VBR" | "ConstQP";
    FillerData?: boolean;
    MultiPass?: "DISABLED" | "QUARTER" | "FULL";


}

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

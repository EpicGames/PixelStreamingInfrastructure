/**
 * Initial Settings Data
 */
export interface IInitialSettings {
    PixelStreaming?: IPixelStreaming;
    Encoder?: IEncoder;
    WebRTC?: IWebRTC;
}

/**
 * 
 * Pixel Streaming Settings
 * UE 5.0 Supported
 */
 export interface IPixelStreaming {
    AllowPixelStreamingCommands?: boolean;
    DisableLatencyTest?: boolean;
}

/**
 * Encoder Settings
 */
export interface IEncoder {
    TargetBitrate?: number;
    MaxBitrate?: number;
    MinQP?: number;
    MaxQP?: number;
    RateControl?: "CBR" | "VBR" | "ConstQP";
    FillerData?: boolean;
    MultiPass?: "DISABLED" | "QUARTER" | "FULL";
}

/**
 * Web RTC Settings
 */
export interface IWebRTC {
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




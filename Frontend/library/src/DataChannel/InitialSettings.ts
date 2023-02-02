// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * Latency Test Results Data
 */
export class InitialSettings {
    PixelStreamingSettings: PixelStreamingSettings;
    EncoderSettings: EncoderSettings;
    WebRTCSettings: WebRTCSettings;

    constructor() {
        this.PixelStreamingSettings = new PixelStreamingSettings();
        this.EncoderSettings = new EncoderSettings();
        this.WebRTCSettings = new WebRTCSettings();
    }

    /**
     * Checks for compatibility with the FPS and MaxFPS stats between 4.27 and 5
     */
    ueCompatible() {
        if (this.WebRTCSettings.MaxFPS != null) {
            this.WebRTCSettings.FPS = this.WebRTCSettings.MaxFPS;
        }
    }
}

/**
 * A class for handling Pixel Streaming details
 */
export class PixelStreamingSettings {
    AllowPixelStreamingCommands?: boolean;
    DisableLatencyTest?: boolean;
}

/**
 * A class for handling encoder stats
 */
export class EncoderSettings {
    TargetBitrate?: number;
    MaxBitrate?: number;
    MinQP?: number;
    MaxQP?: number;
    RateControl?: 'CBR' | 'VBR' | 'ConstQP';
    FillerData?: boolean;
    MultiPass?: 'DISABLED' | 'QUARTER' | 'FULL';
}

/**
 * A class for handling web rtc stats
 */
export class WebRTCSettings {
    DegradationPref?: 'BALANCED' | 'MAINTAIN_FRAMERATE' | 'MAINTAIN_RESOLUTION';
    MinBitrate?: number;
    MaxBitrate?: number;
    LowQP?: number;
    HighQP?: number;
    // UE4.27 compatible
    MaxFPS?: number;
    // UE5 compatible
    FPS?: number;
}

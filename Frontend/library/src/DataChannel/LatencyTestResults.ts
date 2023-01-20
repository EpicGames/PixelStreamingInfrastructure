// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '../Logger/Logger';
/**
 * Latency Test Results Data
 */
export class LatencyTestResults {
    //Fields Set from the latency payload regardless of version
    ReceiptTimeMs: number = null;
    TransmissionTimeMs: number = null;

    //Fields Set from the latency payload from 4.27.2
    PreCaptureTimeMs: number = null;
    PostCaptureTimeMs: number = null;
    PreEncodeTimeMs: number = null;
    PostEncodeTimeMs: number = null;

    //Fields Set from the latency payload from 5.0
    EncodeMs: number = null;
    CaptureToSendMs: number = null;

    //Fields Set when processed
    testStartTimeMs = 0;
    browserReceiptTimeMs = 0;

    //Fields set from calculations
    latencyExcludingDecode = 0;
    testDuration = 0;
    //ueLatency: number = 0;
    networkLatency = 0;
    browserSendLatency = 0;
    frameDisplayDeltaTimeMs = 0;
    endToEndLatency = 0;
    //uePixelStreamLatency: number = 0;
    encodeLatency = 0;

    /**
     * Sets the Delta Time Milliseconds
     * @param DeltaTimeMs - Delta Time Milliseconds
     */
    setFrameDisplayDeltaTime(DeltaTimeMs: number) {
        if (this.frameDisplayDeltaTimeMs == 0) {
            this.frameDisplayDeltaTimeMs = Math.round(DeltaTimeMs);
        }
    }

    /**
     * Process the encoder times and set them
     */
    processFields() {
        if (
            this.EncodeMs == null &&
            (this.PreEncodeTimeMs != null || this.PostEncodeTimeMs != null)
        ) {
            Logger.Log(
                Logger.GetStackTrace(),
                `Setting Encode Ms \n ${this.PostEncodeTimeMs} \n ${this.PreEncodeTimeMs}`,
                6
            );
            this.EncodeMs = this.PostEncodeTimeMs - this.PreEncodeTimeMs;
        }

        if (
            this.CaptureToSendMs == null &&
            (this.PreCaptureTimeMs != null || this.PostCaptureTimeMs != null)
        ) {
            Logger.Log(
                Logger.GetStackTrace(),
                `Setting CaptureToSendMs Ms \n ${this.PostCaptureTimeMs} \n ${this.PreCaptureTimeMs}`,
                6
            );
            this.CaptureToSendMs =
                this.PostCaptureTimeMs - this.PreCaptureTimeMs;
        }
    }
}

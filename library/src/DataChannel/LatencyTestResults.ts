import { ILatencyTestResults } from "../DataChannel/ILatencyTestResults"
/**
 * Latency Test Results Data
 */
export class LatencyTestResults implements ILatencyTestResults {
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
    testStartTimeMs: number = 0;
    browserReceiptTimeMs: number = 0;
    
    //Fields set from calculations
    latencyExcludingDecode: number = 0;
    testDuration: number=0;
    //ueLatency: number = 0;
    networkLatency: number = 0;
    browserSendLatency: number = 0;
    frameDisplayDeltaTimeMs: number = 0;
    endToEndLatency: number = 0;
    //uePixelStreamLatency: number = 0;
    encodeLatency: number = 0;    
    
    /**
     * Sets the Delta Time Milliseconds
     * @param DeltaTimeMs - Delta Time Milliseconds
     */
    setFrameDisplayDeltaTime(DeltaTimeMs: number) {
        if (this.frameDisplayDeltaTimeMs == 0) {
            this.frameDisplayDeltaTimeMs = Math.round(DeltaTimeMs);
        }
    }
    
    processFields(){
        if (this.EncodeMs == null && (this.PreEncodeTimeMs != null || this.PostEncodeTimeMs != null)) {
            console.log("Setting Encode Ms")
            console.log(this.PostEncodeTimeMs)
            console.log(this.PreEncodeTimeMs)
            this.EncodeMs = this.PostEncodeTimeMs - this.PreEncodeTimeMs
        }

        if (this.CaptureToSendMs == null && (this.PreCaptureTimeMs != null || this.PostCaptureTimeMs != null)) {
            console.log("Setting CaptureToSendMs Ms")
            console.log(this.PostCaptureTimeMs)
            console.log(this.PreCaptureTimeMs)
            this.CaptureToSendMs = this.PostCaptureTimeMs - this.PreCaptureTimeMs
        }

    }
}

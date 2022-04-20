export interface ILatencyTestResults{
    //Fields Set from the latency payload regardless of version
    ReceiptTimeMs?: number;
    TransmissionTimeMs?: number;

    //Fields Set from the latency payload from 4.27.2
    PreCaptureTimeMs?: number;
    PostCaptureTimeMs?: number;
    PreEncodeTimeMs?: number;
    PostEncodeTimeMs?: number;

    //Fields Set from the latency payload from 5.0
    EncodeMs?: number;
    CaptureToSendMs?: number;
}

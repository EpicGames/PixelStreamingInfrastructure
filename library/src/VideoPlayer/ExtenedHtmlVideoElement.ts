/**
 * The interface for the Video Frame Metadata 
 */
export interface VideoFrameMetadata {
    presentationTime: DOMHighResTimeStamp;
    expectedDisplayTime: DOMHighResTimeStamp;
    width: number;
    height: number;
    mediaTime: number;
    presentedFrames: number;
    processingDuration?: number;
    captureTime?: DOMHighResTimeStamp;
    receiveTime?: DOMHighResTimeStamp;
    rtpTimestamp?: number;
}

/**
 * A static for VideoFrameRequestCallbackId
 */
export type VideoFrameRequestCallbackId = number;

/**
 * An interface for ExtendedHTMLVideoElement which includes webRtc parameters that are not in typescript yet
 */
export interface ExtendedHTMLVideoElement extends HTMLVideoElement {
    requestVideoFrameCallback(callback: (now: DOMHighResTimeStamp, metadata: VideoFrameMetadata) => any): VideoFrameRequestCallbackId;
    cancelVideoFrameCallback(handle: VideoFrameRequestCallbackId): void;   
}
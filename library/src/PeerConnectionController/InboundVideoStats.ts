/** 
 * Inbound Video Stats collected from the RTC Stats Report
 */
export class inboundVideoStats {
    receiveToCompositeMs: number = 0;
    timestamp: number = 0;
    bytesReceived: number = 0;
    framesDecoded: number = 0;
    packetsLost: number = 0;
    bytesReceivedStart: number = 0;
    framesDecodedStart: number = 0;
    timestampStart: number = 0;
    bitrate: number = 0;
    lowBitrate: number = 0;
    highBitrate: number = 0;
    avgBitrate: number = 0;
    framerate: number = 0;
    lowFramerate: number = 0;
    highFramerate: number = 0;
    averageFrameRate: number = 0;
    framesDropped: number = 0;
    framesReceived: number = 0;
    framesDroppedPercentage: number = 0;
    frameHeight: number = 0;
    frameWidth: number = 0;
    frameHeightStart: number = 0;
    frameWidthStart: number = 0;
    jitter: number = 0;
}
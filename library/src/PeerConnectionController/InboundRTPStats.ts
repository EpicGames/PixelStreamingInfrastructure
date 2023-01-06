/** 
 * Inbound Audio Stats collected from the RTC Stats Report
 */
export class InboundAudioStats {
	bytesReceived: number;
	jitter: number;
	packetsLost: number;
	timestamp: number;
}

/** 
 * Inbound Video Stats collected from the RTC Stats Report
 */
export class InboundVideoStats {
	receiveToCompositeMs: number;
	timestamp: number;
	bytesReceived: number;
	framesDecoded: number;
	packetsLost: number;
	bytesReceivedStart: number;
	framesDecodedStart: number;
	timestampStart: number;
	bitrate = 0;
	lowBitrate: number;
	highBitrate: number;
	avgBitrate: number;
	framerate = 0;
	lowFramerate: number;
	highFramerate: number;
	averageFrameRate: number;
	framesDropped: number;
	framesReceived: number;
	framesDroppedPercentage: number;
	frameHeight: number;
	frameWidth: number;
	frameHeightStart: number;
	frameWidthStart: number;
	jitter: number;
}

/** 
 * Inbound Stats collected from the RTC Stats Report
 */
export class InboundRTPStats {
	kind: string;
	bytesReceived: number;
	jitter: number;
	packetsLost: number;
	timestamp: number;
	receiveToCompositeMs: number;
	framesDecoded: number;
	bytesReceivedStart: number;
	framesDecodedStart: number;
	timestampStart: number;
	bitrate = 0;
	lowBitrate: number;
	highBitrate: number;
	avgBitrate: number;
	framerate = 0;
	lowFramerate: number;
	highFramerate: number;
	averageFrameRate: number;
	framesDropped: number;
	framesReceived: number;
	framesDroppedPercentage: number;
	frameHeight: number;
	frameWidth: number;
	frameHeightStart: number;
	frameWidthStart: number;
}
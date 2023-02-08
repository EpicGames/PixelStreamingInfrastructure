// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * Inbound Track Stats collected from the RTC Stats Report
 */
export class InboundTrackStats {
    type: string;
    kind: string;
    trackIdentifier: string;
    receiveToCompositeMs: number;
    timestamp: number;
    bytesReceived: number;
    framesDecoded: number;
    packetsLost: number;
    bytesReceivedStart: number;
    framesDecodedStart: number;
    timestampStart: number;
    bitrate: number;
    lowBitrate: number;
    highBitrate: number;
    avgBitrate: number;
    framerate: number;
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

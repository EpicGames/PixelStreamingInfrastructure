// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * Inbound Audio Stats collected from the RTC Stats Report
 */
export class InboundAudioStats {
    audioLevel: number;
    bytesReceived: number;
    codecId: string;
    concealedSamples: number;
    concealmentEvents: number;
    fecPacketsDiscarded: number;
    fecPacketsReceived: number;
    headerBytesReceived: number;
    id: string;
    insertedSamplesForDeceleration: number;
    jitter: number;
    jitterBufferDelay: number;
    jitterBufferEmittedCount: number;
    jitterBufferMinimumDelay: number;
    jitterBufferTargetDelay: number;
    kind: string;
    lastPacketReceivedTimestamp: number;
    mediaType: string;
    mid: string;
    packetsDiscarded: number;
    packetsLost: number;
    packetsReceived: number;
    removedSamplesForAcceleration: number;
    silentConcealedSamples: number;
    ssrc: number;
    timestamp: number;
    totalAudioEnergy: number;
    totalSamplesDuration: number;
    totalSamplesReceived: number;
    trackIdentifier: string;
    transportId: string;
    type: string;

    /* additional, custom stats */
    bitrate: number;
}

/**
 * Inbound Video Stats collected from the RTC Stats Report
 */
export class InboundVideoStats {
    bytesReceived: number;
    codecId: string;
    firCount: number;
    frameHeight: number;
    frameWidth: number;
    framesAssembledFromMultiplePackets: number;
    framesDecoded: number;
    framesDropped: number;
    framesPerSecond: number;
    framesReceived: number;
    freezeCount: number;
    googTimingFrameInfo: string;
    headerBytesReceived: number;
    id: string;
    jitter: number;
    jitterBufferDelay: number;
    jitterBufferEmittedCount: number;
    keyFramesDecoded: number;
    kind: string;
    lastPacketReceivedTimestamp: number;
    mediaType: string;
    mid: string;
    nackCount: number;
    packetsLost: number;
    packetsReceived: number;
    pauseCount: number;
    pliCount: number;
    ssrc: number;
    timestamp: number;
    totalAssemblyTime: number;
    totalDecodeTime: number;
    totalFreezesDuration: number;
    totalInterFrameDelay: number;
    totalPausesDuration: number;
    totalProcessingDelay: number;
    totalSquaredInterFrameDelay: number;
    trackIdentifier: string;
    transportId: string;
    type: string;

    /* additional, custom stats */
    bitrate: number;
}

/**
 * Inbound Stats collected from the RTC Stats Report
 */
export class InboundRTPStats {
    /* common stats */
    bytesReceived: number;
    codecId: string;
    headerBytesReceived: number;
    id: string;
    jitter: number;
    jitterBufferDelay: number;
    jitterBufferEmittedCount: number;
    kind: string;
    lastPacketReceivedTimestamp: number;
    mediaType: string;
    mid: string;
    packetsLost: number;
    packetsReceived: number;
    ssrc: number;
    timestamp: number;
    trackIdentifier: string;
    transportId: string;
    type: string;

    /* audio specific stats */
    audioLevel: number;
    concealedSamples: number;
    concealmentEvents: number;
    fecPacketsDiscarded: number;
    fecPacketsReceived: number;
    insertedSamplesForDeceleration: number;
    jitterBufferMinimumDelay: number;
    jitterBufferTargetDelay: number;
    packetsDiscarded: number;
    removedSamplesForAcceleration: number;
    silentConcealedSamples: number;
    totalAudioEnergy: number;
    totalSamplesDuration: number;
    totalSamplesReceived: number;

    /* video specific stats */
    firCount: number;
    frameHeight: number;
    frameWidth: number;
    framesAssembledFromMultiplePackets: number;
    framesDecoded: number;
    framesDropped: number;
    framesPerSecond: number;
    framesReceived: number;
    freezeCount: number;
    googTimingFrameInfo: string;
    keyFramesDecoded: number;
    nackCount: number;
    pauseCount: number;
    pliCount: number;
    totalAssemblyTime: number;
    totalDecodeTime: number;
    totalFreezesDuration: number;
    totalInterFrameDelay: number;
    totalPausesDuration: number;
    totalProcessingDelay: number;
    totalSquaredInterFrameDelay: number;
}

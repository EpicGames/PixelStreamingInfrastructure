// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * ICE Candidate Pair Stats collected from the RTC Stats Report
 */
export class CandidatePairStats {
    bytesReceived: number;
    bytesSent: number;
    currentRoundTripTime: number;
    id: string;
    lastPacketReceivedTimestamp: number;
    lastPacketSentTimestamp: number;
    localCandidateId: string;
    nominated: boolean;
    priority: number;
    readable: boolean;
    remoteCandidateId: string;
    selected: boolean;
    state: string;
    timestamp: number;
    transportId: string;
    type: string;
    writable: boolean;  
}

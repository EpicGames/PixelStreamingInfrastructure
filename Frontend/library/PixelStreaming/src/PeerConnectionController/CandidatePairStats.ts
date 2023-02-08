// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * ICE Candidate Pair Stats collected from the RTC Stats Report
 */
export class CandidatePairStats {
    bytesReceived: number;
    bytesSent: number;
    localCandidateId: string;
    remoteCandidateId: string;
    nominated: boolean;
    readable: boolean;
    writable: boolean;
    selected: boolean;
    state: string;
    currentRoundTripTime: number;
}

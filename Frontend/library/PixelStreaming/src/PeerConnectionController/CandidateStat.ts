// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * ICE Candidate Stat collected from the RTC Stats Report
 */
export class CandidateStat {
    label: string;
    id: string;
    address: string;
    candidateType: string;
    port: number;
    protocol: 'tcp' | 'udp';
}

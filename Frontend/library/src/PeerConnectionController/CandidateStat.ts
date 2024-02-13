// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * ICE Candidate Stat collected from the RTC Stats Report
 */
export class CandidateStat {
    address: string;
    candidateType: string;
    id: string;
    label: string;    
    port: number;
    protocol: 'tcp' | 'udp';
    relayProtocol: 'tcp' | 'udp' | 'tls';
    transportId: string;
}

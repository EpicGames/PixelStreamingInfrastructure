// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * Outbound Video Stats collected from the RTC Stats Report
 */
export class OutBoundVideoStats {
    bytesSent: number;
    id: string;
    localId: string;
    packetsSent: number;
    remoteTimestamp: number;
    timestamp: number;
}

/**
 * Outbound Stats collected from the RTC Stats Report
 */
export class OutBoundRTPStats {
    kind: string;
    bytesSent: number;
    id: string;
    localId: string;
    packetsSent: number;
    remoteTimestamp: number;
    timestamp: number;
}

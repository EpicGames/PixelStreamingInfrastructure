// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * Data Channel Stats collected from the RTC Stats Report
 */
export class DataChannelStats {
    bytesReceived: number;
    bytesSent: number;
    dataChannelIdentifier: number;
    id: string;
    label: string;
    messagesReceived: number;
    messagesSent: number;
    protocol: string;
    state: string;
    timestamp: number;
}

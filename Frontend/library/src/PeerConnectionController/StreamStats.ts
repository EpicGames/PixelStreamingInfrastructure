// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * Class to hold the stream stats data coming in from webRtc
 */
export class StreamStats {
    id: string;
    streamIdentifier: string;
    timestamp: number;
    trackIds: string[];
}

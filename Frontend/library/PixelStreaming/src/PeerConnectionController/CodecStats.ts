// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * Codec Stats collected from the RTC Stats Report
 */
export class CodecStats {
    /* common stats */
    clockRate: number;
    id: string;
    mimeType: string;
    payloadType: number;
    sdpFmtpLine: string;
    timestamp: number;
    transportId: string;
    type: string;

    /* audio specific stats */
    channels: number;
}

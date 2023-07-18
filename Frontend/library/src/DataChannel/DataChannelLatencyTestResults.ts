// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * Data Channel Latency Test types
 */


/**
 * Unix epoch
 */
export type DataChannelLatencyTestTimestamp = number;

/**
 * Sequence number represented by unsigned int
 */
export type DataChannelLatencyTestSeq = number;

/**
 * Request sent to Streamer
 */
export type DataChannelLatencyTestRequest = {
    Seq: DataChannelLatencyTestSeq;
    FillResponseSize: number;
    Filler: string;
}

/**
 * Response from the Streamer
 */
export type DataChannelLatencyTestResponse = {
    Seq: DataChannelLatencyTestSeq;
    Filler: string;
    ReceivedTimestamp: DataChannelLatencyTestTimestamp;
    SentTimestamp: DataChannelLatencyTestTimestamp;
}

export type DataChannelLatencyTestResult = {
    records: Map<DataChannelLatencyTestSeq, DataChannelLatencyTestRecord>
    dataChannelRtt: number,
    playerToStreamerTime: number,
    streamerToPlayerTime: number,
    exportLatencyAsCSV: () => string
}

export class DataChannelLatencyTestRecord {
    seq: DataChannelLatencyTestSeq;
    playerSentTimestamp: DataChannelLatencyTestTimestamp;
    playerReceivedTimestamp: DataChannelLatencyTestTimestamp;
    streamerReceivedTimestamp: DataChannelLatencyTestTimestamp;
    streamerSentTimestamp: DataChannelLatencyTestTimestamp;
    requestFillerSize: number;
    responseFillerSize: number;

    constructor(request: DataChannelLatencyTestRequest) {
        this.seq = request.Seq;
        this.playerSentTimestamp = Date.now();
        this.requestFillerSize = request.Filler ? request.Filler.length : 0;
    }

    update(response: DataChannelLatencyTestResponse) {
        this.playerReceivedTimestamp = Date.now();
        this.streamerReceivedTimestamp = response.ReceivedTimestamp;
        this.streamerSentTimestamp = response.SentTimestamp;
        this.responseFillerSize = response.Filler ? response.Filler.length : 0;
    }

}

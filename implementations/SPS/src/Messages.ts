import * as libfrontend from "@epicgames/libfrontend";

export enum MessageSendTypes {
	STATS = "stats",
}

/**
 * Aggregated Stats Message Wrapper
 */
export class MessageStats extends libfrontend.MessageSend {
	inboundVideoStats: libfrontend.InboundVideoStats;
	inboundAudioStats: libfrontend.InboundAudioStats;
	candidatePair: libfrontend.CandidatePairStats
	dataChannelStats: libfrontend.DataChannelStats;
	localCandidates: Array<libfrontend.CandidateStat>;
	remoteCandidates: Array<libfrontend.CandidateStat>;
	outboundVideoStats: libfrontend.OutBoundVideoStats;

	/**
	 * @param aggregatedStats - Aggregated Stats 
	 */
	constructor(aggregatedStats: libfrontend.AggregatedStats) {
		super();
		this.type = MessageSendTypes.STATS
		this.inboundVideoStats = aggregatedStats.inboundVideoStats;
		this.inboundAudioStats = aggregatedStats.inboundAudioStats;
		this.candidatePair = aggregatedStats.candidatePair;
		this.dataChannelStats = aggregatedStats.DataChannelStats
		this.localCandidates = aggregatedStats.localCandidates;
		this.remoteCandidates = aggregatedStats.remoteCandidates;
		this.outboundVideoStats = aggregatedStats.outBoundVideoStats;
	}
}
import { Logger } from "../Logger/Logger";
import { AggregatedStats } from "../PeerConnectionController/AggregatedStats";
import { CandidatePairStats } from "../PeerConnectionController/CandidatePairStats";
import { CandidateStat } from "../PeerConnectionController/CandidateStat";
import { dataChannelStats } from "../PeerConnectionController/DataChannelStats";
import { inboundAudioStats } from "../PeerConnectionController/InboundAudioStats";
import { inboundVideoStats } from "../PeerConnectionController/InboundVideoStats";
import { OutBoundVideoStats } from "../PeerConnectionController/OutBoundVideoStats";

/**
 * The Send Types that are pushed from the signaling server
 */
export enum MessageSendTypes {
    ICE_CANDIDATE = "iceCandidate",
    STATS = "stats",
    OFFER = "offer",
    ANSWER = "answer",
	DATACHANNELREQUEST = "dataChannelRequest",
	SFURECVDATACHANNELREADY = "peerDataChannelsReady",
    PONG = "pong"
}

/**
 * A Wrapper for the message to send to the signaling server
 */
export class MessageSend implements Send {
    type: string;
    peerConnectionOptions: Object;

    /**
     * Turns the wrapper into a JSON String
     * @returns - JSON String of the Message to send
     */
    payload() {
        Logger.Log(Logger.GetStackTrace(), "Sending => \n" + JSON.stringify(this, undefined, 4), 6);
        return JSON.stringify(this);
    }
}

export interface Send {
    /**
     * Turns the wrapper into a JSON String
     * @returns - JSON String of the Message to send
     */
    payload: () => string;
}

/**
 * Instance Request Message Wrapper
 */
export class MessagePong extends MessageSend {

    time: number;

    constructor(time: number) {
        super();
        this.type = MessageSendTypes.PONG;
        this.time = time
    }
}

/**
 * Aggregated Stats Message Wrapper
 */
export class MessageStats extends MessageSend {
    inboundVideoStats: inboundVideoStats;
    inboundAudioStats: inboundAudioStats;
    candidatePair: CandidatePairStats
    dataChannelStats: dataChannelStats;
    localCandidates: Array<CandidateStat>;
    remoteCandidates: Array<CandidateStat>;
    outboundVideoStats: OutBoundVideoStats;

    /**
     * @param aggregatedStats - Aggregated Stats 
     */
    constructor(aggregatedStats: AggregatedStats) {
        super();
        this.type = MessageSendTypes.STATS
        this.inboundVideoStats = aggregatedStats.inboundVideoStats;
        this.inboundAudioStats = aggregatedStats.inboundAudioStats;
        this.candidatePair = aggregatedStats.candidatePair;
        this.dataChannelStats = aggregatedStats.dataChannelStats
        this.localCandidates = aggregatedStats.localCandidates;
        this.remoteCandidates = aggregatedStats.remoteCandidates;
        this.outboundVideoStats = aggregatedStats.outBoundVideoStats;
    }
}

/**
 *  Web RTC Offer message wrapper
 */
export class MessageWebRTCOffer extends MessageSend {
    sdp: string;

    /**
     * @param offer - Generated Web RTC Offer
     */
    constructor(offer?: RTCSessionDescriptionInit) {
        super();
        this.type = MessageSendTypes.OFFER;

        if (offer) {
            this.type = offer.type as MessageSendTypes;
            this.sdp = offer.sdp;
        }
    }
}

/**
 *  Web RTC Answer message wrapper
 */
export class MessageWebRTCAnswer extends MessageSend {
	sdp: string;

	/**
	 * @param answer - Generated Web RTC Offer
	 */
	constructor(answer?: RTCSessionDescriptionInit) {
		super();
		this.type = MessageSendTypes.ANSWER;

		if (answer) {
			this.type = answer.type as MessageSendTypes;
			this.sdp = answer.sdp;
		}
	}
}

/**
 *  Web RTC Data channel request message wrapper
 */
export class MessageWebRTCDatachannelRequest extends MessageSend {
	constructor() {
		super();
		this.type = MessageSendTypes.DATACHANNELREQUEST;
	}
}

/**
 *  // TODO (william.belcher)
 */
export class MessageSFURecvDataChannelReady extends MessageSend {
	constructor() {
		super();
		this.type = MessageSendTypes.SFURECVDATACHANNELREADY;
	}
}





/**
 * RTC Ice Candidate Wrapper
 */
export class MessageIceCandidate implements Send {
    candidate: RTCIceCandidate;
    type: MessageSendTypes;

    /**
     * @param candidate - RTC Ice Candidate
     */
    constructor(candidate: RTCIceCandidate) {
        this.type = MessageSendTypes.ICE_CANDIDATE;
        this.candidate = candidate;
    }

    /**
     * Turns the wrapper into a JSON String
     * @returns - JSON String of the Message to send
     */
    payload() {
        Logger.Log(Logger.GetStackTrace(), "Sending => \n" + JSON.stringify(this, undefined, 4), 6);
        return JSON.stringify(this);
    }
}
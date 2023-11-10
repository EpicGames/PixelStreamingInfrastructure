// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '../Logger/Logger';

/**
 * The Send Types that are pushed from the signaling server
 */
export enum MessageSendTypes {
    LIST_STREAMERS = 'listStreamers',
    SUBSCRIBE = 'subscribe',
    UNSUBSCRIBE = 'unsubscribe',
    ICE_CANDIDATE = 'iceCandidate',
    OFFER = 'offer',
    ANSWER = 'answer',
    DATACHANNELREQUEST = 'dataChannelRequest',
    SFURECVDATACHANNELREADY = 'peerDataChannelsReady',
    PONG = 'pong'
}

/**
 * A Wrapper for the message to send to the signaling server
 */
export class MessageSend implements Send {
    type: string;
    peerConnectionOptions: object;

    /**
     * A filter for controlling what parameters to actually send.
     * Good for excluding default values or hidden internals.
     * Example for including everything but zero bitrate fields...
     * sendFilter(key: string, value: any) {
     *   if ((key == "minBitrate" || key == "maxBitrate") && value <= 0) return undefined;
     *   return value;
     * }
     * Return undefined to exclude the property completely.
     */
    sendFilter(key: string, value: any) {
        return value;
    }

    /**
     * Turns the wrapper into a JSON String
     * @returns - JSON String of the Message to send
     */
    payload() {
        Logger.Log(
            Logger.GetStackTrace(),
            'Sending => \n' + JSON.stringify(this, this.sendFilter, 4),
            6
        );
        return JSON.stringify(this, this.sendFilter);
    }
}

export interface Send {
    /**
     * Turns the wrapper into a JSON String
     * @returns - JSON String of the Message to send
     */
    payload: () => string;
}

export class MessageListStreamers extends MessageSend {
    constructor() {
        super();
        this.type = MessageSendTypes.LIST_STREAMERS;
    }
}

export class MessageSubscribe extends MessageSend {
    streamerId: string;

    constructor(streamerid: string) {
        super();
        this.type = MessageSendTypes.SUBSCRIBE;
        this.streamerId = streamerid;
    }
}

export class MessageUnsubscribe extends MessageSend {
    constructor() {
        super();
        this.type = MessageSendTypes.UNSUBSCRIBE;
    }
}

/**
 * Instance Request Message Wrapper
 */
export class MessagePong extends MessageSend {
    time: number;

    constructor(time: number) {
        super();
        this.type = MessageSendTypes.PONG;
        this.time = time;
    }
}

export type ExtraOfferParameters = {
    minBitrateBps: number;
    maxBitrateBps: number;
}

/**
 *  Web RTC Offer message wrapper
 */
export class MessageWebRTCOffer extends MessageSend {
    sdp: string;
    minBitrate: number;
    maxBitrate: number;

    /**
     * @param offer - Generated Web RTC Offer
     */
    constructor(offer: RTCSessionDescriptionInit, extraParams: ExtraOfferParameters) {
        super();
        this.type = MessageSendTypes.OFFER;
        this.minBitrate = 0;
        this.maxBitrate = 0;

        if (offer) {
            this.type = offer.type as MessageSendTypes;
            this.sdp = offer.sdp;
            this.minBitrate = extraParams.minBitrateBps;
            this.maxBitrate = extraParams.maxBitrateBps;
        }
    }

    sendFilter(key: string, value: any) {
        if ((key == "minBitrate" || key == "maxBitrate") && value <= 0) return undefined;
        return value;
    }
}

export type ExtraAnswerParameters = {
    minBitrateBps: number;
    maxBitrateBps: number;
}

/**
 *  Web RTC Answer message wrapper
 */
export class MessageWebRTCAnswer extends MessageSend {
    sdp: string;
    minBitrate: number;
    maxBitrate: number;

    /**
     * @param answer - Generated Web RTC Offer
     */
    constructor(answer: RTCSessionDescriptionInit, extraParams: ExtraAnswerParameters) {
        super();
        this.type = MessageSendTypes.ANSWER;
        this.minBitrate = 0;
        this.maxBitrate = 0;

        if (answer) {
            this.type = answer.type as MessageSendTypes;
            this.sdp = answer.sdp;
            this.minBitrate = extraParams.minBitrateBps;
            this.maxBitrate = extraParams.maxBitrateBps;
        }
    }

    sendFilter(key: string, value: any) {
        if ((key == "minBitrate" || key == "maxBitrate") && value <= 0) return undefined;
        return value;
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
 *  Web RTC SFU Data channel ready message wrapper
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
        Logger.Log(
            Logger.GetStackTrace(),
            'Sending => \n' + JSON.stringify(this, undefined, 4),
            6
        );
        return JSON.stringify(this);
    }
}

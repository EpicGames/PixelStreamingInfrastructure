// Copyright Epic Games, Inc. All Rights Reserved.
import { Logger } from '../Logger/Logger';
/**
 * The Send Types that are pushed from the signaling server
 */
export var MessageSendTypes;
(function (MessageSendTypes) {
    MessageSendTypes["LIST_STREAMERS"] = "listStreamers";
    MessageSendTypes["SUBSCRIBE"] = "subscribe";
    MessageSendTypes["UNSUBSCRIBE"] = "unsubscribe";
    MessageSendTypes["ICE_CANDIDATE"] = "iceCandidate";
    MessageSendTypes["OFFER"] = "offer";
    MessageSendTypes["ANSWER"] = "answer";
    MessageSendTypes["DATACHANNELREQUEST"] = "dataChannelRequest";
    MessageSendTypes["SFURECVDATACHANNELREADY"] = "peerDataChannelsReady";
    MessageSendTypes["PONG"] = "pong";
})(MessageSendTypes || (MessageSendTypes = {}));
/**
 * A Wrapper for the message to send to the signaling server
 */
export class MessageSend {
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
    sendFilter(key, value) {
        return value;
    }
    /**
     * Turns the wrapper into a JSON String
     * @returns - JSON String of the Message to send
     */
    payload() {
        Logger.Log(Logger.GetStackTrace(), 'Sending => \n' + JSON.stringify(this, this.sendFilter, 4), 6);
        return JSON.stringify(this, this.sendFilter);
    }
}
export class MessageListStreamers extends MessageSend {
    constructor() {
        super();
        this.type = MessageSendTypes.LIST_STREAMERS;
    }
}
export class MessageSubscribe extends MessageSend {
    constructor(streamerid) {
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
    constructor(time) {
        super();
        this.type = MessageSendTypes.PONG;
        this.time = time;
    }
}
/**
 *  Web RTC Offer message wrapper
 */
export class MessageWebRTCOffer extends MessageSend {
    /**
     * @param offer - Generated Web RTC Offer
     */
    constructor(offer, extraParams) {
        super();
        this.type = MessageSendTypes.OFFER;
        this.minBitrate = 0;
        this.maxBitrate = 0;
        if (offer) {
            this.type = offer.type;
            this.sdp = offer.sdp;
            this.minBitrate = extraParams.minBitrateBps;
            this.maxBitrate = extraParams.maxBitrateBps;
        }
    }
    sendFilter(key, value) {
        if ((key == "minBitrate" || key == "maxBitrate") && value <= 0)
            return undefined;
        return value;
    }
}
/**
 *  Web RTC Answer message wrapper
 */
export class MessageWebRTCAnswer extends MessageSend {
    /**
     * @param answer - Generated Web RTC Offer
     */
    constructor(answer, extraParams) {
        super();
        this.type = MessageSendTypes.ANSWER;
        this.minBitrate = 0;
        this.maxBitrate = 0;
        if (answer) {
            this.type = answer.type;
            this.sdp = answer.sdp;
            this.minBitrate = extraParams.minBitrateBps;
            this.maxBitrate = extraParams.maxBitrateBps;
        }
    }
    sendFilter(key, value) {
        if ((key == "minBitrate" || key == "maxBitrate") && value <= 0)
            return undefined;
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
export class MessageIceCandidate {
    /**
     * @param candidate - RTC Ice Candidate
     */
    constructor(candidate) {
        this.type = MessageSendTypes.ICE_CANDIDATE;
        this.candidate = candidate;
    }
    /**
     * Turns the wrapper into a JSON String
     * @returns - JSON String of the Message to send
     */
    payload() {
        Logger.Log(Logger.GetStackTrace(), 'Sending => \n' + JSON.stringify(this, undefined, 4), 6);
        return JSON.stringify(this);
    }
}
//# sourceMappingURL=MessageSend.js.map
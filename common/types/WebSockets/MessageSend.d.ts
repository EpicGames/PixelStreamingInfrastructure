/**
 * The Send Types that are pushed from the signaling server
 */
export declare enum MessageSendTypes {
    LIST_STREAMERS = "listStreamers",
    SUBSCRIBE = "subscribe",
    UNSUBSCRIBE = "unsubscribe",
    ICE_CANDIDATE = "iceCandidate",
    OFFER = "offer",
    ANSWER = "answer",
    DATACHANNELREQUEST = "dataChannelRequest",
    SFURECVDATACHANNELREADY = "peerDataChannelsReady",
    PONG = "pong"
}
/**
 * A Wrapper for the message to send to the signaling server
 */
export declare class MessageSend implements Send {
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
    sendFilter(key: string, value: any): any;
    /**
     * Turns the wrapper into a JSON String
     * @returns - JSON String of the Message to send
     */
    payload(): string;
}
export interface Send {
    /**
     * Turns the wrapper into a JSON String
     * @returns - JSON String of the Message to send
     */
    payload: () => string;
}
export declare class MessageListStreamers extends MessageSend {
    constructor();
}
export declare class MessageSubscribe extends MessageSend {
    streamerId: string;
    constructor(streamerid: string);
}
export declare class MessageUnsubscribe extends MessageSend {
    constructor();
}
/**
 * Instance Request Message Wrapper
 */
export declare class MessagePong extends MessageSend {
    time: number;
    constructor(time: number);
}
export type ExtraOfferParameters = {
    minBitrateBps: number;
    maxBitrateBps: number;
};
/**
 *  Web RTC Offer message wrapper
 */
export declare class MessageWebRTCOffer extends MessageSend {
    sdp: string;
    minBitrate: number;
    maxBitrate: number;
    /**
     * @param offer - Generated Web RTC Offer
     */
    constructor(offer: RTCSessionDescriptionInit, extraParams: ExtraOfferParameters);
    sendFilter(key: string, value: any): any;
}
export type ExtraAnswerParameters = {
    minBitrateBps: number;
    maxBitrateBps: number;
};
/**
 *  Web RTC Answer message wrapper
 */
export declare class MessageWebRTCAnswer extends MessageSend {
    sdp: string;
    minBitrate: number;
    maxBitrate: number;
    /**
     * @param answer - Generated Web RTC Offer
     */
    constructor(answer: RTCSessionDescriptionInit, extraParams: ExtraAnswerParameters);
    sendFilter(key: string, value: any): any;
}
/**
 *  Web RTC Data channel request message wrapper
 */
export declare class MessageWebRTCDatachannelRequest extends MessageSend {
    constructor();
}
/**
 *  Web RTC SFU Data channel ready message wrapper
 */
export declare class MessageSFURecvDataChannelReady extends MessageSend {
    constructor();
}
/**
 * RTC Ice Candidate Wrapper
 */
export declare class MessageIceCandidate implements Send {
    candidate: RTCIceCandidate;
    type: MessageSendTypes;
    /**
     * @param candidate - RTC Ice Candidate
     */
    constructor(candidate: RTCIceCandidate);
    /**
     * Turns the wrapper into a JSON String
     * @returns - JSON String of the Message to send
     */
    payload(): string;
}

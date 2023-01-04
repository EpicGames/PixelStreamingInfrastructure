/**
 * The Types of Messages that will be received
 */
export enum MessageRecvTypes {
    
    
    CONFIG = "config",
    PLAYER_COUNT = "playerCount",
    OFFER = "offer",
    ANSWER = "answer",
    ICE_CANDIDATE = "iceCandidate",
    PING = "ping"
}

/**
 * Concrete Received Message wrapper
 */
export class MessageRecv {
    type: string;
    id: string;
}

/**
 * Authentication Required Message wrapper
 */
export class MessageAuthRequired extends MessageRecv { }



/**
 * Config Message Wrapper
 */
export class MessageConfig extends MessageRecv {
    peerConnectionOptions: RTCConfiguration; 
}

/**
 * Player Count Message wrapper
 */
export class MessagePlayerCount extends MessageRecv {
    count: number;
}

/**
 * Web RTC offer Answer Message wrapper
 */
export class MessageAnswer extends MessageRecv {
    sdp: string;
}

/**
 * WebRTC sdp offer message wrapper.
 */
export class MessageOffer extends MessageRecv {
    sdp: string;
}

/**
 * Ice Candidate Message wrapper
 */
export class MessageIceCandidate extends MessageRecv {
    candidate: RTCIceCandidateInit;
}
/**
 * The Types of Messages that will be received
 */
export enum MessageRecvTypes {
    
    AUTHENTICATION_RESPONSE = "authenticationResponse",
    CONFIG = "config",
    PLAYER_COUNT = "playerCount",
    OFFER = "offer",
    ANSWER = "answer",
    ICE_CANDIDATE = "iceCandidate",
	PEER_DATA_CHANNELS = "peerDataChannels",
    PING = "ping",
	WARNING = "warning"
}

/**
 * Types of Authentication reposes 
 */
export enum MessageAuthResponseOutcomeType {
    REDIRECT = "REDIRECT",
    INVALID_TOKEN = "INVALID_TOKEN",
    AUTHENTICATED = "AUTHENTICATED",
    ERROR = "ERROR"
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
 * Authentication Response Message wrapper
 */
export class MessageAuthResponse extends MessageRecv {
    outcome: MessageAuthResponseOutcomeType;
    redirect: string;
    error: string;
}

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
 * WebRTC sdp offer Message wrapper.
 */
export class MessageOffer extends MessageRecv {
    sdp: string;
	sfu?: string;
}

/**
 * Ice Candidate Message wrapper
 */
export class MessageIceCandidate extends MessageRecv {
    candidate: RTCIceCandidateInit;
}

/**
 * Peer Data Channels Message wrapper
 */
export class MessagePeerDataChannels extends MessageRecv {
	recvStreamId: number;
	sendStreamId: number;
	type: string;
}
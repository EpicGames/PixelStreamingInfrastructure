/**
 * The Types of Messages that will be received
 */
export enum MessageRecvTypes {
    AUTHENTICATION_REQUIRED = "authenticationRequired",
    AUTHENTICATION_RESPONSE = "authenticationResponse",
    INSTANCE_STATE = "instanceState",
    CONFIG = "config",
    PLAYER_COUNT = "playerCount",
    ANSWER = "answer",
    ICE_CANDIDATE = "iceCandidate"
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
 * States of the UE Instance
 */
export enum InstanceState {
    UNALLOCATED = "UNALLOCATED",
    PENDING = "PENDING",
    FAILED = "FAILED",
    READY = "READY"
}

/**
 * Concrete Received Message wrapper
 */
export class MessageRecv {
    type: string;
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
 * Instance State Message wrapper
 */
export class MessageInstanceState extends MessageRecv {
    state: InstanceState;
    details: string;
    progress: number;
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
 * Ice Candidate Message wrapper
 */
export class MessageIceCandidate extends MessageRecv {
    candidate: RTCIceCandidateInit;
}
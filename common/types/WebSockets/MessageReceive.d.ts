/**
 * The Types of Messages that will be received
 */
export declare enum MessageRecvTypes {
    CONFIG = "config",
    STREAMER_LIST = "streamerList",
    STREAMER_ID_CHANGED = "streamerIDChanged",
    PLAYER_COUNT = "playerCount",
    OFFER = "offer",
    ANSWER = "answer",
    ICE_CANDIDATE = "iceCandidate",
    PEER_DATA_CHANNELS = "peerDataChannels",
    PING = "ping",
    WARNING = "warning"
}
/**
 * Concrete Received Message wrapper
 */
export declare class MessageRecv {
    type: string;
    id: string;
}
/**
 * Authentication Required Message wrapper
 */
export declare class MessageAuthRequired extends MessageRecv {
}
/**
 * Config Message Wrapper
 */
export declare class MessageConfig extends MessageRecv {
    peerConnectionOptions: RTCConfiguration;
}
/**
 * Streamer List Message Wrapper
 */
export declare class MessageStreamerList extends MessageRecv {
    ids: string[];
}
/**
 * Streamer ID Changed Message Wrapper
 */
export declare class MessageStreamerIDChanged extends MessageRecv {
    newID: string;
}
/**
 * Player Count Message wrapper
 */
export declare class MessagePlayerCount extends MessageRecv {
    count: number;
}
/**
 * Web RTC offer Answer Message wrapper
 */
export declare class MessageAnswer extends MessageRecv {
    sdp: string;
}
/**
 * WebRTC sdp offer Message wrapper.
 */
export declare class MessageOffer extends MessageRecv {
    sdp: string;
    sfu?: boolean;
    defaultToHover?: string;
}
/**
 * Ice Candidate Message wrapper
 */
export declare class MessageIceCandidate extends MessageRecv {
    candidate: RTCIceCandidateInit;
}
/**
 * Peer Data Channels Message wrapper
 */
export declare class MessagePeerDataChannels extends MessageRecv {
    recvStreamId: number;
    sendStreamId: number;
    type: string;
}
export declare class MessageOnScreenKeyboard {
    command: string;
    showOnScreenKeyboard: boolean;
    x: number;
    y: number;
}

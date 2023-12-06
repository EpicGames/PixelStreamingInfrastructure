// Copyright Epic Games, Inc. All Rights Reserved.
/**
 * The Types of Messages that will be received
 */
export var MessageRecvTypes;
(function (MessageRecvTypes) {
    MessageRecvTypes["CONFIG"] = "config";
    MessageRecvTypes["STREAMER_LIST"] = "streamerList";
    MessageRecvTypes["STREAMER_ID_CHANGED"] = "streamerIDChanged";
    MessageRecvTypes["PLAYER_COUNT"] = "playerCount";
    MessageRecvTypes["OFFER"] = "offer";
    MessageRecvTypes["ANSWER"] = "answer";
    MessageRecvTypes["ICE_CANDIDATE"] = "iceCandidate";
    MessageRecvTypes["PEER_DATA_CHANNELS"] = "peerDataChannels";
    MessageRecvTypes["PING"] = "ping";
    MessageRecvTypes["WARNING"] = "warning";
})(MessageRecvTypes || (MessageRecvTypes = {}));
/**
 * Concrete Received Message wrapper
 */
export class MessageRecv {
}
/**
 * Authentication Required Message wrapper
 */
export class MessageAuthRequired extends MessageRecv {
}
/**
 * Config Message Wrapper
 */
export class MessageConfig extends MessageRecv {
}
/**
 * Streamer List Message Wrapper
 */
export class MessageStreamerList extends MessageRecv {
}
/**
 * Streamer ID Changed Message Wrapper
 */
export class MessageStreamerIDChanged extends MessageRecv {
}
/**
 * Player Count Message wrapper
 */
export class MessagePlayerCount extends MessageRecv {
}
/**
 * Web RTC offer Answer Message wrapper
 */
export class MessageAnswer extends MessageRecv {
}
/**
 * WebRTC sdp offer Message wrapper.
 */
export class MessageOffer extends MessageRecv {
}
/**
 * Ice Candidate Message wrapper
 */
export class MessageIceCandidate extends MessageRecv {
}
/**
 * Peer Data Channels Message wrapper
 */
export class MessagePeerDataChannels extends MessageRecv {
}
export class MessageOnScreenKeyboard {
}
//# sourceMappingURL=MessageReceive.js.map
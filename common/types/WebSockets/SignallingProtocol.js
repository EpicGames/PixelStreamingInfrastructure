// Copyright Epic Games, Inc. All Rights Reserved.
import { Logger } from '../Logger/Logger';
import { MessageRecvTypes } from './MessageReceive';
import { MessagePong } from './MessageSend';
/**
 * Signalling protocol for handling messages from the signalling server.
 */
export class SignallingProtocol {
    constructor() {
        this.FromUEMessageHandlers = new Map();
    }
    addMessageHandler(messageId, messageHandler) {
        this.FromUEMessageHandlers.set(messageId, messageHandler);
    }
    handleMessage(messageId, messageData) {
        if (this.FromUEMessageHandlers.has(messageId)) {
            this.FromUEMessageHandlers.get(messageId)(messageData);
        }
        else {
            Logger.Error(Logger.GetStackTrace(), `Message type of ${messageId} does not have a message handler registered on the frontend - ignoring message.`);
        }
    }
    /**
     * Setup any default signalling message handling, these can be overridden or additional handlers added with `addMessageHandler`.
     * @param websocketController The controller to setup these handlers on.
     */
    static setupDefaultHandlers(websocketController) {
        // PING
        websocketController.signallingProtocol.addMessageHandler(MessageRecvTypes.PING, (pingPayload) => {
            // send our pong payload back to the signalling server
            const pongPayload = new MessagePong(new Date().getTime()).payload();
            Logger.Log(Logger.GetStackTrace(), MessageRecvTypes.PING + ': ' + pingPayload, 6);
            websocketController.webSocket.send(pongPayload);
        });
        // CONFIG
        websocketController.signallingProtocol.addMessageHandler(MessageRecvTypes.CONFIG, (configPayload) => {
            Logger.Log(Logger.GetStackTrace(), MessageRecvTypes.CONFIG, 6);
            const config = JSON.parse(configPayload);
            websocketController.onConfig(config);
        });
        // STREAMER_LIST
        websocketController.signallingProtocol.addMessageHandler(MessageRecvTypes.STREAMER_LIST, (listPayload) => {
            Logger.Log(Logger.GetStackTrace(), MessageRecvTypes.STREAMER_LIST, 6);
            const streamerList = JSON.parse(listPayload);
            websocketController.onStreamerList(streamerList);
        });
        // STREAMER_ID_CHANGED
        websocketController.signallingProtocol.addMessageHandler(MessageRecvTypes.STREAMER_ID_CHANGED, (idPayload) => {
            Logger.Log(Logger.GetStackTrace(), MessageRecvTypes.STREAMER_ID_CHANGED, 6);
            const streamerIdMessage = JSON.parse(idPayload);
            websocketController.onStreamerIDChanged(streamerIdMessage);
        });
        // PLAYER_COUNT
        websocketController.signallingProtocol.addMessageHandler(MessageRecvTypes.PLAYER_COUNT, (playerCountPayload) => {
            Logger.Log(Logger.GetStackTrace(), MessageRecvTypes.PLAYER_COUNT, 6);
            const playerCount = JSON.parse(playerCountPayload);
            Logger.Log(Logger.GetStackTrace(), 'Player Count: ' + playerCount.count, 6);
            websocketController.onPlayerCount(playerCount);
        });
        // ANSWER
        websocketController.signallingProtocol.addMessageHandler(MessageRecvTypes.ANSWER, (answerPayload) => {
            // send our pong payload back to the signalling server
            Logger.Log(Logger.GetStackTrace(), MessageRecvTypes.ANSWER, 6);
            const answer = JSON.parse(answerPayload);
            websocketController.onWebRtcAnswer(answer);
        });
        // OFFER
        websocketController.signallingProtocol.addMessageHandler(MessageRecvTypes.OFFER, (offerPayload) => {
            // send our pong payload back to the signalling server
            Logger.Log(Logger.GetStackTrace(), MessageRecvTypes.OFFER, 6);
            const offer = JSON.parse(offerPayload);
            websocketController.onWebRtcOffer(offer);
        });
        // ICE CANDIDATE
        websocketController.signallingProtocol.addMessageHandler(MessageRecvTypes.ICE_CANDIDATE, (iceCandidatePayload) => {
            // send our pong payload back to the signalling server
            Logger.Log(Logger.GetStackTrace(), MessageRecvTypes.ICE_CANDIDATE, 6);
            const iceCandidate = JSON.parse(iceCandidatePayload);
            websocketController.onIceCandidate(iceCandidate.candidate);
        });
        // WARNING
        websocketController.signallingProtocol.addMessageHandler(MessageRecvTypes.WARNING, (warningPayload) => {
            Logger.Warning(Logger.GetStackTrace(), `Warning received: ${warningPayload}`);
        });
        // PEER DATA CHANNELS
        websocketController.signallingProtocol.addMessageHandler(MessageRecvTypes.PEER_DATA_CHANNELS, (peerDataChannelsPayload) => {
            Logger.Log(Logger.GetStackTrace(), MessageRecvTypes.PEER_DATA_CHANNELS, 6);
            const peerDataChannels = JSON.parse(peerDataChannelsPayload);
            websocketController.onWebRtcPeerDataChannels(peerDataChannels);
        });
    }
}
//# sourceMappingURL=SignallingProtocol.js.map
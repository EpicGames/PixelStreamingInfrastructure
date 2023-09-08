// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '../Logger/Logger';
import { WebSocketController } from './WebSocketController';
import {
    MessageRecvTypes,
    MessageConfig,
    MessageStreamerList,
    MessagePlayerCount,
    MessageAnswer,
    MessageOffer,
    MessageIceCandidate,
    MessagePeerDataChannels
} from './MessageReceive';
import { MessagePong } from './MessageSend';

/**
 * Signalling protocol for handling messages from the signalling server.
 */
export class SignallingProtocol {
    private FromUEMessageHandlers: Map<string, (payload: string) => void>;

    constructor() {
        this.FromUEMessageHandlers = new Map<
            string,
            (payload: string) => void
        >();
    }

    addMessageHandler(
        messageId: string,
        messageHandler: (payload: string) => void
    ) {
        this.FromUEMessageHandlers.set(messageId, messageHandler);
    }

    handleMessage(messageId: string, messageData: string) {
        if (this.FromUEMessageHandlers.has(messageId)) {
            this.FromUEMessageHandlers.get(messageId)(messageData);
        } else {
            Logger.Error(
                Logger.GetStackTrace(),
                `Message type of ${messageId} does not have a message handler registered on the frontend - ignoring message.`
            );
        }
    }

    /**
     * Setup any default signalling message handling, these can be overridden or additional handlers added with `addMessageHandler`.
     * @param websocketController The controller to setup these handlers on.
     */
    static setupDefaultHandlers(websocketController: WebSocketController) {
        // PING
        websocketController.signallingProtocol.addMessageHandler(
            MessageRecvTypes.PING,
            (pingPayload: string) => {
                // send our pong payload back to the signalling server
                const pongPayload = new MessagePong(
                    new Date().getTime()
                ).payload();
                Logger.Log(
                    Logger.GetStackTrace(),
                    MessageRecvTypes.PING + ': ' + pingPayload,
                    6
                );
                websocketController.webSocket.send(pongPayload);
            }
        );

        // CONFIG
        websocketController.signallingProtocol.addMessageHandler(
            MessageRecvTypes.CONFIG,
            (configPayload: string) => {
                Logger.Log(Logger.GetStackTrace(), MessageRecvTypes.CONFIG, 6);
                const config: MessageConfig = JSON.parse(configPayload);
                websocketController.onConfig(config);
            }
        );

        // STREAMER_LIST
        websocketController.signallingProtocol.addMessageHandler(
            MessageRecvTypes.STREAMER_LIST,
            (listPayload: string) => {
                Logger.Log(
                    Logger.GetStackTrace(),
                    MessageRecvTypes.STREAMER_LIST,
                    6
                );
                const streamerList: MessageStreamerList =
                    JSON.parse(listPayload);
                websocketController.onStreamerList(streamerList);
            }
        );

        // PLAYER_COUNT
        websocketController.signallingProtocol.addMessageHandler(
            MessageRecvTypes.PLAYER_COUNT,
            (playerCountPayload: string) => {
                Logger.Log(
                    Logger.GetStackTrace(),
                    MessageRecvTypes.PLAYER_COUNT,
                    6
                );
                const playerCount: MessagePlayerCount =
                    JSON.parse(playerCountPayload);
                Logger.Log(
                    Logger.GetStackTrace(),
                    'Player Count: ' + playerCount.count,
                    6
                );
                websocketController.onPlayerCount(playerCount)
            }
        );

        // ANSWER
        websocketController.signallingProtocol.addMessageHandler(
            MessageRecvTypes.ANSWER,
            (answerPayload: string) => {
                // send our pong payload back to the signalling server
                Logger.Log(Logger.GetStackTrace(), MessageRecvTypes.ANSWER, 6);
                const answer: MessageAnswer = JSON.parse(answerPayload);
                websocketController.onWebRtcAnswer(answer);
            }
        );

        // OFFER
        websocketController.signallingProtocol.addMessageHandler(
            MessageRecvTypes.OFFER,
            (offerPayload: string) => {
                // send our pong payload back to the signalling server
                Logger.Log(Logger.GetStackTrace(), MessageRecvTypes.OFFER, 6);
                const offer: MessageOffer = JSON.parse(offerPayload);
                websocketController.onWebRtcOffer(offer);
            }
        );

        // ICE CANDIDATE
        websocketController.signallingProtocol.addMessageHandler(
            MessageRecvTypes.ICE_CANDIDATE,
            (iceCandidatePayload: string) => {
                // send our pong payload back to the signalling server
                Logger.Log(
                    Logger.GetStackTrace(),
                    MessageRecvTypes.ICE_CANDIDATE,
                    6
                );
                const iceCandidate: MessageIceCandidate =
                    JSON.parse(iceCandidatePayload);
                websocketController.onIceCandidate(iceCandidate.candidate);
            }
        );

        // WARNING
        websocketController.signallingProtocol.addMessageHandler(
            MessageRecvTypes.WARNING,
            (warningPayload: string) => {
                Logger.Warning(
                    Logger.GetStackTrace(),
                    `Warning received: ${warningPayload}`
                );
            }
        );

        // PEER DATA CHANNELS
        websocketController.signallingProtocol.addMessageHandler(
            MessageRecvTypes.PEER_DATA_CHANNELS,
            (peerDataChannelsPayload: string) => {
                Logger.Log(
                    Logger.GetStackTrace(),
                    MessageRecvTypes.PEER_DATA_CHANNELS,
                    6
                );
                const peerDataChannels: MessagePeerDataChannels = JSON.parse(
                    peerDataChannelsPayload
                );
                websocketController.onWebRtcPeerDataChannels(peerDataChannels);
            }
        );
    }
}

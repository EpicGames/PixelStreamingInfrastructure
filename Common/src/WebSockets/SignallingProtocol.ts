// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '../Logger/Logger';
import { ITransport } from '../Transport/ITransport';
import * as MessageReceive from './MessageReceive';
import * as MessageSend from './MessageSend';

/**
 * Signalling protocol for handling messages from the signalling server.
 */
export class SignallingProtocol {
    private transport: ITransport;
    private messageHandlers: Map<string, (msg: MessageReceive.MessageRecv) => void>;
    transportEvents: EventTarget;

    constructor(transport: ITransport) {
        this.transportEvents = new EventTarget();
        this.transport = transport;
        this.messageHandlers = new Map<string, (msg: MessageReceive.MessageRecv) => void>();

        transport.events.addEventListener('open', () => {
            this.transportEvents.dispatchEvent(new Event('open'));
        });
        transport.events.addEventListener('error', () => {
            this.transportEvents.dispatchEvent(new Event('error'));
        });
        transport.events.addEventListener('close', (event: CloseEvent) => {
            this.transportEvents.dispatchEvent(new CustomEvent('close', { detail: event }));
        });
        transport.onMessage = (msg: MessageReceive.MessageRecv) => {
            // auto handle ping messages
            if (msg.type == MessageReceive.MessageRecvTypes.PING) {
                const pongMessage = new MessageSend.MessagePong(new Date().getTime());
                transport.sendMessage(pongMessage);
            } else {
                // custom handlers
                if (this.messageHandlers.has(msg.type)) {
                    this.messageHandlers.get(msg.type)(msg);
                } else {
                    Logger.Error(
                        Logger.GetStackTrace(),
                        `Message type of ${msg.type} does not have a message handler registered on the frontend - ignoring message.`
                    );
                }
            }
        };
    }

    connect(url: string) {
        return this.transport.connect(url);
    }

    disconnect() {
        this.transport.disconnect();
    }

    isConnected() {
        return this.transport.isConnected();
    }

    sendMessage(msg: MessageSend.MessageSend) {
        this.transport.sendMessage(msg);
    }

    addMessageHandler(messageId: string, messageHandler: (msg: MessageReceive.MessageRecv) => void) {
        this.messageHandlers.set(messageId, messageHandler);
    }

    requestStreamerList() {
        const payload = new MessageSend.MessageListStreamers();
        this.transport.sendMessage(payload);
    }

    sendSubscribe(streamerid: string) {
        const payload = new MessageSend.MessageSubscribe(streamerid);
        this.transport.sendMessage(payload);
    }

    sendUnsubscribe() {
        const payload = new MessageSend.MessageUnsubscribe();
        this.transport.sendMessage(payload);
    }

    sendWebRtcOffer(offer: RTCSessionDescriptionInit, extraParams: MessageSend.ExtraOfferParameters) {
        const payload = new MessageSend.MessageWebRTCOffer(offer, extraParams);
        this.transport.sendMessage(payload);
    }

    sendWebRtcAnswer(answer: RTCSessionDescriptionInit, extraParams: MessageSend.ExtraAnswerParameters) {
        const payload = new MessageSend.MessageWebRTCAnswer(answer, extraParams);
        this.transport.sendMessage(payload);
    }

    sendWebRtcDatachannelRequest() {
        const payload = new MessageSend.MessageWebRTCDatachannelRequest();
        this.transport.sendMessage(payload);
    }

    sendSFURecvDataChannelReady() {
        const payload = new MessageSend.MessageSFURecvDataChannelReady();
        this.transport.sendMessage(payload);
    }

    sendIceCandidate(candidate: RTCIceCandidate) {
        const payload = new MessageSend.MessageIceCandidate(candidate);
        this.transport.sendMessage(payload);
    }
}

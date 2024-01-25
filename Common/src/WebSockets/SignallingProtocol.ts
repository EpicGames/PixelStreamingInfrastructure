// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '../Logger/Logger';
import { ITransport } from '../Transport/ITransport';
import * as MessageReceive from './MessageReceive';
import * as MessageSend from './MessageSend';
import { EventEmitter } from 'events';

/**
 * Signalling protocol for handling messages from the signalling server.
 */
export class SignallingProtocol {
    private transport: ITransport;

    /**
     * Listen on this emitter for transport events, open, close, error.
     */
    transportEvents: EventEmitter;

    /**
     * Listen on this emitter for messages. Message type is the name of the event to listen for.
     */
    messageHandlers: EventEmitter;

    constructor(transport: ITransport) {
        this.transport = transport;
        this.transportEvents = new EventEmitter();
        this.messageHandlers = new EventEmitter();

        transport.events.addListener('open', () => this.transportEvents.emit('open'));
        transport.events.addListener('error', () => this.transportEvents.emit('error'));
        transport.events.addListener('close', (event: CloseEvent) => this.transportEvents.emit('close', event));

        transport.onMessage = (msg: MessageReceive.MessageRecv) => {
            // auto handle ping messages
            if (msg.type == MessageReceive.MessageRecvTypes.PING) {
                const pongMessage = new MessageSend.MessagePong(new Date().getTime());
                transport.sendMessage(pongMessage);
            }
            // call the handlers
            this.messageHandlers.emit(msg.type, msg);
        };
    }

    /**
     * Asks the transport to connect to the given URL.
     */
    connect(url: string) {
        return this.transport.connect(url);
    }

    /**
     * Asks the transport to disconnect from any connection it might have.
     */
    disconnect() {
        this.transport.disconnect();
    }

    /**
     * Returns true if the transport is connected and ready to send/receive messages.
     */
    isConnected() {
        return this.transport.isConnected();
    }

    /**
     * Passes a message to the transport to send to the other end.
     */
    sendMessage(msg: MessageSend.MessageSend) {
        this.transport.sendMessage(msg);
    }

    // the following are just wrappers for sendMessage and should be deprioritized.
    
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

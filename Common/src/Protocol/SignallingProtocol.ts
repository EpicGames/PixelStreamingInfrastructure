// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '../Logger/Logger';
import { ITransport } from '../Transport/ITransport';
import { EventEmitter } from 'events';
import { BaseMessage } from '../Messages/base_message';
import * as Messages from '../Messages/signalling_messages';
import * as MessageHelpers from '../Messages/message_helpers';

/**
 * Signalling protocol for handling messages from the signalling server.
 */
export class SignallingProtocol {
    private transport: ITransport;

    /**
     * Listen on this emitter for transport events.
     * 
     * Events emitted:
     *   open:
     *      Emitted when the transport connection opens and is ready to handle messages.
     * 
     *   error:
     *      Emitted when there is an error on the transport has an error and must close.
     * 
     *   close:
     *      Emitted when the transport connection closes and can no longer send or
     *      receive messages. Will also be emitted after an error.
     * 
     *   message:
     *      Emitted any time a message is received by the transport. Listen on this if
     *      you wish to capture all messages, rather than specific messages on
     *      'messageHandlers'.
     */
    transportEvents: EventEmitter;

    /**
     * Listen on this emitter for messages. Message type is the name of the event to listen for.
     * 
     * Example:
     *      messageHandlers.addListener('config', (message: Messages.config) => console.log(`Got a config message: ${message}`)));
     */
    messageHandlers: EventEmitter;

    constructor(transport: ITransport) {
        this.transport = transport;
        this.transportEvents = new EventEmitter();
        this.messageHandlers = new EventEmitter();

        transport.events.addListener('open', (event: Event) => this.transportEvents.emit('open', event));
        transport.events.addListener('error', (event: Event) => this.transportEvents.emit('error', event));
        transport.events.addListener('close', (event: CloseEvent) => this.transportEvents.emit('close', event));

        transport.onMessage = (msg: BaseMessage) => {
            // auto handle ping messages
            if (msg.type == Messages.ping.typeName) {
                const pongMessage = MessageHelpers.createMessage(Messages.pong, { time: new Date().getTime() });
                transport.sendMessage(pongMessage);
            }
            
            // call the handlers
            this.messageHandlers.emit(msg.type, msg);  // emit this for listeners listening for specific messages
            this.transportEvents.emit('message', msg); // emit this for listeners listening to any message
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
    sendMessage(msg: BaseMessage) {
        this.transport.sendMessage(msg);
    }

    // the following are just wrappers for sendMessage and should be deprioritized.
    
    requestStreamerList() {
        const payload = MessageHelpers.createMessage(Messages.listStreamers);
        this.transport.sendMessage(payload);
    }

    sendSubscribe(streamerid: string) {
        const payload = MessageHelpers.createMessage(Messages.subscribe, { streamerid: streamerid });
        this.transport.sendMessage(payload);
    }

    sendUnsubscribe() {
        const payload = MessageHelpers.createMessage(Messages.unsubscribe);
        this.transport.sendMessage(payload);
    }

    sendWebRtcOffer(extraParams: any) {
        const payload = MessageHelpers.createMessage(Messages.offer, extraParams);
        this.transport.sendMessage(payload);
    }

    sendWebRtcAnswer(extraParams: any) {
        const payload = MessageHelpers.createMessage(Messages.answer, extraParams);
        this.transport.sendMessage(payload);
    }

    sendWebRtcDatachannelRequest() {
        const payload = MessageHelpers.createMessage(Messages.dataChannelRequest);
        this.transport.sendMessage(payload);
    }

    sendSFURecvDataChannelReady() {
        const payload = MessageHelpers.createMessage(Messages.peerDataChannelsReady);
        this.transport.sendMessage(payload);
    }

    sendIceCandidate(candidate: RTCIceCandidate) {
        const payload = MessageHelpers.createMessage(Messages.iceCandidate, { candidate: candidate });
        this.transport.sendMessage(payload);
    }
}

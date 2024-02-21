// Copyright Epic Games, Inc. All Rights Reserved.

import { ITransport } from '../Transport/ITransport';
import { EventEmitter } from 'events';
import { BaseMessage } from '../Messages/base_message';
import * as Messages from '../Messages/signalling_messages';
import * as MessageHelpers from '../Messages/message_helpers';

/**
 * Signalling protocol for handling messages from the signalling server.
 * 
 * Listen on this emitter for messages. Message type is the name of the event to listen for.
 * Example:
 *      signallingProtocol.on('config', (message: Messages.config) => console.log(`Got a config message: ${message}`)));
 * 
 * The transport in this class will also emit on message events.
 * 
 * Events emitted on transport:
 *   message:
 *      Emitted any time a message is received by the transport. Listen on this if
 *      you wish to capture all messages, rather than specific messages on
 *      'messageHandlers'.
 * 
 *   out:
 *      Emitted when sending a message out on the transport. Similar to 'message' but
 *      only for when messages are sent from this endpoint. Useful for debugging.
 */
export class SignallingProtocol extends EventEmitter {
    static get SIGNALLING_VERSION(): string { return '1.0'; }

    transport: ITransport;

    constructor(transport: ITransport) {
        super();
        this.transport = transport;

        transport.onMessage = (msg: BaseMessage) => {
            // auto handle ping messages
            if (msg.type == Messages.ping.typeName) {
                const pongMessage = MessageHelpers.createMessage(Messages.pong, { time: new Date().getTime() });
                transport.sendMessage(pongMessage);
            }
            
            // call the handlers
            transport.emit('message', msg); // emit this for listeners listening to any message
            this.emit(msg.type, msg);  // emit this for listeners listening for specific messages
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
    disconnect(code?: number, reason?: string) {
        this.transport.disconnect(code, reason);
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
        this.transport.emit('out', msg); // emit this for listeners listening to outgoing messages
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

    sendWebRtcOffer(extraParams: object) {
        const payload = MessageHelpers.createMessage(Messages.offer, extraParams);
        this.transport.sendMessage(payload);
    }

    sendWebRtcAnswer(extraParams: object) {
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

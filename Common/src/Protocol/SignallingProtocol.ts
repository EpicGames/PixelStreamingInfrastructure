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
 *      ```
 *      signallingProtocol.on('config', (message: Messages.config) => console.log(`Got a config message: ${message}`)));
 *      ```
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

    // The transport in use by this protocol object.
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
     * @param url - The url to connect to.
     * @returns True if the connection call succeeded.
     */
    connect(url: string): boolean {
        return this.transport.connect(url);
    }

    /**
     * Asks the transport to disconnect from any connection it might have.
     * @param code - An optional disconnection code.
     * @param reason - An optional descriptive string for the disconnect reason.
     */
    disconnect(code?: number, reason?: string): void {
        this.transport.disconnect(code, reason);
    }

    /**
     * Returns true if the transport is connected and ready to send/receive messages.
     * @returns True if the protocol is connected.
     */
    isConnected(): boolean {
        return this.transport.isConnected();
    }

    /**
     * Passes a message to the transport to send to the other end.
     * @param msg - The message to send.
     */
    sendMessage(msg: BaseMessage): void {
        this.transport.sendMessage(msg);
        this.transport.emit('out', msg); // emit this for listeners listening to outgoing messages
    }

    // the following are just wrappers for sendMessage and should be deprioritized.
    
    requestStreamerList(): void {
        const payload = MessageHelpers.createMessage(Messages.listStreamers);
        this.transport.sendMessage(payload);
    }

    sendSubscribe(streamerid: string): void {
        const payload = MessageHelpers.createMessage(Messages.subscribe, { streamerid: streamerid });
        this.transport.sendMessage(payload);
    }

    sendUnsubscribe(): void {
        const payload = MessageHelpers.createMessage(Messages.unsubscribe);
        this.transport.sendMessage(payload);
    }

    sendWebRtcOffer(extraParams: object): void {
        const payload = MessageHelpers.createMessage(Messages.offer, extraParams);
        this.transport.sendMessage(payload);
    }

    sendWebRtcAnswer(extraParams: object): void {
        const payload = MessageHelpers.createMessage(Messages.answer, extraParams);
        this.transport.sendMessage(payload);
    }

    sendWebRtcDatachannelRequest(): void {
        const payload = MessageHelpers.createMessage(Messages.dataChannelRequest);
        this.transport.sendMessage(payload);
    }

    sendSFURecvDataChannelReady(): void {
        const payload = MessageHelpers.createMessage(Messages.peerDataChannelsReady);
        this.transport.sendMessage(payload);
    }

    sendIceCandidate(candidate: RTCIceCandidate): void {
        const payload = MessageHelpers.createMessage(Messages.iceCandidate, { candidate: candidate });
        this.transport.sendMessage(payload);
    }
}

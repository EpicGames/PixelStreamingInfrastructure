import { BaseMessage } from '../Messages/base_message';
import { EventEmitter } from 'events';

/**
 * An interface to a transport protocol that is in charge of sending and receiving signalling messages.
 * Implement this interface to support your custom transport. You can then supply an instance of your
 * transport to the constructor of SignallingProtocol during startup.
 */
export interface ITransport {
    /**
     * Dispatch open/error/close events on this to indicate transport events to the protocol.
     */
    events: EventEmitter;

    /**
     * Called when the protocol wants to send a message over the transport.
     */
    sendMessage(msg: BaseMessage): void;

    /**
     * Callback filled in by the SignallingProtocol and should be called by the transport when a new message arrives.
     */
    onMessage: (msg: BaseMessage) => void;

    /**
     * Connect to a given URL.
     */
    connect(url: string): boolean;

    /**
     * Disconnect this transport.
     */
    disconnect(code?: number, reason?: string): void;

    /**
     * Should return true when the transport is connected and ready to send/receive messages.
     */
    isConnected(): boolean;
}


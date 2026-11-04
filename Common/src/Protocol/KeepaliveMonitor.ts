// Copyright Epic Games, Inc. All Rights Reserved.
import * as Messages from '../Messages/signalling_messages';
import * as MessageHelpers from '../Messages/message_helpers';
import { SignallingProtocol } from './SignallingProtocol';

/**
 * Used to regularly ping a protocol connection to make sure the connection is still good and open.
 * When the pong doesn't come in response to a ping in time a callback is fired that can be handed
 * by the owner.
 */
export class KeepaliveMonitor {
    private protocol: SignallingProtocol;
    private timeout: number;
    private keepalive?: ReturnType<typeof setInterval>;
    private alive: boolean = false;
    private rtt: number = 0;

    // naming a bound function so we can add and then remove it with on and off.
    private onResponse: (pongMsg: Messages.pong) => void;

    /**
     * Called when a pong does not come back from a ping.
     */
    onTimeout?: () => void;

    /**
     * Gets the Round Trip Time of the current connection in milliseconds.
     */
    get RTT(): number {
        return this.rtt;
    }

    /**
     * Creates a new monitor and starts the ping timer. If a pong does not come back by the time we want
     * to send a second ping then the connection is considered dead and the onTimeout callback is fired.
     * @param protocol - The connection that we want to monitor.
     * @param timeout - The time in milliseconds between ping messages.
     */
    constructor(protocol: SignallingProtocol, timeout: number) {
        this.protocol = protocol;
        this.timeout = timeout;
        this.onResponse = this.onHeartbeatResponse.bind(this);
        this.protocol.transport.on('close', this.stop.bind(this));
        this.start();
    }

    private start(): void {
        this.alive = true;
        this.protocol.on('pong', this.onResponse);
        this.keepalive = setInterval(this.sendHeartbeat.bind(this), this.timeout);
    }

    private stop(): void {
        clearInterval(this.keepalive);
        this.protocol.off('pong', this.onResponse);
    }

    private sendHeartbeat(): void {
        // if we never got a response from the last heartbeat, assume the connection is dead and timeout
        if (this.alive === false) {
            // Stop first, so a consumer that keeps the socket open is told once rather than on every tick.
            this.stop();
            this.onTimeout?.();
            return;
        }

        // mark the connection as temporarily dead until we get a response from the ping
        this.alive = false;
        this.protocol.sendMessage(
            MessageHelpers.createMessage(Messages.ping, { time: new Date().getTime() })
        );
    }

    private onHeartbeatResponse(pongMsg: Messages.pong): void {
        // we got a pong response from the other side, the connection is good.
        // we also store the round trip time if anyone is curious
        this.rtt = new Date().getTime() - pongMsg.time;
        this.alive = true;
    }
}

// Copyright Epic Games, Inc. All Rights Reserved.
import type { IncomingMessage } from 'http';
import WebSocket from 'ws';
import {
    ITransport,
    WebSocketTransportNJS,
    SignallingProtocol,
    MessageHelpers,
    Messages,
    BaseMessage
} from '@epicgames-ps/lib-pixelstreamingcommon-ue5.8';
import { IPlayer, IPlayerInfo } from './PlayerRegistry';
import { IStreamer } from './StreamerRegistry';
import { Logger } from './Logger';
import * as LogUtils from './LoggingUtils';
import { SignallingServer } from './SignallingServer';

/**
 * A connection between the signalling server and a player connection.
 * This is where messages expected to be handled by the player come in
 * and where messages are sent to the player.
 *
 * Interesting internals:
 * playerId: The unique id string of this player.
 * transport: The ITransport where transport events can be subscribed to
 * protocol: The SignallingProtocol where signalling messages can be
 * subscribed to.
 */
export class PlayerConnection implements IPlayer, LogUtils.IMessageLogger {
    // The unique id of this player connection.
    playerId: string;
    // The websocket transport used by this connection.
    transport: ITransport;
    // The protocol abstraction on this connection. Used for sending/receiving signalling messages.
    protocol: SignallingProtocol;
    // When the player is subscribed to a streamer this will be the streamer being subscribed to.
    subscribedStreamer: IStreamer | null;
    // A descriptive string describing the remote address of this connection.
    remoteAddress?: string;
    // The HTTP upgrade request that opened this connection, if available.
    request?: IncomingMessage;

    private server: SignallingServer;
    private streamerIdChangeListener: (newId: string) => void;
    private streamerDisconnectedListener: () => void;

    /**
     * Initializes a new connection with given and sane values. Adds listeners for the
     * websocket close and error so it can react by unsubscribing and resetting itself.
     * @param server - The signalling server object that spawned this player.
     * @param ws - The websocket coupled to this player connection.
     * @param remoteAddress - The remote address of this connection. Only used as display.
     * @param request - The HTTP upgrade request that opened this connection, if available.
     */
    constructor(server: SignallingServer, ws: WebSocket, remoteAddress?: string, request?: IncomingMessage) {
        this.server = server;
        this.playerId = '';
        this.subscribedStreamer = null;
        this.transport = new WebSocketTransportNJS(ws);
        this.protocol = new SignallingProtocol(this.transport);
        this.remoteAddress = remoteAddress;
        this.request = request;

        this.transport.on('error', this.onTransportError.bind(this));
        this.transport.on('close', this.onTransportClose.bind(this));

        this.streamerIdChangeListener = this.onStreamerIdChanged.bind(this);
        this.streamerDisconnectedListener = this.onStreamerDisconnected.bind(this);

        this.registerMessageHandlers();
    }

    /**
     * Returns an identifier that is displayed in logs.
     * @returns A string describing this connection.
     */
    getReadableIdentifier(): string {
        return this.playerId;
    }

    /**
     * Sends a signalling message to the player.
     * @param message - The message to send.
     */
    sendMessage(message: BaseMessage): void {
        LogUtils.logOutgoing(this, message);
        this.protocol.sendMessage(message);
    }

    /**
     * Returns a descriptive object for the REST API inspection operations.
     * @returns An IPlayerInfo object containing viewable information about this connection.
     */
    getPlayerInfo(): IPlayerInfo {
        return {
            playerId: this.playerId,
            type: 'Player',
            subscribedTo: this.subscribedStreamer?.streamerId,
            remoteAddress: this.remoteAddress
        };
    }

    private registerMessageHandlers(): void {
        /* eslint-disable @typescript-eslint/unbound-method */
        this.protocol.on(
            Messages.subscribe.typeName,
            LogUtils.createHandlerListener(this, this.onSubscribeMessage)
        );
        this.protocol.on(
            Messages.unsubscribe.typeName,
            LogUtils.createHandlerListener(this, this.onUnsubscribeMessage)
        );
        this.protocol.on(
            Messages.listStreamers.typeName,
            LogUtils.createHandlerListener(this, this.onListStreamers)
        );
        this.protocol.on(Messages.ping.typeName, LogUtils.createHandlerListener(this, this.onPingMessage));
        /* eslint-enable @typescript-eslint/unbound-method */

        this.protocol.on(Messages.offer.typeName, this.sendToStreamer.bind(this));
        this.protocol.on(Messages.answer.typeName, this.sendToStreamer.bind(this));
        this.protocol.on(Messages.iceCandidate.typeName, this.sendToStreamer.bind(this));
        this.protocol.on(Messages.dataChannelRequest.typeName, this.sendToStreamer.bind(this));
        this.protocol.on(Messages.peerDataChannelsReady.typeName, this.sendToStreamer.bind(this));
        this.protocol.on(Messages.layerPreference.typeName, this.sendToStreamer.bind(this));

        this.protocol.on('unhandled', (message: BaseMessage) => {
            Logger.warn(`Unhandled player protocol message: ${JSON.stringify(message)}`);
        });
    }

    private sendToStreamer(message: BaseMessage): void {
        if (!this.subscribedStreamer) {
            Logger.warn(
                `Player ${this.playerId} tried to send to a streamer but they're not subscribed to any.`
            );
            const streamerId = this.server.streamerRegistry.getFirstStreamerId();
            if (!streamerId) {
                Logger.error('There are no streamers to force a subscription. Disconnecting.');
                this.disconnect();
                return;
            } else {
                Logger.warn(`Subscribing to ${streamerId}`);
                this.subscribe(streamerId);
            }
        }

        message.playerId = this.playerId;
        LogUtils.logForward(this, this.subscribedStreamer!, message);
        this.subscribedStreamer!.protocol.sendMessage(message);
    }

    private subscribe(streamerId: string) {
        const streamer = this.server.streamerRegistry.find(streamerId);
        if (!streamer) {
            Logger.error(
                `subscribe: Player ${this.playerId} tried to subscribe to a non-existent streamer ${streamerId}`
            );
            const failureMessage = MessageHelpers.createMessage(Messages.subscribeFailed, {
                message: `Streamer ${streamerId} does not exist.`
            });
            this.protocol.sendMessage(failureMessage);
            return;
        }

        if (this.subscribedStreamer) {
            Logger.warn(
                `subscribe: Player ${this.playerId} is resubscribing to a streamer but is already subscribed to ${this.subscribedStreamer.streamerId}`
            );
            this.unsubscribe();
        }

        if (streamer.maxSubscribers > 0 && streamer.subscribers.size >= streamer.maxSubscribers) {
            Logger.error(
                `subscribe: Player ${this.playerId} could not subscribe to ${streamerId}. Max players (${streamer.maxSubscribers}) reached.`
            );
            const failureMessage = MessageHelpers.createMessage(Messages.subscribeFailed, {
                message: `Streamer ${streamerId} is full. Max players = ${streamer.maxSubscribers}.`
            });
            this.protocol.sendMessage(failureMessage);
            return;
        }

        this.subscribedStreamer = streamer;
        this.subscribedStreamer.subscribers.add(this.playerId);
        this.subscribedStreamer.on('id_changed', this.streamerIdChangeListener);
        this.subscribedStreamer.on('disconnect', this.streamerDisconnectedListener);

        const connectedMessage = MessageHelpers.createMessage(Messages.playerConnected, {
            playerId: this.playerId,
            dataChannel: true,
            sfu: false
        });
        this.sendToStreamer(connectedMessage);
    }

    private unsubscribe() {
        if (!this.subscribedStreamer) {
            return;
        }

        this.subscribedStreamer.subscribers.delete(this.playerId);

        const disconnectedMessage = MessageHelpers.createMessage(Messages.playerDisconnected, {
            playerId: this.playerId
        });
        this.sendToStreamer(disconnectedMessage);

        this.subscribedStreamer.off('id_changed', this.streamerIdChangeListener);
        this.subscribedStreamer.off('disconnect', this.streamerDisconnectedListener);
        this.subscribedStreamer = null;
    }

    private disconnect() {
        this.unsubscribe();
        this.protocol.disconnect();
    }

    private onStreamerDisconnected(): void {
        this.disconnect();
    }

    private onTransportError(error: ErrorEvent): void {
        Logger.error(`Player (${this.playerId}) transport error ${error.message}`);
    }

    private onTransportClose(_event: CloseEvent): void {
        Logger.debug('PlayerConnection transport close.');
        this.disconnect();
    }

    private onSubscribeMessage(message: Messages.subscribe): void {
        this.subscribe(message.streamerId);
    }

    private onUnsubscribeMessage(_message: Messages.unsubscribe): void {
        this.unsubscribe();
    }

    private onListStreamers(_message: Messages.listStreamers): void {
        const listMessage = MessageHelpers.createMessage(Messages.streamerList, {
            ids: this.server.streamerRegistry.streamers
                .filter((streamer) => streamer.streaming)
                .map((streamer) => streamer.streamerId)
        });
        this.sendMessage(listMessage);
    }

    private onStreamerIdChanged(newId: string) {
        const renameMessage = MessageHelpers.createMessage(Messages.streamerIdChanged, { newID: newId });
        this.sendMessage(renameMessage);
    }

    private onPingMessage(message: Messages.ping): void {
        this.sendMessage(MessageHelpers.createMessage(Messages.pong, { time: message.time }));
    }
}

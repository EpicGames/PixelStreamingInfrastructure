import WebSocket from 'ws';
import { ITransport,
         SignallingProtocol,
         WebSocketTransportNJS,
         BaseMessage,
         Messages,
         MessageHelpers } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { IStreamer, IStreamerInfo } from './StreamerRegistry';
import { EventEmitter } from 'events';
import { stringify } from './Utils';
import { Logger } from './Logger';
import * as LogUtils from './LoggingUtils';
import { SignallingServer } from './SignallingServer';

/**
 * A connection between the signalling server and a streamer connection.
 * This is where messages expected to be handled by the streamer come in
 * and where messages are sent to the streamer.
 * 
 * Interesting internals:
 * streamerId: The unique id string of this streamer.
 * transport: The ITransport where transport events can be subscribed to
 * protocol: The SignallingProtocol where signalling messages can be
 * subscribed to.
 * streaming: True when the streamer is ready to accept subscriptions.
 */
export class StreamerConnection extends EventEmitter implements IStreamer, LogUtils.IMessageLogger {
    private server: SignallingServer;
    streamerId: string;
    transport: ITransport;
    protocol: SignallingProtocol;
    streaming: boolean;
    remoteAddress?: string;

    /**
     * Initializes a new connection with given and sane values. Adds listeners for the
     * websocket close and error and will emit a disconnected event when disconneted.
     * @param server - The signalling server object that spawned this streamer.
     * @param ws - The websocket coupled to this streamer connection.
     * @param remoteAddress - The remote address of this connection. Only used as display.
     */
    constructor(server: SignallingServer, ws: WebSocket, remoteAddress?: string) {
        super();

        this.server = server;
        this.streamerId = '';
        this.transport = new WebSocketTransportNJS(ws);
        this.protocol = new SignallingProtocol(this.transport);
        this.streaming = false;
        this.remoteAddress = remoteAddress;

        this.transport.on('error', this.onTransportError.bind(this));
        this.transport.on('close', this.onTransportClose.bind(this));

        this.registerMessageHandlers();
    }

    /**
     * Returns an identifier that is displayed in logs.
     * @returns A string describing this connection.
     */
    getReadableIdentifier(): string { return this.streamerId; }

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
     * @returns An IStreamerInfo object containing viewable information about this connection.
     */
    getStreamerInfo(): IStreamerInfo {
        return {
            streamerId: this.streamerId,
            type: 'Streamer',
            streaming: this.streaming,
            remoteAddress: this.remoteAddress,
            subscribers: this.server.playerRegistry.listPlayers().filter(player => player.subscribedStreamer == this).map(player => player.getPlayerInfo()),
        };
    }

    private registerMessageHandlers(): void {
        this.protocol.on(Messages.endpointId.typeName, LogUtils.createHandlerListener(this, this.onEndpointId));
        this.protocol.on(Messages.ping.typeName, LogUtils.createHandlerListener(this, this.onPing));
        this.protocol.on(Messages.disconnectPlayer.typeName, LogUtils.createHandlerListener(this, this.onDisconnectPlayerRequest));
        this.protocol.on(Messages.layerPreference.typeName, LogUtils.createHandlerListener(this, this.onLayerPreference));

        this.protocol.on(Messages.offer.typeName, this.forwardMessage.bind(this));
        this.protocol.on(Messages.answer.typeName, this.forwardMessage.bind(this));
        this.protocol.on(Messages.iceCandidate.typeName, this.forwardMessage.bind(this));
    }

    private forwardMessage(message: BaseMessage): void {
        if (!message.playerId) {
            Logger.warn(`No playerId specified, cannot forward message: ${stringify(message)}`);
        } else {
            const player = this.server.playerRegistry.get(message.playerId);
            if (player) {
                delete message.playerId;
                LogUtils.logForward(this, player, message);
                player.protocol.sendMessage(message);
            }
        }
    }

    private onTransportError(error: ErrorEvent): void {
        Logger.error(`Streamer (${this.streamerId}) transport error ${error}`);
    }

    private onTransportClose(): void {
        Logger.debug('StreamerConnection transport close.');
        this.emit('disconnect');
    }

    private onEndpointId(_message: Messages.endpointId): void {
        this.streaming = true; // we're ready to stream when we id ourselves
    }

    private onPing(message: Messages.ping): void {
        this.sendMessage(MessageHelpers.createMessage(Messages.pong, { time: message.time }));
    }

    private onDisconnectPlayerRequest(message: Messages.disconnectPlayer): void {
        if (message.playerId) {
            const player = this.server.playerRegistry.get(message.playerId);
            if (player) {
                player.protocol.disconnect(1011, message.reason);
            }
        }
    }

    private onLayerPreference(message: Messages.layerPreference): void {
        this.emit('layer_preference', message);
    }
}

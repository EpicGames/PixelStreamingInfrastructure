import WebSocket from 'ws';
import http from 'http';
import { ITransport,
         WebSocketTransportNJS,
         SignallingProtocol,
         MessageHelpers,
         Messages,
         BaseMessage } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
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
    private server: SignallingServer;
    playerId: string;
    transport: ITransport;
    protocol: SignallingProtocol;
    subscribedStreamer: IStreamer | null;
    remoteAddress: string | undefined;

    private sendOffer: boolean;
    private streamerIdChangeListener: (newId: string) => void;
    private streamerDisconnectedListener: () => void;

    /**
     * Construct a new player connection.
     * @param server The signalling server object that spawned this player.
     * @param ws The websocket coupled to this player connection.
     * @param sendOffer True if the player is requesting to receive offers
     * from streamers.
     */
    constructor(server: SignallingServer, ws: WebSocket, request: http.IncomingMessage, sendOffer: boolean) {
        this.server = server;
        this.playerId = '';
        this.subscribedStreamer = null;
        this.transport = new WebSocketTransportNJS(ws);
        this.protocol = new SignallingProtocol(this.transport);
        this.sendOffer = sendOffer;
        this.remoteAddress = request.socket.remoteAddress;

        this.transport.on('error', this.onTransportError.bind(this));
        this.transport.on('close', this.onTransportClose.bind(this));

        this.streamerIdChangeListener = this.onStreamerIdChanged.bind(this);
        this.streamerDisconnectedListener = this.onStreamerDisconnected.bind(this);

        this.registerMessageHandlers();
    }

    getReadableIdentifier(): string { return this.playerId; }

    /**
     * Sends a signalling message to the player.
     */
    sendMessage(message: BaseMessage): void {
        LogUtils.logOutgoing(this, message);
        this.protocol.sendMessage(message);
    }

    getPlayerInfo(): IPlayerInfo {
        return {
            playerId: this.playerId,
            type: 'Player',
            subscribedTo: this.subscribedStreamer?.streamerId,
            sendOffer: this.sendOffer,
            remoteAddress: this.remoteAddress,
        };
    }

    private registerMessageHandlers(): void {
        this.protocol.on(Messages.subscribe.typeName, LogUtils.createHandlerListener(this, this.onSubscribeMessage));
        this.protocol.on(Messages.unsubscribe.typeName, LogUtils.createHandlerListener(this, this.onUnsubscribeMessage));
        this.protocol.on(Messages.listStreamers.typeName, LogUtils.createHandlerListener(this, this.onListStreamers));

        this.protocol.on(Messages.offer.typeName, this.sendToStreamer.bind(this));
        this.protocol.on(Messages.answer.typeName, this.sendToStreamer.bind(this));
        this.protocol.on(Messages.iceCandidate.typeName, this.sendToStreamer.bind(this));
        this.protocol.on(Messages.dataChannelRequest.typeName, this.sendToStreamer.bind(this));
        this.protocol.on(Messages.peerDataChannelsReady.typeName, this.sendToStreamer.bind(this));
    }

    private sendToStreamer(message: BaseMessage): void {
        if (!this.subscribedStreamer) {
            Logger.warn(`Player ${this.playerId} tried to send to a streamer but they're not subscribed to any.`);
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

        LogUtils.logForward(this, this.subscribedStreamer!, message);
        message.playerId = this.playerId;
        this.subscribedStreamer!.protocol.sendMessage(message);
    }

    private subscribe(streamerId: string) {
        const streamer = this.server.streamerRegistry.find(streamerId);
        if (!streamer) {
            Logger.error(`subscribe: Player ${this.playerId} tried to subscribe to a non-existent streamer ${streamerId}`);
            return;
        }

        if (this.subscribedStreamer) {
            Logger.warn(`subscribe: Player ${this.playerId} is resubscribing to a streamer but is already subscribed to ${this.subscribedStreamer.streamerId}`);
            this.unsubscribe();
        }

        this.subscribedStreamer = streamer;
        this.subscribedStreamer.on('id_changed', this.streamerIdChangeListener);
        this.subscribedStreamer.on('disconnect', this.streamerDisconnectedListener);

        const connectedMessage = MessageHelpers.createMessage(Messages.playerConnected, { playerId: this.playerId,
                                                                                          dataChannel: true,
                                                                                          sfu: false,
                                                                                          sendOffer: this.sendOffer });
        this.sendToStreamer(connectedMessage);
    }

    private unsubscribe() {
        if (!this.subscribedStreamer) {
            return;
        }

        const disconnectedMessage = MessageHelpers.createMessage(Messages.playerDisconnected, { playerId: this.playerId });
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
        Logger.error(`Player (${this.playerId}) transport error ${error}`);
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
        const listMessage = MessageHelpers.createMessage(Messages.streamerList, { ids: this.server.streamerRegistry.streamers.map(streamer => streamer.streamerId) });
        this.sendMessage(listMessage);
    }

    private onStreamerIdChanged(newId: string) {
        const renameMessage = MessageHelpers.createMessage(Messages.streamerIdChanged, { newID: newId });
        this.sendMessage(renameMessage);
    }

    private onStreamerRemoved() {
        this.disconnect();
    }
}

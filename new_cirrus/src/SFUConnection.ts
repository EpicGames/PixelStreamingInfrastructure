import WebSocket from 'ws';
import http from 'http';
import { ITransport,
		 WebSocketTransportNJS,
		 SignallingProtocol,
		 MessageHelpers,
		 Messages,
		 BaseMessage } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { IPlayer, IPlayerInfo } from './PlayerRegistry';
import { IStreamer, IStreamerInfo } from './StreamerRegistry';
import { EventEmitter } from 'events';
import { Logger } from './Logger';
import * as LogUtils from './LoggingUtils';
import { SignallingServer } from './SignallingServer';

/**
 * A SFU connection to the signalling server.
 * An SFU can act as both a streamer and a player. It can subscribe to
 * streamers like a player, and other players can subscribe to the sfu.
 * Therefore the SFU will have a streamer id and a player id and be
 * registered in both streamer registries and player registries.
 * 
 * Interesting internals:
 * playerId: The player id of this connectiom.
 * streamerId: The streamer id of this connection.
 * transport: The ITransport where transport events can be subscribed to
 * protocol: The SignallingProtocol where signalling messages can be
 * subscribed to.
 * streaming: True when the streamer is ready to accept subscriptions.
 */
export class SFUConnection extends EventEmitter implements IPlayer, IStreamer, LogUtils.IMessageLogger {
	private server: SignallingServer;
	transport: ITransport;
	protocol: SignallingProtocol;
	playerId: string;
	streamerId: string;
	streaming: boolean;
	remoteAddress: string | undefined;
	subscribedStreamer: IStreamer | null;

	private layerPreferenceListener: (message: Messages.layerPreference) => void;
	private streamerIdChangeListener: (newId: string) => void;
	private streamerDisconnectedListener: () => void;

	/**
	 * Construct a new SFU connection.
	 * @param server The signalling server object that spawned this sfu.
	 * @param ws The websocket coupled to this sfu connection.
	 */
	constructor(server: SignallingServer, ws: WebSocket, request: http.IncomingMessage) {
		super();

		this.server = server;
		this.transport = new WebSocketTransportNJS(ws);
		this.protocol = new SignallingProtocol(this.transport);
		this.playerId = '';
		this.streamerId = '';
		this.streaming = false;
		this.remoteAddress = request.socket.remoteAddress;
		this.subscribedStreamer = null;

		this.transport.on('error', this.onTransportError.bind(this));
		this.transport.on('close', this.onTransportClose.bind(this));

		this.layerPreferenceListener = this.onLayerPreference.bind(this);
		this.streamerIdChangeListener = this.onStreamerIdChanged.bind(this);
		this.streamerDisconnectedListener = this.onStreamerDisconnected.bind(this);

		this.registerMessageHandlers();
	}

	getReadableIdentifier(): string { return `(${this.streamerId}:${this.playerId})`; }

	/**
	 * Sends a signalling message to the player.
	 */
	sendMessage(message: BaseMessage): void {
		LogUtils.logOutgoing(this, message);
		this.protocol.sendMessage(message);
	}

	getStreamerInfo(): IStreamerInfo {
		return {
			streamerId: this.streamerId,
			type: 'SFU',
			streaming: this.streaming,
			remoteAddress: this.remoteAddress,
			subscribers: this.server.playerRegistry.listPlayers().filter(player => player.subscribedStreamer == this).map(player => player.getPlayerInfo()),
		};
	}

	getPlayerInfo(): IPlayerInfo {
		return {
			playerId: this.playerId,
			type: 'SFU',
			remoteAddress: this.remoteAddress,
			subscribedTo: this.subscribedStreamer?.streamerId,
			sendOffer: true,
		};
	}

	private registerMessageHandlers(): void {
		this.protocol.on(Messages.subscribe.typeName, LogUtils.createHandlerListener(this, this.onSubscribeMessage));
		this.protocol.on(Messages.unsubscribe.typeName, LogUtils.createHandlerListener(this, this.onUnsubscribeMessage));
		this.protocol.on(Messages.listStreamers.typeName, LogUtils.createHandlerListener(this, this.onListStreamers));
		this.protocol.on(Messages.endpointId.typeName, LogUtils.createHandlerListener(this, this.onEndpointId));
		this.protocol.on(Messages.streamerDataChannels.typeName, LogUtils.createHandlerListener(this, this.onStreamerDataChannels));
		this.protocol.on(Messages.startStreaming.typeName, LogUtils.createHandlerListener(this, this.onStartStreaming));
		this.protocol.on(Messages.stopStreaming.typeName, LogUtils.createHandlerListener(this, this.onStopStreaming));

		this.protocol.on(Messages.offer.typeName, this.sendToPlayer.bind(this));
		this.protocol.on(Messages.answer.typeName, this.sendToStreamer.bind(this));
		this.protocol.on(Messages.peerDataChannels.typeName, this.sendToPlayer.bind(this));
	}

	private subscribe(streamerId: string) {
		let streamer = this.server.streamerRegistry.find(streamerId);
		if (!streamer) {
			Logger.error(`subscribe: SFU ${this.playerId} tried to subscribe to a non-existent streamer ${streamerId}`);
			return;
		}

		this.subscribedStreamer = streamer;
		this.subscribedStreamer.on('layer_preference', this.layerPreferenceListener);
		this.subscribedStreamer.on('id_changed', this.streamerIdChangeListener);
		this.subscribedStreamer.on('disconnect', this.streamerDisconnectedListener);

		const connectedMessage = MessageHelpers.createMessage(Messages.playerConnected, { playerId: this.playerId,
																						  dataChannel: true,
																						  sfu: true,
																						  sendOffer: true });
		this.sendToStreamer(connectedMessage);
	}

	private unsubscribe() {
		if (!this.subscribedStreamer) {
			return;
		}

		const disconnectedMessage = MessageHelpers.createMessage(Messages.playerDisconnected, { playerId: this.playerId });
		this.sendToStreamer(disconnectedMessage);

		this.subscribedStreamer.off('layer_preference', this.layerPreferenceListener);
		this.subscribedStreamer.off('id_changed', this.streamerIdChangeListener);
		this.subscribedStreamer.off('disconnect', this.streamerDisconnectedListener);
		this.subscribedStreamer = null;
	}

	private sendToStreamer(message: BaseMessage): void {
		if (!this.subscribedStreamer) {
			Logger.error(`SFU ${this.playerId} tried to send to a streamer but they're not subscribed to any.`)
			return;
		}

		LogUtils.logForward(this, this.subscribedStreamer, message);

		// normally we want to indicate what player this message came from
		// but in some instances we might already have set this (streamerDataChannels) due to poor choices
		message.playerId = message.playerId || this.playerId;

		this.subscribedStreamer.protocol.sendMessage(message);
	}

	private sendToPlayer(message: BaseMessage): void {
		if (!message.playerId) {
			Logger.error(`SFU ${this.streamerId} trying to send a message to a player with no playerId. Ignored.`);
			return;
		}
		const player = this.server.playerRegistry.get(message.playerId);
		if (player) {
			delete message.playerId;
			LogUtils.logForward(this, player, message);
			player.protocol.sendMessage(message);
		} else {
			Logger.error(`SFU attempted to forward to player ${message.playerId} which does not exist.`);
		}
	}

	private disconnect() {
		this.unsubscribe();
		this.protocol.disconnect();
		this.emit('disconnect');
	}

	private onLayerPreference(message: Messages.layerPreference): void {
		this.sendMessage(message);
	}

	private onStreamerIdChanged(newId: string): void {
		const renameMessage = MessageHelpers.createMessage(Messages.streamerIdChanged, { newID: newId });
		this.sendMessage(renameMessage);
	}

	private onStreamerDisconnected(): void {
		this.unsubscribe();
		this.sendMessage(MessageHelpers.createMessage(Messages.streamerDisconnected));
		this.streaming = false;
		this.emit('disconnect');
	}

	private onTransportError(error: ErrorEvent): void {
		Logger.error(`SFU (${this.playerId}) transport error ${error}`);
	}

	private onTransportClose(event: CloseEvent): void {
		Logger.debug('SFUConnection transport close.');
		this.disconnect();
	}

	private onSubscribeMessage(message: Messages.subscribe): void {
		this.subscribe(message.streamerId);
	}

	private onUnsubscribeMessage(message: Messages.unsubscribe): void {
		this.unsubscribe();
	}

	private onListStreamers(message: Messages.listStreamers): void {
		const listMessage = MessageHelpers.createMessage(Messages.streamerList, { ids: this.server.streamerRegistry.streamers.map(streamer => streamer.streamerId) });
		this.sendMessage(listMessage);
	}

	private onStreamerDataChannels(message: Messages.streamerDataChannels): void {
		message.sfuId = this.playerId!;
		this.sendToStreamer(message);
	}

	private onEndpointId(message: Messages.endpointId): void {
		this.streaming = true;
	}

	private onStartStreaming(message: Messages.startStreaming): void {
		this.streaming = true;
	}

	private onStopStreaming(message: Messages.stopStreaming): void {
		this.streaming = false;
		this.emit('disconnect');
	}
}

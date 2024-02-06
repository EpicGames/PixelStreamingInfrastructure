import * as WebSocket from 'ws';
import { WebSocketTransportNJS,
		 SignallingProtocol,
		 MessageHelpers,
		 Messages,
		 BaseMessage } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { IPlayer, Players } from './player_registry';
import { IStreamer, Streamers } from './streamer_registry';
import { Logger } from './logger';
import { stringify } from './utils';
import { StreamerConnection } from './streamer_connection';

export class PlayerConnection implements IPlayer {
	playerId: string;
	protocol: SignallingProtocol;

	private subscribedStreamer: IStreamer | null;
	private sendOffer: boolean;
	private streamerIdChangeListener: (newId: string) => void;
	private streamerDisconnectedListener: () => void;

	constructor(ws: WebSocket, config: any) {
		this.playerId = Players.getUniquePlayerId();
		this.subscribedStreamer = null;
		this.protocol = new SignallingProtocol(new WebSocketTransportNJS(ws));
		this.sendOffer = true;

		this.protocol.transportEvents.addListener('message', (message: BaseMessage) => Logger.info(`P:${this.playerId} <- ${stringify(message)}`));
		this.protocol.transportEvents.addListener('out', (message: BaseMessage) => Logger.info(`P:${this.playerId} -> ${stringify(message)}`));
		this.protocol.transportEvents.addListener('error', this.onTransportError.bind(this));
		this.protocol.transportEvents.addListener('close', this.onTransportClose.bind(this));

		this.streamerIdChangeListener = this.onStreamerIdChanged.bind(this);
		this.streamerDisconnectedListener = this.onStreamerDisconnected.bind(this);

		this.registerMessageHandlers();
		Players.registerPlayer(this);

		this.protocol.sendMessage(MessageHelpers.createMessage(Messages.config, config));
	}

	private registerMessageHandlers(): void {
		this.protocol.messageHandlers.addListener(Messages.subscribe.typeName, this.onSubscribeMessage.bind(this));
		this.protocol.messageHandlers.addListener(Messages.unsubscribe.typeName, this.onUnsubscribeMessage.bind(this));
		this.protocol.messageHandlers.addListener(Messages.listStreamers.typeName, this.onListStreamers.bind(this));
		this.protocol.messageHandlers.addListener(Messages.offer.typeName, this.sendToStreamer.bind(this));
		this.protocol.messageHandlers.addListener(Messages.answer.typeName, this.sendToStreamer.bind(this));
		this.protocol.messageHandlers.addListener(Messages.iceCandidate.typeName, this.sendToStreamer.bind(this));
		this.protocol.messageHandlers.addListener(Messages.dataChannelRequest.typeName, this.sendToStreamer.bind(this));
		this.protocol.messageHandlers.addListener(Messages.peerDataChannelsReady.typeName, this.sendToStreamer.bind(this));
	}

	private subscribe(streamerId: string) {
		let streamer = Streamers.get(streamerId);
		if (!streamer) {
			Logger.error(`subscribe: Player ${this.playerId} tried to subscribe to a non-existent streamer ${streamerId}`);
			return;
		}

		if (this.subscribedStreamer) {
			Logger.warning(`subscribe: Player ${this.playerId} is resubscribing to a streamer but is already subscribed to ${this.subscribedStreamer.streamerId}`);
			this.unsubscribe();
		}

		this.subscribedStreamer = streamer;
		this.subscribedStreamer.events.on('id_changed', this.streamerIdChangeListener);
		this.subscribedStreamer.events.on('disconnect', this.streamerDisconnectedListener);

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

		this.subscribedStreamer.events.off('id_changed', this.streamerIdChangeListener);
		this.subscribedStreamer.events.off('disconnect', this.streamerDisconnectedListener);
		this.subscribedStreamer = null;
	}

	private disconnect() {
		Players.unregisterPlayer(this.playerId);
		this.unsubscribe();
		this.protocol.disconnect();
	}

	private onStreamerDisconnected(): void {
		this.disconnect();
	}

	private onTransportError(error: ErrorEvent): void {
		Logger.error(`Player (${this.playerId}) transport error ${error}`);
	}

	private onTransportClose(event: CloseEvent): void {
		this.disconnect();
	}

	private onSubscribeMessage(message: Messages.subscribe): void {
		this.subscribe(message.streamerId);
	}

	private onUnsubscribeMessage(message: Messages.unsubscribe): void {
		this.unsubscribe();
	}

	private onListStreamers(message: Messages.listStreamers): void {
		const listMessage = MessageHelpers.createMessage(Messages.streamerList, { ids: Streamers.getStreamerIds() });
		this.protocol.sendMessage(listMessage);
	}

	private sendToStreamer(message: BaseMessage): void {
		if (!this.subscribedStreamer) {
			Logger.error(`Player ${this.playerId} tried to send to a streamer but they're not subscribed to any.`)
			return;
		}

		message.playerId = this.playerId;
		this.subscribedStreamer.protocol.sendMessage(message);
	}

	private onStreamerIdChanged(newId: string) {
		const renameMessage = MessageHelpers.createMessage(Messages.streamerIdChanged, { newID: newId });
		this.protocol.sendMessage(renameMessage);
	}

	private onStreamerRemoved() {
		this.disconnect();
	}
}
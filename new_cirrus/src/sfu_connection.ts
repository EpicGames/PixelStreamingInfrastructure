import { WebSocketTransportNJS, SignallingProtocol, MessageHelpers, Messages, BaseMessage } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { IPlayer, PlayerRegistry, Players } from './player_registry';
import { IStreamer, Streamers } from './streamer_registry';
import { Logger } from './logger';
import * as WebSocket from 'ws';
import { stringify } from './utils';
import { StreamerConnection } from './streamer_connection';

export class SFUConnection implements IPlayer {
	protocol: SignallingProtocol;

	playerId: string;
	subscribedToStreamerId: string | null;

	streamerId: string;
	idCommitted: boolean;
	idTimer: null | any;

	constructor(ws: WebSocket, config: any) {
		this.protocol = new SignallingProtocol(new WebSocketTransportNJS(ws));
		this.playerId = Players.getUniquePlayerId();
		this.streamerId = 'SFU';
		this.idCommitted = false;
		this.subscribedToStreamerId = null;

		this.protocol.transportEvents.addListener('message', (message: BaseMessage) => Logger.info(`SFU:${this.playerId} <- ${stringify(message)}`));
		this.protocol.transportEvents.addListener('out', (message: BaseMessage) => Logger.info(`SFU:${this.playerId} -> ${stringify(message)}`));
		this.protocol.transportEvents.addListener('error', this.onTransportError.bind(this));
		this.protocol.transportEvents.addListener('close', this.onTransportClose.bind(this));

		this.registerMessageHandlers();
		Players.registerPlayer(this);

		this.idTimer = setTimeout(() => {
			// streamer did not respond in time. give it a legacy id.
			const newLegacyId = Streamers.getUniqueLegacyStreamerId();
			if (newLegacyId.length == 0) {
				const error = `Ran out of legacy ids.`;
				console.error(error);
				this.protocol.disconnect();
			}

		}, 5 * 1000);

		this.protocol.sendMessage(MessageHelpers.createMessage(Messages.config, config));
		this.protocol.sendMessage(MessageHelpers.createMessage(Messages.identify));
	}

	private registerMessageHandlers(): void {
		this.protocol.messageHandlers.addListener(Messages.subscribe.typeName, this.onSubscribeMessage.bind(this));
		this.protocol.messageHandlers.addListener(Messages.unsubscribe.typeName, this.onUnsubscribeMessage.bind(this));
		this.protocol.messageHandlers.addListener(Messages.listStreamers.typeName, this.onListStreamers.bind(this));
		this.protocol.messageHandlers.addListener(Messages.offer.typeName, this.sendToPlayer.bind(this));
		this.protocol.messageHandlers.addListener(Messages.answer.typeName, this.sendToStreamer.bind(this));
		this.protocol.messageHandlers.addListener(Messages.endpointId.typeName, this.onEndpointId.bind(this));
		this.protocol.messageHandlers.addListener(Messages.peerDataChannels.typeName, this.sendToPlayer.bind(this));
		this.protocol.messageHandlers.addListener(Messages.streamerDataChannels.typeName, this.onStreamerDataChannels.bind(this));
		this.protocol.messageHandlers.addListener(Messages.startStreaming.typeName, this.onStartStreaming.bind(this));
		this.protocol.messageHandlers.addListener(Messages.stopStreaming.typeName, this.onStopStreaming.bind(this));
	}

	subscribe(streamerId: string) {
		if (!Streamers.has(streamerId)) {
			Logger.error(`subscribe: SFU ${this.playerId} tried to subscribe to a non-existent streamer ${streamerId}`);
			return;
		}

		this.subscribedToStreamerId = streamerId;

		const connectedMessage = MessageHelpers.createMessage(Messages.playerConnected, { playerId: this.playerId,
																						  dataChannel: true,
																						  sfu: true,
																						  sendOffer: true });
		this.sendToStreamer(connectedMessage);
	}

	unsubscribe() {
		if (this.subscribedToStreamerId && Streamers.has(this.subscribedToStreamerId)) {
			const disconnectedMessage = MessageHelpers.createMessage(Messages.playerDisconnected, { playerId: this.playerId });
			this.sendToStreamer(disconnectedMessage);
		}
		this.subscribedToStreamerId = null;
	}

	disconnect() {
		if (this.playerId) {
			Players.unregisterPlayer(this.playerId);
		}
		this.unsubscribe();
		if (this.idTimer !== undefined) {
			clearTimeout(this.idTimer);
		}
		Streamers.unregisterStreamer(this.streamerId);
		this.protocol.disconnect();
	}

	onStreamerIdChanged(newId: string): void {
		const renameMessage = MessageHelpers.createMessage(Messages.streamerIdChanged, { newID: newId });
		this.protocol.sendMessage(renameMessage);
	 	this.subscribedToStreamerId = newId;
	}

	onStreamerDisconnected(): void {
		this.disconnect();
	}

	sendLayerPreference(message: Messages.layerPreference): void {
		this.protocol.sendMessage(message);
	}

	private onTransportError(error: ErrorEvent): void {
		Logger.error(`SFU (${this.playerId}) transport error ${error}`);
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

	private onStreamerDataChannels(message: Messages.streamerDataChannels): void {
		message.sfuId = this.playerId!;
		this.sendToStreamer(message);
	}

	private sendToPlayer(message: BaseMessage): void {
		if (!message.playerId) {
			Logger.error(`SFU ${this.streamerId} trying to send a message to a player with no playerId. Ignored.`);
			return;
		}
		const player = Players.get(message.playerId);
		if (player) {
			player.protocol.sendMessage(message);
		} else {
			Logger.error(`SFU attempted to forward to player ${message.playerId} which does not exist.`);
		}
	}

	private sendToStreamer(message: BaseMessage): void {
		let streamer: IStreamer | undefined;
		if (!this.subscribedToStreamerId) {
			streamer = Streamers.getDefault();
			if (streamer) {
				Logger.error(`P:${this.playerId} sending but isn't subscribed. Picking first streamer.`)
			} else {
				Logger.error(`P:${this.playerId} sending but there are no streamers.`);
				return;
			}
		} else {
			streamer = Streamers.get(this.subscribedToStreamerId);
			if (!streamer) {
				Logger.error(`P:${this.playerId} is subscribed to streamer that doesn't exist. ${this.subscribedToStreamerId}`);
				return;
			}
		}

		// normally we want to indicate what player this message came from
		// but in some instances we might already have set this (streamerDataChannels) due to poor choices
		if (!message.playerId) {
			message.playerId = this.playerId;
		}

		streamer.protocol.sendMessage(message);
	}

	private onEndpointId(message: Messages.endpointId): void {
		if (this.idTimer !== undefined) {
			clearTimeout(this.idTimer);
			delete this.idTimer;
		}
	}

	private onStartStreaming(message: Messages.startStreaming): void {
		if (Streamers.has(this.streamerId)) {
			Logger.error(`SFU ${this.streamerId} tried to start streaming but is already registered.`);
			return;
		}
		Streamers.registerStreamer(this.streamerId, this);
	}

	private onStopStreaming(message: Messages.stopStreaming): void {
		Streamers.unregisterStreamer(this.streamerId);
	}
}

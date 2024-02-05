import { WebSocketTransportNJS, SignallingProtocol, MessageHelpers, Messages, BaseMessage } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { IPlayer, PlayerRegistry, Players } from './player_registry';
import { IStreamer, Streamers } from './streamer_registry';
import { Logger } from './logger';
import * as WebSocket from 'ws';
import { stringify } from './utils';
import { StreamerConnection } from './streamer_connection';

export enum PlayerType {
	Regular,
	SFU
}

export class PlayerConnection implements IPlayer {
	playerId: string | undefined;
	type: PlayerType;
	subscribedToStreamerId: string | null;
	protocol: SignallingProtocol;
	sendOffer: boolean;

	constructor(ws: WebSocket, type: PlayerType, config: any) {
		this.playerId = undefined;
		this.type = type;
		this.subscribedToStreamerId = null;
		this.protocol = new SignallingProtocol(new WebSocketTransportNJS(ws));
		this.sendOffer = true;

		this.protocol.transportEvents.addListener('message', (message: BaseMessage) => Logger.info(`P:${this.playerId} <- ${stringify(message)}`));
		this.protocol.transportEvents.addListener('out', (message: BaseMessage) => Logger.info(`P:${this.playerId} -> ${stringify(message)}`));
		this.protocol.transportEvents.addListener('error', this.onTransportError.bind(this));
		this.protocol.transportEvents.addListener('close', this.onTransportClose.bind(this));

		this.protocol.messageHandlers.addListener(Messages.subscribe.typeName, this.onSubscribeMessage.bind(this));
		this.protocol.messageHandlers.addListener(Messages.unsubscribe.typeName, this.onUnsubscribeMessage.bind(this));
		this.protocol.messageHandlers.addListener(Messages.listStreamers.typeName, this.onListStreamers.bind(this));
		this.protocol.messageHandlers.addListener(Messages.offer.typeName, this.sendToStreamer.bind(this));
		this.protocol.messageHandlers.addListener(Messages.answer.typeName, this.sendToStreamer.bind(this));
		this.protocol.messageHandlers.addListener(Messages.iceCandidate.typeName, this.sendToStreamer.bind(this));
		this.protocol.messageHandlers.addListener(Messages.dataChannelRequest.typeName, this.sendToStreamer.bind(this));
		this.protocol.messageHandlers.addListener(Messages.peerDataChannelsReady.typeName, this.sendToStreamer.bind(this));

		Players.registerPlayer(this);

		this.protocol.sendMessage(MessageHelpers.createMessage(Messages.config, config));
	}

	subscribe(streamerId: string) {
		if (!Streamers.has(streamerId)) {
			Logger.error(`subscribe: Player ${this.playerId} tried to subscribe to a non-existent streamer ${streamerId}`);
			return;
		}

		this.subscribedToStreamerId = streamerId;

		if (this.type == PlayerType.SFU) {
			const streamer = Streamers.get(this.subscribedToStreamerId);
			//streamer.addSFUPlayer(this.playerId);
		}

		const connectedMessage = MessageHelpers.createMessage(Messages.playerConnected, { playerId: this.playerId,
																						  dataChannel: true,
																						  sfu: this.type == PlayerType.SFU,
																						  sendOffer: this.sendOffer });
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
}

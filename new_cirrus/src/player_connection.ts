import { WebSocketTransportNJS, SignallingProtocol, MessageHelpers, Messages, BaseMessage } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { PlayerRegistry, Players } from './player_registry';
import { Streamers } from './streamer_registry';
import { Logger } from './logger';
import * as WebSocket from 'ws';
import { stringify } from './utils';
import { StreamerConnection } from './streamer_connection';

export enum PlayerType {
	Regular,
	SFU
}

export class PlayerConnection {
	id: string | undefined;
	type: PlayerType;
	streamerId: string | null;
	protocol: SignallingProtocol;
	sendOffer: boolean;

	constructor(ws: WebSocket, type: PlayerType, config: any) {
		this.id = undefined;
		this.type = type;
		this.streamerId = null;
		this.protocol = new SignallingProtocol(new WebSocketTransportNJS(ws));
		this.sendOffer = true;

		this.protocol.transportEvents.addListener('message', (message: BaseMessage) => Logger.info(`P:${this.id} <- ${stringify(message)}`));
		this.protocol.transportEvents.addListener('out', (message: BaseMessage) => Logger.info(`P:${this.id} -> ${stringify(message)}`));
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
			Logger.error(`subscribe: Player ${this.id} tried to subscribe to a non-existent streamer ${streamerId}`);
			return;
		}

		this.streamerId = streamerId;

		if (this.type == PlayerType.SFU) {
			const streamer = Streamers.get(this.streamerId);
			//streamer.addSFUPlayer(this.id);
		}

		const connectedMessage = MessageHelpers.createMessage(Messages.playerConnected, { playerId: this.id,
																						  dataChannel: true,
																						  sfu: this.type == PlayerType.SFU,
																						  sendOffer: this.sendOffer });
		this.sendToStreamer(connectedMessage);
	}

	unsubscribe() {
		if (this.streamerId && Streamers.has(this.streamerId)) {
			const disconnectedMessage = MessageHelpers.createMessage(Messages.playerDisconnected, { playerId: this.id });
			this.sendToStreamer(disconnectedMessage);
		}
		this.streamerId = null;
	}

	disconnect() {
		if (this.id) {
			Players.unregisterPlayer(this.id);
		}
		this.protocol.disconnect();
	}

	private onTransportError(error: ErrorEvent): void {
		Logger.error(`Player (${this.id}) transport error ${error}`);
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
		let streamer: StreamerConnection | undefined;
		if (!this.streamerId) {
			streamer = Streamers.getDefault();
			if (streamer) {
				Logger.error(`P:${this.id} sending but isn't subscribed. Picking first streamer.`)
			} else {
				Logger.error(`P:${this.id} sending but there are no streamers.`);
				return;
			}
		} else {
			streamer = Streamers.get(this.streamerId);
			if (!streamer) {
				Logger.error(`P:${this.id} is subscribed to streamer that doesn't exist. ${this.streamerId}`);
				return;
			}
		}

		// normally we want to indicate what player this message came from
		// but in some instances we might already have set this (streamerDataChannels) due to poor choices
		if (!message.playerId) {
			message.playerId = this.id;
		}

		streamer.protocol.sendMessage(message);
	}
}

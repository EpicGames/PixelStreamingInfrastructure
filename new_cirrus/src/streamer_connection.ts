import WebSocket from 'ws';
import { SignallingProtocol,
		 WebSocketTransportNJS,
		 BaseMessage,
		 Messages,
		 MessageHelpers } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { Logger } from './logger';
import { stringify } from './utils';
import { IStreamer, Streamers } from './streamer_registry';
import { IPlayer, Players } from './player_registry';
import { EventEmitter } from 'events';

export class StreamerConnection implements IStreamer {
	streamerId: string;
	protocol: SignallingProtocol;
	idCommitted: boolean;
	idTimer: null | any;
	events: EventEmitter;

	constructor(initialId: string, ws: WebSocket, config: any) {
		this.streamerId = initialId;
		this.protocol = new SignallingProtocol(new WebSocketTransportNJS(ws));
		this.idCommitted = false;
		this.events = new EventEmitter();

		this.protocol.transportEvents.addListener('message', (message: BaseMessage) => Logger.info(`S:${this.streamerId} <- ${stringify(message)}`));
		this.protocol.transportEvents.addListener('out', (message: BaseMessage) => Logger.info(`S:${this.streamerId} -> ${stringify(message)}`));
		this.protocol.transportEvents.addListener('error', this.onTransportError.bind(this));
		this.protocol.transportEvents.addListener('close', this.onTransportClose.bind(this));

		this.registerMessageHandlers();

		this.idTimer = setTimeout(() => {
			// streamer did not respond in time. give it a legacy id.
			const newLegacyId = Streamers.getUniqueLegacyStreamerId();
			if (newLegacyId.length == 0) {
				const error = `Ran out of legacy ids.`;
				console.error(error);
				this.protocol.disconnect();
			} else {
				Streamers.registerStreamer(newLegacyId, this);
			}

		}, 5 * 1000);

		this.protocol.sendMessage(MessageHelpers.createMessage(Messages.config, config));
		this.protocol.sendMessage(MessageHelpers.createMessage(Messages.identify));
	}

	private registerMessageHandlers(): void {
		this.protocol.messageHandlers.addListener(Messages.endpointId.typeName, this.onEndpointId.bind(this));
		this.protocol.messageHandlers.addListener(Messages.ping.typeName, this.onPing.bind(this));
		this.protocol.messageHandlers.addListener(Messages.offer.typeName, this.forwardMessage.bind(this));
		this.protocol.messageHandlers.addListener(Messages.answer.typeName, this.forwardMessage.bind(this));
		this.protocol.messageHandlers.addListener(Messages.iceCandidate.typeName, this.forwardMessage.bind(this));
		this.protocol.messageHandlers.addListener(Messages.disconnectPlayer.typeName, this.onDisconnectPlayerRequest.bind(this));
		this.protocol.messageHandlers.addListener(Messages.layerPreference.typeName, this.onLayerPreference.bind(this));
	}

	private onTransportError(error: ErrorEvent): void {
		Logger.error(`Streamer (${this.streamerId}) transport error ${error}`);
	}

	private onTransportClose(): void {
		if (this.idTimer !== undefined) {
			clearTimeout(this.idTimer);
		}
		Streamers.unregisterStreamer(this.streamerId);
		this.events.emit('disconnect');
	}

	private onEndpointId(message: Messages.endpointId): void {
		if (this.idTimer !== undefined) {
			clearTimeout(this.idTimer);
			delete this.idTimer;
		}
		Streamers.registerStreamer(message.id, this);
		this.events.emit('id_changed');
	}

	private onPing(message: Messages.ping): void {
		this.protocol.sendMessage(MessageHelpers.createMessage(Messages.pong, { time: message.time }));
	}

	private onDisconnectPlayerRequest(message: Messages.disconnectPlayer): void {
		if (message.playerId) {
			const player = Players.get(message.playerId);
			if (player) {
				player.protocol.disconnect(1011, message.reason);
			}
		}
	}

	private onLayerPreference(message: Messages.layerPreference): void {
		this.events.emit('layer_preference', message);
	}

	private forwardMessage(message: BaseMessage): void {
		if (!message.playerId) {
			Logger.warning(`No playerId specified, cannot forward message: ${stringify(message)}`);
		} else {
			const player = Players.get(message.playerId);
			if (player) {
				delete message.playerId;
				player.protocol.sendMessage(message);
			}
		}
	}
}

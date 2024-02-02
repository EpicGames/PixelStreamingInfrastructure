import { SignallingProtocol,
		 WebSocketTransportNJS,
		 BaseMessage,
		 Messages,
		 MessageHelpers } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import WebSocket from 'ws';
import { Logger } from './logger';
import { stringify } from './utils';
import { StreamerRegistry, Streamers } from './streamer_registry';
import { Players } from './player_registry';

export enum StreamerType {
	Regular,
	SFU
}

export class StreamerConnection {
	id: string;
	protocol: SignallingProtocol;
	type: StreamerType;
	idCommitted: boolean;
	idTimer: null | any;

	constructor(initialId: string, ws: WebSocket, type: StreamerType, config: any) {
		this.id = initialId;
		this.protocol = new SignallingProtocol(new WebSocketTransportNJS(ws));
		this.type = type;
		this.idCommitted = false;

		this.protocol.transportEvents.addListener('message', (message: BaseMessage) => Logger.info(`S:${this.id} <- ${stringify(message)}`));
		this.protocol.transportEvents.addListener('out', (message: BaseMessage) => Logger.info(`S:${this.id} -> ${stringify(message)}`));
		this.protocol.transportEvents.addListener('error', () => this.onTransportError.bind(this));
		this.protocol.transportEvents.addListener('close', () => this.onTransportClose.bind(this));

		this.protocol.messageHandlers.addListener(Messages.endpointId.typeName, this.onEndpointId.bind(this));
		this.protocol.messageHandlers.addListener(Messages.ping.typeName, this.onPing.bind(this));
		this.protocol.messageHandlers.addListener(Messages.offer.typeName, this.forwardMessage.bind(this));
		this.protocol.messageHandlers.addListener(Messages.answer.typeName, this.forwardMessage.bind(this));
		this.protocol.messageHandlers.addListener(Messages.iceCandidate.typeName, this.forwardMessage.bind(this));
		this.protocol.messageHandlers.addListener(Messages.disconnectPlayer.typeName, this.onDisconnectPlayerRequest.bind(this));
		this.protocol.messageHandlers.addListener(Messages.layerPreference.typeName, this.onLayerPreference.bind(this));

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

	private onEndpointId(message: Messages.endpointId): void {
		if (this.idTimer !== undefined) {
			clearTimeout(this.idTimer);
			delete this.idTimer;
		}
		Streamers.registerStreamer(message.id, this);
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
		// sfu nonsense
		// let sfuPlayer = getSFUForStreamer(streamer.id);
		// if (sfuPlayer) {
		// 	logOutgoing(sfuPlayer.id, msg);
		// 	sfuPlayer.sendTo(msg);
		// }
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

	private onTransportError(error: ErrorEvent): void {
		Logger.error(`Streamer (${this.id}) transport error ${error}`);
	}

	private onTransportClose(): void {
		if (this.idTimer !== undefined) {
			clearTimeout(this.idTimer);
		}
		Streamers.unregisterStreamer(this.id);
	}
}

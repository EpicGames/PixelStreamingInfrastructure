import WebSocket from 'ws';
import { SignallingProtocol,
		 WebSocketTransportNJS,
		 BaseMessage,
		 Messages,
		 MessageHelpers } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { Logger } from './logger';
import { IStreamer, Streamers } from './streamer_registry';
import { IPlayer, Players } from './player_registry';
import { EventEmitter } from 'events';
import { formatIncoming,
		 formatOutgoing,
		 formatForward,
		 streamerIdentifier,
		 playerIdentifier,
		 createHandlerListener,
		 IMessageLogger,
		 stringify } from './utils';

export class StreamerConnection implements IStreamer, IMessageLogger {
	streamerId: string;
	protocol: SignallingProtocol;
	idCommitted: boolean;
	events: EventEmitter;
	private idTimer: null | any;

	constructor(initialId: string, ws: WebSocket, config: any) {
		this.streamerId = initialId;
		this.protocol = new SignallingProtocol(new WebSocketTransportNJS(ws));
		this.idCommitted = false;
		this.events = new EventEmitter();

		//this.protocol.transportEvents.addListener('message', (message: BaseMessage) => Logger.info(`S:${this.streamerId} <- ${stringify(message)}`));
		//this.protocol.transportEvents.addListener('out', (message: BaseMessage) => Logger.info(`S:${this.streamerId} -> ${stringify(message)}`));
		this.protocol.transportEvents.addListener('error', this.onTransportError.bind(this));
		this.protocol.transportEvents.addListener('close', this.onTransportClose.bind(this));

		this.registerMessageHandlers();
		this.requestIdentification();

		this.sendMessage(MessageHelpers.createMessage(Messages.config, config));
	}

	getIdentifier(): string { return streamerIdentifier(this.streamerId); }

	private registerMessageHandlers(): void {
		this.protocol.messageHandlers.on(Messages.endpointId.typeName, createHandlerListener(this, this.onEndpointId));
		this.protocol.messageHandlers.on(Messages.ping.typeName, createHandlerListener(this, this.onPing));
		this.protocol.messageHandlers.on(Messages.disconnectPlayer.typeName, createHandlerListener(this, this.onDisconnectPlayerRequest));
		this.protocol.messageHandlers.on(Messages.layerPreference.typeName, createHandlerListener(this, this.onLayerPreference));

		this.protocol.messageHandlers.on(Messages.offer.typeName, this.forwardMessage.bind(this));
		this.protocol.messageHandlers.on(Messages.answer.typeName, this.forwardMessage.bind(this));
		this.protocol.messageHandlers.on(Messages.iceCandidate.typeName, this.forwardMessage.bind(this));
	}

	private sendMessage(message: BaseMessage): void {
		Logger.info(formatOutgoing(this.getIdentifier(), message));
		this.protocol.sendMessage(message);
	}

	private forwardMessage(message: BaseMessage): void {
		if (!message.playerId) {
			Logger.warning(`No playerId specified, cannot forward message: ${stringify(message)}`);
		} else {
			const player = Players.get(message.playerId);
			if (player) {
				delete message.playerId;
				Logger.info(formatForward(this.getIdentifier(), player.getIdentifier(), message));
				player.protocol.sendMessage(message);
			}
		}
	}

	private requestIdentification():void {
		this.idTimer = setTimeout(() => {
			// streamer did not respond in time. give it a legacy id.
			const newLegacyId = Streamers.getUniqueLegacyStreamerId();
			if (newLegacyId.length == 0) {
				Logger.error(`Ran out of legacy ids.`);
				this.protocol.disconnect();
			} else {
				Streamers.registerStreamer(newLegacyId, this);
			}

		}, 5 * 1000);
		this.sendMessage(MessageHelpers.createMessage(Messages.identify));
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
		this.sendMessage(MessageHelpers.createMessage(Messages.pong, { time: message.time }));
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
}

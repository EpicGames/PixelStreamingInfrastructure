import WebSocket from 'ws';
import { SignallingProtocol,
		 WebSocketTransportNJS,
		 BaseMessage,
		 Messages,
		 MessageHelpers } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { IStreamer, Streamers } from './StreamerRegistry';
import { Players } from './PlayerRegistry';
import { EventEmitter } from 'events';
import { stringify } from './Utils';
import { Logger } from './Logger';
import * as LogUtils from './LoggingUtils';

export class StreamerConnection implements IStreamer, LogUtils.IMessageLogger {
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

		this.protocol.transportEvents.addListener('error', this.onTransportError.bind(this));
		this.protocol.transportEvents.addListener('close', this.onTransportClose.bind(this));

		this.registerMessageHandlers();
		this.requestIdentification();

		this.sendMessage(MessageHelpers.createMessage(Messages.config, config));
	}

	getIdentifier(): string { return this.streamerId; }

	private registerMessageHandlers(): void {
		this.protocol.messageHandlers.on(Messages.endpointId.typeName, LogUtils.createHandlerListener(this, this.onEndpointId));
		this.protocol.messageHandlers.on(Messages.ping.typeName, LogUtils.createHandlerListener(this, this.onPing));
		this.protocol.messageHandlers.on(Messages.disconnectPlayer.typeName, LogUtils.createHandlerListener(this, this.onDisconnectPlayerRequest));
		this.protocol.messageHandlers.on(Messages.layerPreference.typeName, LogUtils.createHandlerListener(this, this.onLayerPreference));

		this.protocol.messageHandlers.on(Messages.offer.typeName, this.forwardMessage.bind(this));
		this.protocol.messageHandlers.on(Messages.answer.typeName, this.forwardMessage.bind(this));
		this.protocol.messageHandlers.on(Messages.iceCandidate.typeName, this.forwardMessage.bind(this));
	}

	private sendMessage(message: BaseMessage): void {
		LogUtils.logOutgoing(this, message);
		this.protocol.sendMessage(message);
	}

	private forwardMessage(message: BaseMessage): void {
		if (!message.playerId) {
			Logger.warn(`No playerId specified, cannot forward message: ${stringify(message)}`);
		} else {
			const player = Players.get(message.playerId);
			if (player) {
				delete message.playerId;
				LogUtils.logForward(this, player, message);
				player.protocol.sendMessage(message);
			}
		}
	}

	private requestIdentification(): void {
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
		Logger.debug('StreamerConnection transport close.');
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

import WebSocket from 'ws';
import { ITransport,
		 SignallingProtocol,
		 WebSocketTransportNJS,
		 BaseMessage,
		 Messages,
		 MessageHelpers } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { IStreamer } from './StreamerRegistry';
import { EventEmitter } from 'events';
import { stringify } from './Utils';
import { Logger } from './Logger';
import * as LogUtils from './LoggingUtils';
import { SignallingServer } from './SignallingServer';

export class StreamerConnection extends EventEmitter implements IStreamer, LogUtils.IMessageLogger {
	server: SignallingServer;
	streamerId: string;
	transport: ITransport;
	protocol: SignallingProtocol;
	streaming: boolean;

	constructor(server: SignallingServer, ws: WebSocket) {
		super();

		this.server = server;
		this.streamerId = '';
		this.transport = new WebSocketTransportNJS(ws);
		this.protocol = new SignallingProtocol(this.transport);
		this.streaming = false;

		this.transport.on('error', this.onTransportError.bind(this));
		this.transport.on('close', this.onTransportClose.bind(this));

		this.registerMessageHandlers();
	}

	getReadableIdentifier(): string { return this.streamerId; }

	private registerMessageHandlers(): void {
		this.protocol.on(Messages.endpointId.typeName, LogUtils.createHandlerListener(this, this.onEndpointId));
		this.protocol.on(Messages.ping.typeName, LogUtils.createHandlerListener(this, this.onPing));
		this.protocol.on(Messages.disconnectPlayer.typeName, LogUtils.createHandlerListener(this, this.onDisconnectPlayerRequest));
		this.protocol.on(Messages.layerPreference.typeName, LogUtils.createHandlerListener(this, this.onLayerPreference));

		this.protocol.on(Messages.offer.typeName, this.forwardMessage.bind(this));
		this.protocol.on(Messages.answer.typeName, this.forwardMessage.bind(this));
		this.protocol.on(Messages.iceCandidate.typeName, this.forwardMessage.bind(this));
	}

	sendMessage(message: BaseMessage): void {
		LogUtils.logOutgoing(this, message);
		this.protocol.sendMessage(message);
	}

	private forwardMessage(message: BaseMessage): void {
		if (!message.playerId) {
			Logger.warn(`No playerId specified, cannot forward message: ${stringify(message)}`);
		} else {
			const player = this.server.playerRegistry.get(message.playerId);
			if (player) {
				delete message.playerId;
				LogUtils.logForward(this, player, message);
				player.protocol.sendMessage(message);
			}
		}
	}

	private onTransportError(error: ErrorEvent): void {
		Logger.error(`Streamer (${this.streamerId}) transport error ${error}`);
	}

	private onTransportClose(): void {
		Logger.debug('StreamerConnection transport close.');
		this.emit('disconnect');
	}

	private onEndpointId(message: Messages.endpointId): void {
		this.streaming = true; // we're ready to stream when we id ourselves
	}

	private onPing(message: Messages.ping): void {
		this.sendMessage(MessageHelpers.createMessage(Messages.pong, { time: message.time }));
	}

	private onDisconnectPlayerRequest(message: Messages.disconnectPlayer): void {
		if (message.playerId) {
			const player = this.server.playerRegistry.get(message.playerId);
			if (player) {
				player.protocol.disconnect(1011, message.reason);
			}
		}
	}

	private onLayerPreference(message: Messages.layerPreference): void {
		this.emit('layer_preference', message);
	}
}

import http from 'http';
import WebSocket from 'ws';
import url from 'url';
import { StreamerConnection } from './StreamerConnection';
import { PlayerConnection } from './PlayerConnection';
import { SFUConnection } from './SFUConnection';
import { Logger } from './Logger';
import { StreamerRegistry } from './StreamerRegistry';
import { PlayerRegistry } from './PlayerRegistry';
import { Messages, MessageHelpers, SignallingProtocol } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { stringify } from './Utils';

/**
 * An interface describing the possible options to pass when creating
 * a new SignallingServer object.
 */
export interface IServerConfig {
	// An http server to use for player connections rather than a port. Not needed if playerPort supplied.
	httpServer?: any;

	// The port to listen on for streamer connections.
	streamerPort: number;

	// The port to listen on for player connections. Not needed if httpServer supplied.
	playerPort?: number;

	// The port to listen on for SFU connections. If not supplied SFU connections will be disabled.
	sfuPort?: number;

	// The peer configuration object to send to peers in the config message when they connect.
	peerOptions: any;

	// Additional websocket options for the streamer listening websocket.
	streamerWsOptions?: any;

	// Additional websocket options for the player listening websocket.
	playerWsOptions?: any;

	// Additional websocket options for the SFU listening websocket.
	sfuWsOptions?: any;
}

/**
 * The main signalling server object.
 * Contains a streamer and player registry and handles setting up of websockets
 * to listen for incoming connections.
 */
export class SignallingServer {
	config: IServerConfig;
	protocolConfig: any;
	streamerRegistry: StreamerRegistry;
	playerRegistry: PlayerRegistry;
	startTime: Date;

	constructor(config: IServerConfig) {
		Logger.debug('Started SignallingServer with config: %s', stringify(config));

		this.config = config;
		this.streamerRegistry = new StreamerRegistry();
		this.playerRegistry = new PlayerRegistry();
		this.protocolConfig = {
			protocolVersion: SignallingProtocol.SIGNALLING_VERSION,
			peerConnectionOptions: this.config.peerOptions || {}
		};
		this.startTime = new Date();

		if (!config.playerPort && !config.httpServer) {
			Logger.error('No player port or http server supplied to SignallingServer.');
			return;
		}

		// Streamer connections
		const streamerServer = new WebSocket.Server({ port: config.streamerPort, backlog: 1, ...config.streamerWsOptions});
		streamerServer.on('connection', this.onStreamerConnected.bind(this));
		Logger.info(`Listening for streamer connections on port ${config.streamerPort}`);

		// Player connections
		const playerServer = new WebSocket.Server({
			server: config.httpServer,
			port: config.httpServer ? undefined : config.playerPort,
			...config.playerWsOptions });
		playerServer.on('connection', this.onPlayerConnected.bind(this));
		if (!config.httpServer) {
			Logger.info(`Listening for player connections on port ${config.playerPort}`);
		}

		// Optional SFU connections
		if (config.sfuPort) {
			const sfuServer = new WebSocket.Server({ port: config.sfuPort, backlog: 1, ...config.sfuWsOptions });
			sfuServer.on('connection', this.onSFUConnected.bind(this));
			Logger.info(`Listening for SFU connections on port ${config.sfuPort}`);
		}
	}

	private onStreamerConnected(ws: WebSocket, request: http.IncomingMessage) {
		Logger.info(`New streamer connection: %s`, request.socket.remoteAddress);

		const newStreamer = new StreamerConnection(this, ws, request);

		// add it to the registry and when the transport closes, remove it.
		this.streamerRegistry.add(newStreamer);
		newStreamer.transport.on('close', () => { this.streamerRegistry.remove(newStreamer); });

		newStreamer.sendMessage(MessageHelpers.createMessage(Messages.config, this.protocolConfig));
	}

	private onPlayerConnected(ws: WebSocket, request: http.IncomingMessage) {
		Logger.info(`New player connection: %s (%s)`, request.socket.remoteAddress, request.url);

		// extract some options from the request url
		let sendOffer = true;
		if (request.url) {
			const parsedUrl = url.parse(request.url);
			const urlParams = new URLSearchParams(parsedUrl.search!);
			const offerToReceive: boolean = (urlParams.get('OfferToReceive') === 'true');
			sendOffer = offerToReceive ? false : true;
		}

		const newPlayer = new PlayerConnection(this, ws, request, sendOffer);

		// add it to the registry and when the transport closes, remove it
		this.playerRegistry.add(newPlayer);
		newPlayer.transport.on('close', () => { this.playerRegistry.remove(newPlayer); });

		newPlayer.sendMessage(MessageHelpers.createMessage(Messages.config, this.protocolConfig));
	}

	private onSFUConnected(ws: WebSocket, request: http.IncomingMessage) {
		Logger.info(`New SFU connection: %s`, request.socket.remoteAddress);
		const newSFU = new SFUConnection(this, ws, request);

		// SFU acts as both a streamer and player
		this.streamerRegistry.add(newSFU);
		this.playerRegistry.add(newSFU);
		newSFU.transport.on('close', () => {
			this.streamerRegistry.remove(newSFU);
			this.playerRegistry.remove(newSFU);
		});

		newSFU.sendMessage(MessageHelpers.createMessage(Messages.config, this.protocolConfig));
	}
}

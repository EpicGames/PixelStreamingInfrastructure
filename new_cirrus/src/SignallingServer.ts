import express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import path from 'path';
import fs from 'fs';
import url from 'url';
import { StreamerConnection } from './StreamerConnection';
import { PlayerConnection } from './PlayerConnection';
import { SFUConnection } from './SFUConnection';
import { Logger } from './Logger';
import { stringify } from './Utils';
import { StreamerRegistry } from './StreamerRegistry';
import { PlayerRegistry } from './PlayerRegistry';
import { Messages, MessageHelpers } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';

interface IConfig {
	httpServer?: any;
	streamerPort: number;
	playerPort?: number;
	sfuPort?: number;
	clientConfig: any;
	streamerWsOptions?: any;
	playerWsOptions?: any;
	sfuWsOptions?: any;
}

export class SignallingServer {
	config: IConfig;
	streamerRegistry: StreamerRegistry;
	playerRegistry: PlayerRegistry;

	constructor(config: IConfig) {
		Logger.debug('Started SignallingServer with config: %s', config);

		this.config = config;
		this.streamerRegistry = new StreamerRegistry();
		this.playerRegistry = new PlayerRegistry();

		if (!config.playerPort && !config.httpServer) {
			Logger.error('No player port or http server supplied to SignallingServer.');
			return;
		}

		// Streamer connections
		const streamerServer = new WebSocket.Server({ port: config.streamerPort, backlog: 1, ...config.streamerWsOptions});
		streamerServer.on('connection', this.onStreamerConnected.bind(this));
		Logger.info(`Listening for streamer connections on port ${config.streamerPort}`);

		// Player connections
		const playerServer = new WebSocket.Server({ server: config.httpServer, port: config.playerPort, ...config.playerWsOptions });
		playerServer.on('connection', this.onPlayerConnected.bind(this));
		if (config.playerPort) {
			Logger.info(`Listening for player connections on port ${config.playerPort}`);
		}

		// Optional SFU connections
		if (config.sfuPort) {
			const sfuServer = new WebSocket.Server({ port: config.sfuPort, backlog: 1, ...config.sfuWsOptions });
			sfuServer.on('connection', this.onSFUConnected.bind(this));
			Logger.info(`Listening for SFU connections on port ${config.sfuPort}`);
		}
	}

	private onStreamerConnected(ws: WebSocket, request: any) {
		Logger.info(`New streamer connection: %s`, request.connection.remoteAddress);

		const newStreamer = new StreamerConnection(this, ws);

		// add it to the registry and when the transport closes, remove it.
		this.streamerRegistry.add(newStreamer);
		newStreamer.transport.on('close', () => { this.streamerRegistry.remove(newStreamer); });

		newStreamer.sendMessage(MessageHelpers.createMessage(Messages.config, this.config.clientConfig));
	}

	private onPlayerConnected(ws: WebSocket, request: any) {
		Logger.info(`New player connection: %s (%s)`, request.connection.remoteAddress, request.url);

		// extract some options from the request url
		const parsedUrl = url.parse(request.url);
		const urlParams = new URLSearchParams(parsedUrl.search!);
		const offerToReceive: boolean = (urlParams.get('OfferToReceive') === 'true');
		const sendOffer: boolean = offerToReceive ? false : true;

		const newPlayer = new PlayerConnection(this, ws, sendOffer);

		// add it to the registry and when the transport closes, remove it
		this.playerRegistry.add(newPlayer);
		newPlayer.transport.on('close', () => { this.playerRegistry.remove(newPlayer); });

		newPlayer.sendMessage(MessageHelpers.createMessage(Messages.config, this.config.clientConfig));
	}

	private onSFUConnected(ws: WebSocket, request: any) {
		Logger.info(`New SFU connection: %s`, request.connection.remoteAddress);
		const newSFU = new SFUConnection(this, ws);

		// SFU acts as both a streamer and player
		this.streamerRegistry.add(newSFU);
		this.playerRegistry.add(newSFU);
		newSFU.transport.on('close', () => {
			this.streamerRegistry.remove(newSFU);
			this.playerRegistry.remove(newSFU);
		});

		newSFU.sendMessage(MessageHelpers.createMessage(Messages.config, this.config.clientConfig));

	}
}

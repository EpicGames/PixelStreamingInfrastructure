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
	constructor(config: IConfig) {
		Logger.debug('Started SignallingServer with config: %s', config);

		if (!config.playerPort && !config.httpServer) {
			Logger.error('No player port or http server supplied to SignallingServer.');
			return;
		}

		// Streamer connections
		const streamerServer = new WebSocket.Server({ port: config.streamerPort, backlog: 1, ...config.streamerWsOptions});
		streamerServer.on('connection', (ws: WebSocket, request: any) => {
			Logger.info(`New streamer connection: %s`, request.connection.remoteAddress);
			const temporaryId = request.connection.remoteAddress;
			const newServer = new StreamerConnection(temporaryId, ws, config.clientConfig);
			// I don't like that here we just create connections and something magical happens
			// Perhaps we should add it to the registry ourselves here? But connections aren't
			// always immediately registered. Might need to rethink this design.
		});
		Logger.info(`Listening for streamer connections on port ${config.streamerPort}`);

		// Player connections
		const playerServer = new WebSocket.Server({ server: config.httpServer, port: config.playerPort, ...config.playerWsOptions });
		playerServer.on('connection', (ws: WebSocket, request: any) => {
			Logger.info(`New player connection: %s`, request.connection.remoteAddress);
			Logger.debug(`Request URL: %s`, request.url);
			const parsedUrl = url.parse(request.url);
			const urlParams = new URLSearchParams(parsedUrl.search!);
			const offerToReceive: boolean = (urlParams.get('OfferToReceive') === 'true');
			const sendOffer: boolean = offerToReceive ? false : true;
			const newPlayer = new PlayerConnection(ws, sendOffer, config.clientConfig);
		});
		if (config.playerPort) {
			Logger.info(`Listening for player connections on port ${config.playerPort}`);
		}

		// Optional SFU connections
		if (config.sfuPort) {
			const sfuServer = new WebSocket.Server({ port: config.sfuPort, backlog: 1, ...config.sfuWsOptions });
			sfuServer.on('connection', (ws: WebSocket, request: any) => {
				Logger.info(`New SFU connection: %s`, request.connection.remoteAddress);
				const newSFU = new SFUConnection(ws, config.clientConfig);
			});
			Logger.info(`Listening for SFU connections on port ${config.sfuPort}`);
		}
	}
}

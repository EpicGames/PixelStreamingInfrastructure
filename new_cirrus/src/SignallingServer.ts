import express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import path from 'path';
import fs from 'fs';
import { StreamerConnection } from './streamer_connection';
import { PlayerConnection } from './player_connection';
import { SFUConnection } from './sfu_connection';
import { Logger } from './Logger';

interface Config {
	httpServer?: any;
	streamerPort: number;
	playerPort?: number;
	sfuPort?: number;
	clientConfig: any;
}

export class SignallingServer {
	constructor(config: Config) {
		const streamerServer = new WebSocket.Server({ port: config.streamerPort, backlog: 1 });
		streamerServer.on('connection', (ws: WebSocket, reqest: any) => {
			Logger.info(`New streamer connection...`);
			const temporaryId = reqest.connection.remoteAddress;
			const newServer = new StreamerConnection(temporaryId, ws, config.clientConfig);
		});

		const playerServerConfig: any = {};
		if (config.httpServer) {
			playerServerConfig.server = config.httpServer;
		} else {
			playerServerConfig.port = config.playerPort;
		}

		const playerServer = new WebSocket.Server(playerServerConfig);
		playerServer.on('connection', (ws: WebSocket, reqest: any) => {
			Logger.info(`New player connection...`);
			const newPlayer = new PlayerConnection(ws, config.clientConfig);
		});

		if (config.sfuPort) {
			const sfuServer = new WebSocket.Server({ port: config.sfuPort, backlog: 1 });
			sfuServer.on('connection', (ws: WebSocket, reqest: any) => {
				Logger.info(`New SFU connection...`);
				const newSFU = new SFUConnection(ws, config.clientConfig);
			});
		}
	}
}

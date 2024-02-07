import express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import path from 'path';
import fs from 'fs';
import { StreamerConnection } from './streamer_connection';
import { PlayerConnection } from './player_connection';
import { SFUConnection } from './sfu_connection';
import { Logger } from './logger';

const app = express();
const server = http.createServer(app);

const streamerPort = 8888;
const playerPort = 80;
const sfuPort = 8889;
const clientConfig = { peerConnectionOptions: {} };

const streamerServer = new WebSocket.Server({ port: streamerPort, backlog: 1 });
streamerServer.on('connection', (ws: WebSocket, reqest: any) => {
	Logger.log(`New streamer connection...`);
	const temporaryId = reqest.connection.remoteAddress;
	const newServer = new StreamerConnection(temporaryId, ws, clientConfig);
});

const playerServer = new WebSocket.Server({ server: server });
playerServer.on('connection', (ws: WebSocket, reqest: any) => {
	Logger.log(`New player connection...`);
	const newPlayer = new PlayerConnection(ws, clientConfig);
});

const sfuServer = new WebSocket.Server({ port: sfuPort, backlog: 1 });
sfuServer.on('connection', (ws: WebSocket, reqest: any) => {
	Logger.log(`New SFU connection...`);
	const newSFU = new SFUConnection(ws, clientConfig);
});

server.listen(80, function () {
	Logger.log('Http listening on *: 80');
});

// Request has been sent to site root, send the homepage file
app.use('/', express.static('Public'));

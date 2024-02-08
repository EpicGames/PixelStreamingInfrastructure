import express from 'express';
import * as http from 'http';
import { SignallingServer } from './SignallingServer';
import { Logger } from './Logger';

const app = express();
const server = http.createServer(app);

const clientConfig = { peerConnectionOptions: {} };

const signallingServer = new SignallingServer({ streamerPort: 8888, sfuPort: 8889, httpServer: server, clientConfig });

server.listen(80, function () {
	Logger.info('Http listening on *: 80');
});

// Request has been sent to site root, send the homepage file
app.use('/', express.static('Public'));

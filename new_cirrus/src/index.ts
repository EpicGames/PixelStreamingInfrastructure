import express from 'express';
import * as http from 'http';
import { SignallingServer } from './SignallingServer';
import { WebServer } from './WebServer';
import { InitLogging, Logger } from './Logger';

InitLogging({
    logDir: 'logs',
    logMessagesToConsole: true,
    logLevelConsole: 'debug',
    logLevelFile: 'info',
});

const app = express();
const server = http.createServer(app);
const clientConfig = { peerConnectionOptions: {} };
const signallingServer = new SignallingServer({ streamerPort: 8888, sfuPort: 8889, httpServer: server, clientConfig });
const webServer = new WebServer(app, server, { root: '.', homepageFile: 'player.html' });

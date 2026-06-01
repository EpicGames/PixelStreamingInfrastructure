// Copyright Epic Games, Inc. All Rights Reserved.
import http from 'http';
import https from 'https';
import * as wslib from 'ws';
import { StreamerConnection } from './StreamerConnection';
import { PlayerConnection } from './PlayerConnection';
import { SFUConnection } from './SFUConnection';
import { Logger } from './Logger';
import { StreamerRegistry, StreamerIdAuthorizer } from './StreamerRegistry';
import { PlayerRegistry } from './PlayerRegistry';
import {
    Messages,
    MessageHelpers,
    SignallingProtocol,
    KeepaliveMonitor
} from '@epicgames-ps/lib-pixelstreamingcommon-ue5.8';
import { stringify } from './Utils';

/**
 * An interface describing the possible options to pass when creating
 * a new SignallingServer object.
 */
export interface IServerConfig {
    // An http server to use for player connections rather than a port. Not needed if playerPort or httpsServer supplied.
    httpServer?: http.Server;

    // An https server to use for player connections rather than a port. Not needed if playerPort or httpServer supplied.
    httpsServer?: https.Server;

    // The port to listen on for streamer connections.
    streamerPort: number;

    // The port to listen on for player connections. Not needed if httpServer or httpsServer supplied.
    playerPort?: number;

    // The port to listen on for SFU connections. If not supplied SFU connections will be disabled.
    sfuPort?: number;

    // The peer configuration object to send to peers in the config message when they connect.
    peerOptions: unknown;

    // Additional websocket options for the streamer listening websocket.
    streamerWsOptions?: wslib.ServerOptions;

    // Additional websocket options for the player listening websocket.
    playerWsOptions?: wslib.ServerOptions;

    // Additional websocket options for the SFU listening websocket.
    sfuWsOptions?: wslib.ServerOptions;

    // Max number of players per streamer.
    maxSubscribers?: number;

    // Idle timeout in milliseconds after which a player that has stopped responding to keepalive
    // pings is forcibly disconnected. 0 (the default) disables the check.
    playerKeepaliveTimeout?: number;

    // Optional hook to authorize (or override) the id a streamer registers as when it identifies
    // itself. This is the seam for consumer-supplied anti-squatting / ownership policy; the project
    // ships no authentication of its own. See StreamerIdAuthorizer. When omitted, the default
    // behaviour is unchanged (requested id accepted, numeric suffix appended on collision).
    authorizeStreamerId?: StreamerIdAuthorizer;
}

export type ProtocolConfig = {
    [key: string]: any;
};

/**
 * The main signalling server object.
 * Contains a streamer and player registry and handles setting up of websockets
 * to listen for incoming connections.
 */
export class SignallingServer {
    config: IServerConfig;
    protocolConfig: ProtocolConfig;
    streamerRegistry: StreamerRegistry;
    playerRegistry: PlayerRegistry;
    startTime: Date;

    /**
     * Initializes the server object and sets up listening sockets for streamers
     * players and optionally SFU connections.
     * @param config - A collection of options for this server.
     */
    constructor(config: IServerConfig) {
        Logger.debug('Started SignallingServer with config: %s', stringify(config));

        this.config = config;
        this.streamerRegistry = new StreamerRegistry(config.authorizeStreamerId);
        this.playerRegistry = new PlayerRegistry();
        this.protocolConfig = {
            protocolVersion: SignallingProtocol.SIGNALLING_VERSION,
            peerConnectionOptions: this.config.peerOptions || {}
        };
        this.startTime = new Date();

        if (!config.playerPort && !config.httpServer && !config.httpsServer) {
            Logger.error('No player port, http server or https server supplied to SignallingServer.');
            return;
        }

        // Streamer connections
        const streamerServer = new wslib.WebSocketServer({
            port: config.streamerPort,
            backlog: 1,
            ...config.streamerWsOptions
        });
        streamerServer.on('connection', this.onStreamerConnected.bind(this));
        Logger.info(`Listening for streamer connections on port ${config.streamerPort}`);

        // Player connections
        const server = config.httpsServer || config.httpServer;
        const playerServer = new wslib.WebSocketServer({
            server: server,
            port: server ? undefined : config.playerPort,
            ...config.playerWsOptions
        });
        playerServer.on('connection', this.onPlayerConnected.bind(this));
        if (!config.httpServer && !config.httpsServer) {
            Logger.info(`Listening for player connections on port ${config.playerPort}`);
        }

        // Optional SFU connections
        if (config.sfuPort) {
            const sfuServer = new wslib.WebSocketServer({
                port: config.sfuPort,
                backlog: 1,
                ...config.sfuWsOptions
            });
            sfuServer.on('connection', this.onSFUConnected.bind(this));
            Logger.info(`Listening for SFU connections on port ${config.sfuPort}`);
        }
    }

    private sendConfigMessage(connection: { sendMessage(msg: Messages.config): void }): void {
        // peer connection options is a general field with all optional fields;
        // it doesnt play nice with mergePartial so we just add it verbatim
        const message: Messages.config = MessageHelpers.createMessage(Messages.config, this.protocolConfig);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        message.peerConnectionOptions = this.protocolConfig['peerConnectionOptions'];
        connection.sendMessage(message);
    }

    private onStreamerConnected(ws: wslib.WebSocket, request: http.IncomingMessage) {
        Logger.info(`New streamer connection: %s`, request.socket.remoteAddress);

        const newStreamer = new StreamerConnection(this, ws, request.socket.remoteAddress, request);
        newStreamer.maxSubscribers = this.config.maxSubscribers || 0;

        // add it to the registry and when the transport closes, remove it.
        this.streamerRegistry.add(newStreamer);
        newStreamer.transport.on('close', () => {
            this.streamerRegistry.remove(newStreamer);
            Logger.info(
                `Streamer %s (%s) disconnected.`,
                newStreamer.streamerId,
                request.socket.remoteAddress
            );
        });

        this.sendConfigMessage(newStreamer);
    }

    private onPlayerConnected(ws: wslib.WebSocket, request: http.IncomingMessage) {
        Logger.info(`New player connection: %s (%s)`, request.socket.remoteAddress, request.url);

        const newPlayer = new PlayerConnection(this, ws, request.socket.remoteAddress, request);

        // add it to the registry and when the transport closes, remove it
        this.playerRegistry.add(newPlayer);
        newPlayer.transport.on('close', () => {
            this.playerRegistry.remove(newPlayer);
            Logger.info(`Player %s (%s) disconnected.`, newPlayer.playerId, request.socket.remoteAddress);
        });

        // Optionally monitor the player connection for liveness. A player whose socket dies without
        // a clean close frame (sleeping laptop, dropped Wi-Fi, killed tab) is otherwise only removed
        // once the OS TCP keepalive eventually reaps it, leaving it subscribed in the meantime. When
        // maxSubscribers is set this can hold a slot that no live player is using. We use
        // ws.terminate() rather than a graceful close because a dead peer never completes the close
        // handshake. The monitor stops itself on transport 'close', so no manual teardown is needed.
        const keepaliveTimeout = this.config.playerKeepaliveTimeout || 0;
        if (keepaliveTimeout > 0) {
            const keepalive = new KeepaliveMonitor(newPlayer.protocol, keepaliveTimeout);
            keepalive.onTimeout = () => {
                Logger.info(
                    `Player %s (%s) failed keepalive - terminating dead connection.`,
                    newPlayer.playerId,
                    request.socket.remoteAddress
                );
                ws.terminate();
            };
        }

        this.sendConfigMessage(newPlayer);
    }

    private onSFUConnected(ws: wslib.WebSocket, request: http.IncomingMessage) {
        Logger.info(`New SFU connection: %s`, request.socket.remoteAddress);
        const newSFU = new SFUConnection(this, ws, request.socket.remoteAddress, request);

        // SFU acts as both a streamer and player
        this.streamerRegistry.add(newSFU);
        this.playerRegistry.add(newSFU);
        newSFU.transport.on('close', () => {
            this.streamerRegistry.remove(newSFU);
            this.playerRegistry.remove(newSFU);
            Logger.info(`SFU %s (%s) disconnected.`, newSFU.streamerId, request.socket.remoteAddress);
        });

        this.sendConfigMessage(newSFU);
    }
}

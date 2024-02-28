import net from 'net';
import { StreamerRegistry } from './StreamerRegistry'
import { PlayerRegistry } from './PlayerRegistry'
import { Logger } from './Logger';

export interface IMatchmakerConfig {
    // The public ip/hostname of the signalling server
    publicIp: string;

    // The port that the signalling server is running on
    publicPort: number;

    // The ip/hostname of the matchmaker application
    address: string;

    // The port the matchmaker is listening on for signalling connections.
    port: number;

    // Is the signalling server using https?
    https: boolean;

    // Delay in seconds before attempting a reconnection after a connection loss.
    retryInterval: number;

    // Delay in seconds between keep alive pings to the matchmaker.
    keepAliveInterval: number;
}

/**
 * This class handles connecting and reconnecting to a matchmaker service and
 * will notify the matchmaker of streamer and player added/removed events that
 * are emitted from the respective registries.
 */
export class MatchmakerConnection {
    // The supplied configuration for the matchmaker connection.
    config: IMatchmakerConfig;
    private socket: net.Socket;
    private streamerRegistry: StreamerRegistry;
    private playerRegistry: PlayerRegistry;

    /**
     * Initializes the matchmaker connection and attempts a connection to the given
     * address and port immediately. Will automatically try to reconnect on connection
     * loss.
     * @param config - The matchmaker configuration.
     * @param streamerRegistry - The signalling server streamer registry. This is used to notify the matchmaker of streamers being added/removed.
     * @param playerRegistry - The signalling server player registry. This is used to notify the matchmaker of players being added/removed.
     */
    constructor(config: IMatchmakerConfig, streamerRegistry: StreamerRegistry, playerRegistry: PlayerRegistry) {
        this.config = config;
        this.socket = new net.Socket();
        this.streamerRegistry = streamerRegistry;
        this.playerRegistry = playerRegistry;

        this.socket.on('connect', this.onConnected.bind(this));
        this.socket.on('error', this.onError.bind(this));
        this.socket.on('end', this.onEnded.bind(this));
        this.socket.on('close', this.onClosed.bind(this));

        streamerRegistry.on('added', this.onStreamerAdded.bind(this));
        streamerRegistry.on('removed', this.onStreamerRemoved.bind(this));

        playerRegistry.on('added', this.onPlayerAdded.bind(this));
        playerRegistry.on('removed', this.onPlayerRemoved.bind(this));

        this.connect();
    }

    private connect(): void {
        Logger.info(`Matchmaker connecting to ${this.config.address}:${this.config.port}`)
        this.socket.connect(this.config.port, this.config.address);
    }

    private onConnected(): void {
        Logger.info(`Matchmaker connected.`);
        this.startKeepAlive();

        const message = {
            type: 'connect',
            address: this.config.publicIp,
            port: this.config.publicPort,
            https: this.config.https,
            ready: !this.streamerRegistry.empty(),
            playerConnected: !this.playerRegistry.empty()
        };

        this.socket.write(JSON.stringify(message));
    }

    private onError(): void {
        Logger.info(`Matchmaker connection error.`);
    }

    private onEnded(): void {
        Logger.info(`Matchmaker connection ended.`);
    }

    private onClosed(): void {
        Logger.info(`Matchmaker connection closed`);
        this.socket.setKeepAlive(true, 60000); // Keeps it alive for 60 seconds
        setTimeout(() => {
            Logger.info(`Attempting matchmaker reconnection...`);
            this.connect();
        }, this.config.retryInterval * 1000);
    }

    private startKeepAlive(): void {
        setInterval(() => {
            const message = { type: 'ping' };
            this.socket.write(JSON.stringify(message));
        }, this.config.keepAliveInterval * 1000);
    }

    private onStreamerAdded() {
        const message = { type: 'streamerConnected' };
        this.socket.write(JSON.stringify(message));
    }

    private onStreamerRemoved() {
        const message = { type: 'streamerDisconnected' };
        this.socket.write(JSON.stringify(message));
    }

    private onPlayerAdded() {
        const message = { type: 'clientConnected' };
        this.socket.write(JSON.stringify(message));
    }

    private onPlayerRemoved() {
        const message = { type: 'clientDisconnected' };
        this.socket.write(JSON.stringify(message));
    }
}

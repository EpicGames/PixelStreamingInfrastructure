import { Messages,
		 SignallingProtocol } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { PlayerConnection } from './player_connection';
import { Logger } from './Logging/Logger';
import { EventEmitter } from 'events';

export interface IPlayer {
	playerId: string;
	protocol: SignallingProtocol;
	getIdentifier(): string;
}

export class PlayerRegistry {
	players: Map<string, IPlayer> = new Map();
	playerCount: number;
	nextPlayerId: number;
	events: EventEmitter;

	constructor() {
		this.players = new Map();
		this.playerCount = 0;
		this.nextPlayerId = 0;
		this.events = new EventEmitter();
	}

	getUniquePlayerId(): string {
		const newPlayerId = `Player${this.nextPlayerId}`;
		this.nextPlayerId++;
		return newPlayerId;
	}

	registerPlayer(player: IPlayer): void {
		this.players.set(player.playerId, player);
		this.playerCount++;
		this.events.emit('added', player.playerId);
		Logger.info(`Registered new player: ${player.playerId}`);
	}

	unregisterPlayer(playerId: string): void {
		if (!this.players.has(playerId)) {
			return;
		}

		this.events.emit('added', playerId);
		this.players.delete(playerId);
		this.playerCount--;

		Logger.info(`Unregistered player: ${playerId}`);
	}

	has(playerId: string): boolean {
		return this.players.has(playerId);
	}

	get(playerId: string): IPlayer | undefined {
		return this.players.get(playerId);
	}
}

export const Players = new PlayerRegistry();

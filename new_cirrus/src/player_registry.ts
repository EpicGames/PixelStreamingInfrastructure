import { Messages,
		 MessageHelpers,
		 SignallingProtocol } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { PlayerConnection, PlayerType } from './player_connection';
import { Logger } from './logger';

export interface IPlayer {
	playerId: string | undefined;
	subscribedToStreamerId: string | null;
	protocol: SignallingProtocol;

	onStreamerIdChanged(newId: string): void;
	onStreamerDisconnected(): void;
}

export class PlayerRegistry {
	players: Map<string, IPlayer> = new Map();
	playerCount: number;
	nextPlayerId: number;

	constructor() {
		this.players = new Map();
		this.playerCount = 0;
		this.nextPlayerId = 0;
	}

	registerPlayer(player: IPlayer): void {
		const newPlayerId = `Player${this.nextPlayerId}`;
		this.nextPlayerId++;
		player.playerId = newPlayerId;
		this.players.set(player.playerId, player);
		this.playerCount++;
		Logger.info(`Registered new player: ${player.playerId}`);
	}

	unregisterPlayer(playerId: string): void {
		const player = this.players.get(playerId);
		if (player) {
			this.players.delete(playerId);
			this.playerCount--;
		}
		Logger.info(`Unregistered player: ${playerId}`);
	}

	has(playerId: string): boolean {
		return this.players.has(playerId);
	}

	get(playerId: string): IPlayer | undefined {
		return this.players.get(playerId);
	}

	onStreamerIdChanged(oldId: string, newId: string) {
		const clonedMap = new Map(this.players); // work on a cloned map to avoid async issues
		for (let player of clonedMap.values()) {
			if (player.subscribedToStreamerId == oldId) {
				player.onStreamerIdChanged(newId);
			}
		}
	}

	onStreamerDisconnected(streamerId: string) {
		const clonedMap = new Map(this.players);
		for (let player of clonedMap.values()) {
			if (player.subscribedToStreamerId == streamerId) {
				player.onStreamerDisconnected();
			}
		}
	}
}

export const Players = new PlayerRegistry();

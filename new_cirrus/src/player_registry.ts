import { Messages,
		 MessageHelpers } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { PlayerConnection, PlayerType } from './player_connection';

export class PlayerRegistry {
	players: Map<string, PlayerConnection> = new Map();
	playerCount: number;
	nextPlayerId: number;

	constructor() {
		this.players = new Map();
		this.playerCount = 0;
		this.nextPlayerId = 0;
	}

	registerPlayer(player: PlayerConnection): void {
		const newPlayerId = `Player${this.nextPlayerId}`;
		this.nextPlayerId++;
		player.id = newPlayerId;
		this.players.set(player.id, player);
		this.playerCount++;
	}

	unregisterPlayer(playerId: string): void {
		const player = this.players.get(playerId);
		if (player) {
			player.unsubscribe();
			this.players.delete(playerId);
			this.playerCount--;
		}
	}

	has(playerId: string): boolean {
		return this.players.has(playerId);
	}

	get(playerId: string): PlayerConnection | undefined {
		return this.players.get(playerId);
	}

	updateStreamerId(oldId: string, newId: string) {
		const renameMessage = MessageHelpers.createMessage(Messages.streamerIdChanged, { newID: newId });
		const clonedMap = new Map(this.players); // work on a cloned map to avoid async issues
		for (let player of clonedMap.values()) {
			if (player.streamerId == oldId) {
				player.protocol.sendMessage(renameMessage);
			 	player.streamerId = newId;
			}
		}
	}

	streamerDisconnected(streamerId: string) {
		const clonedMap = new Map(this.players);
		for (let player of clonedMap.values()) {
			if (player.streamerId == streamerId) {
			 	if (player.type == PlayerType.SFU) {
			 		// SFU just gets unsubscribed
					player.unsubscribe();
				} else {
					// players get disconnected
					player.disconnect();
				}
			}
		}
	}
}

export const Players = new PlayerRegistry();

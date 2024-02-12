import { SignallingProtocol, BaseMessage } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { EventEmitter } from 'events';
import { Logger } from './Logger';
import { IMessageLogger } from './LoggingUtils';

export interface IPlayer extends IMessageLogger {
	playerId: string;
	protocol: SignallingProtocol;

	sendMessage(message: BaseMessage): void;
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

	add(player: IPlayer): void {
		player.playerId = this.getUniquePlayerId();
		this.players.set(player.playerId, player);
		this.playerCount++;
		this.events.emit('added', player.playerId);
		Logger.info(`Registered new player: ${player.playerId}`);
	}

	remove(player: IPlayer): void {
		if (!this.players.has(player.playerId)) {
			return;
		}

		this.events.emit('removed', player.playerId);
		this.players.delete(player.playerId);
		this.playerCount--;

		Logger.info(`Unregistered player: ${player.playerId}`);
	}

	has(playerId: string): boolean {
		return this.players.has(playerId);
	}

	get(playerId: string): IPlayer | undefined {
		return this.players.get(playerId);
	}

	private getUniquePlayerId(): string {
		const newPlayerId = `Player${this.nextPlayerId}`;
		this.nextPlayerId++;
		return newPlayerId;
	}
}

import { StreamerConnection } from './streamer_connection';
import { Players } from './player_registry';
import { Logger } from './logger';

export class StreamerRegistry {
	streamers: Map<string, StreamerConnection>;
	uniqueLegacyStreamerPostfix: number;
	LegacyStreamerPrefix: string = "__LEGACY_STREAMER__"; // old streamers that dont know how to ID will be assigned this id prefix.

	constructor() {
		this.streamers = new Map();
		this.uniqueLegacyStreamerPostfix = 0;
	}

	registerStreamer(id: string, streamer: StreamerConnection) {
		// remove any existing streamer id
		if (!!streamer.id) {
			Players.updateStreamerId(streamer.id, id);
			this.streamers.delete(streamer.id);
		}

		// make sure the id is unique
		streamer.id = this.sanitizeStreamerId(id);
		streamer.idCommitted = true;

		this.streamers.set(streamer.id, streamer);
		Logger.log(`Registered new streamer: ${streamer.id}`);
	}

	unregisterStreamer(id: string) {
		if (!this.streamers.has(id)) {
			return;
		}

		// SFU stuff
		// let sfuPlayer = getSFUForStreamer(streamer.id);
		// if (sfuPlayer) {
		// 	const msg = { type: "streamerDisconnected" };
		// 	logOutgoing(sfuPlayer.id, msg);
		// 	sfuPlayer.sendTo(msg);
		// 	disconnectAllPlayers(sfuPlayer.id);
		// }

		Players.streamerDisconnected(id);
		this.streamers.delete(id);
	}

	getDefault(): StreamerConnection | undefined {
		if (this.empty()) {
			return;
		}
		return this.streamers.entries().next().value[0];
	}

	empty(): boolean {
		return this.streamers.size == 0;
	}

	has(streamerId: string): boolean {
		return this.streamers.has(streamerId);
	}

	get(streamerId: string): StreamerConnection | undefined {
		return this.streamers.get(streamerId);
	}

	getStreamerIds(): string[] {
		const ids = [];
		for (let [streamerId, streamer] of this.streamers) {
			ids.push(streamerId);
		}
		return ids;
	}

	private sanitizeStreamerId(id: string) {
		let maxPostfix = -1;
		for (let [streamerId, streamer] of this.streamers) {
			const idMatchRegex = /^(.*?)(\d*)$/;
			const [, baseId, postfix] = streamerId.match(idMatchRegex)!;
			// if the id is numeric then base id will be empty and we need to compare with the postfix
			if ((baseId != '' && baseId != id) || (baseId == '' && postfix != id)) {
				continue;
			}
			const numPostfix = Number(postfix);
			if (numPostfix > maxPostfix) {
				maxPostfix = numPostfix
			}
		}
		if (maxPostfix >= 0) {
			return id + (maxPostfix + 1);
		}
		return id;
	}

	getUniqueLegacyStreamerId() {
		const finalId = this.LegacyStreamerPrefix + this.uniqueLegacyStreamerPostfix;
		++this.uniqueLegacyStreamerPostfix;
		return finalId;
	}
}

export const Streamers = new StreamerRegistry();

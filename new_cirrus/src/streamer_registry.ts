import { StreamerConnection } from './streamer_connection';
import { IPlayer, Players } from './player_registry';
import { Logger } from './Logging/Logger';
import { SignallingProtocol, MessageHelpers, Messages } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { EventEmitter } from 'events';

export interface IStreamer {
	streamerId: string;
	protocol: SignallingProtocol;
	idCommitted: boolean;
	events: EventEmitter;
	getIdentifier(): string;
}

export class StreamerRegistry {
	streamers: Map<string, IStreamer>;
	uniqueLegacyStreamerPostfix: number;
	LegacyStreamerPrefix: string = "__LEGACY_STREAMER__"; // old streamers that dont know how to ID will be assigned this id prefix.

	constructor() {
		this.streamers = new Map();
		this.uniqueLegacyStreamerPostfix = 0;
	}

	registerStreamer(id: string, streamer: IStreamer) {
		// if the streamer was previously registered, trigger a id change event
		// and remove the old entry
		if (streamer.idCommitted) {
			this.streamers.delete(streamer.streamerId);
		}

		// make sure the id is unique
		streamer.streamerId = this.sanitizeStreamerId(id);
		streamer.idCommitted = true;

		this.streamers.set(streamer.streamerId, streamer);

		Logger.log(`Registered new streamer: ${streamer.streamerId}`);
	}

	unregisterStreamer(id: string) {
		if (!this.streamers.has(id)) {
			return;
		}

		this.streamers.delete(id);

		Logger.log(`Unregistered streamer: ${id}`);
	}

	getDefault(): IStreamer | undefined {
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

	get(streamerId: string): IStreamer | undefined {
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

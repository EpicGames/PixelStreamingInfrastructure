import { ITransport, SignallingProtocol, Messages, MessageHelpers, BaseMessage } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { EventEmitter } from 'events';
import { Logger } from './Logger';
import { IMessageLogger } from './LoggingUtils';

export interface IStreamer extends EventEmitter, IMessageLogger  {
	streamerId: string;
	transport: ITransport;
	protocol: SignallingProtocol;
	streaming: boolean;

	sendMessage(message: BaseMessage): void;
}

export class StreamerRegistry {
	streamers: IStreamer[];
	defaultStreamerIdPrefix: string = "UnknownStreamer";

	constructor() {
		this.streamers = [];
	}

	add(streamer: IStreamer): boolean {
		streamer.streamerId = this.sanitizeStreamerId(streamer.streamerId);

		if (this.find(streamer.streamerId)) {
			Logger.error(`StreamerRegistry: Tried to register streamer ${streamer.streamerId} but that id already exists.`);
			return false;
		}

		this.streamers.push(streamer);

		// request that the new streamer id itself.
		streamer.protocol.on(Messages.endpointId.typeName, this.onEndpointId.bind(this, streamer));
		streamer.sendMessage(MessageHelpers.createMessage(Messages.identify));

		return true;
	}

	remove(streamer: IStreamer): boolean {
		const index = this.streamers.indexOf(streamer);
		if (index == -1) {
			Logger.debug(`StreamerRegistry: Tried to remove streamer ${streamer.streamerId} but it doesn't exist`);
			return false;
		}
		this.streamers.splice(index, 1);
		return true;
	}

	find(streamerId: string): IStreamer | undefined {
		return this.streamers.find((streamer) => streamer.streamerId == streamerId);
	}

	private onEndpointId(streamer: IStreamer, message: Messages.endpointId): void {
		const oldId = streamer.streamerId;

		// id might conflict or be invalid so here we sanitize it
		streamer.streamerId = this.sanitizeStreamerId(message.id);

		Logger.debug(`StreamerRegistry: Streamer id change. ${oldId} -> ${streamer.streamerId}`);
		streamer.emit('id_changed', streamer.streamerId);

		// because we might have sanitized the id, we confirm the id back to the streamer
		streamer.sendMessage(MessageHelpers.createMessage(Messages.endpointIdConfirm, { committedId: streamer.streamerId }));
	}

	getFirstStreamerId(): string | null {
		if (this.empty()) {
			return null;
		}
		return this.streamers[0].streamerId;
	}

	empty(): boolean {
		return this.streamers.length == 0;
	}

	getStreamerIds(): string[] {
		const ids = [];
		for (let streamer of this.streamers) {
			ids.push(streamer.streamerId);
		}
		return ids;
	}

	private sanitizeStreamerId(id: string): string {
		// create a default id if none supplied
		if (!id) {
			id = this.defaultStreamerIdPrefix;
		}

		// search for existing streamerId and optionally append a numeric value
		let maxPostfix = -1;
		for (let streamer of this.streamers) {
			const idMatchRegex = /^(.*?)(\d*)$/;
			const [, baseId, postfix] = streamer.streamerId.match(idMatchRegex)!;
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
}

import { ITransport, SignallingProtocol, Messages, MessageHelpers, BaseMessage } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { EventEmitter } from 'events';
import { Logger } from './Logger';
import { IMessageLogger } from './LoggingUtils';
import { IPlayerInfo } from './PlayerRegistry';

/**
 * An interface that describes a streamer that can be added to the
 * streamer registry.
 */
export interface IStreamer extends EventEmitter, IMessageLogger  {
	streamerId: string;
	transport: ITransport;
	protocol: SignallingProtocol;
	streaming: boolean;

	sendMessage(message: BaseMessage): void;
	getStreamerInfo(): IStreamerInfo;
}

/**
 * Used by the API to describe a streamer.
 */
export interface IStreamerInfo {
	streamerId: string,
	type: string,
	streaming: boolean,
	subscribers: IPlayerInfo[],
}

/**
 * Handles all the streamer connections of a signalling server and
 * can be used to lookup connections by id etc.
 * Fires events when streamers are added or removed.
 * Events:
 *   'added': (playerId: string) Player was added.
 *   'removed': (playerId: string) Player was removed.
 */
export class StreamerRegistry extends EventEmitter {
	streamers: IStreamer[];
	defaultStreamerIdPrefix: string = "UnknownStreamer";

	constructor() {
		super();
		this.streamers = [];
	}

	/**
	 * Adds a streamer to the registry. If the streamer already has an id
	 * it will be sanitized (checked against existing ids and altered if
	 * there are collisions), or if it has no id it will be assigned a
	 * default unique id.
	 * @returns True if the add was successful.
	 */
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

		this.emit('added', streamer.streamerId);

		return true;
	}

	/**
	 * Removes a streamer from the registry. If the streamer isn't found
	 * it does nothing.
	 * @return True if the streamer was removed.
	 */
	remove(streamer: IStreamer): boolean {
		const index = this.streamers.indexOf(streamer);
		if (index == -1) {
			Logger.debug(`StreamerRegistry: Tried to remove streamer ${streamer.streamerId} but it doesn't exist`);
			return false;
		}
		this.streamers.splice(index, 1);
		this.emit('removed', streamer.streamerId);
		return true;
	}

	/**
	 * Attempts to find the given streamer id in the registry.
	 */
	find(streamerId: string): IStreamer | undefined {
		return this.streamers.find((streamer) => streamer.streamerId == streamerId);
	}

	/**
	 * Used by players who haven't subscribed but try to send a message.
	 * This is to cover legacy connections that do not know how to subscribe.
	 * The player will be assigned the first streamer in the list.
	 * @return The first streamerId in the registry or null if there are none.
	 */
	getFirstStreamerId(): string | null {
		if (this.empty()) {
			return null;
		}
		return this.streamers[0].streamerId;
	}

	/**
	 * Returns true when the registry is empty.
	 */
	empty(): boolean {
		return this.streamers.length == 0;
	}

	/**
	 * Returns a list of streaming streamers.
	 */
	getStreamerIds(): string[] {
		const ids = [];
		for (let streamer of this.streamers) {
			if (streamer.streaming) {
				ids.push(streamer.streamerId);
			}
		}
		return ids;
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

// Copyright Epic Games, Inc. All Rights Reserved.
import {
    ITransport,
    SignallingProtocol,
    Messages,
    MessageHelpers,
    BaseMessage,
    EventEmitter
} from '@epicgames-ps/lib-pixelstreamingcommon-ue5.7';
import type { IncomingMessage } from 'http';
import { Logger } from './Logger';
import { IMessageLogger } from './LoggingUtils';
import { IPlayerInfo } from './PlayerRegistry';

/**
 * An interface that describes a streamer that can be added to the
 * streamer registry.
 */
export interface IStreamer extends EventEmitter, IMessageLogger {
    streamerId: string;
    transport: ITransport;
    protocol: SignallingProtocol;
    streaming: boolean;
    maxSubscribers: number;
    subscribers: Set<string>;
    // The HTTP upgrade request that opened this connection, if available. The signalling server
    // itself does not read this, but it lets a consumer-supplied verifyClient (or other front door)
    // attach an authenticated identity to the request and recover it here for authorization
    // decisions. The project intentionally ships no authentication of its own.
    request?: IncomingMessage;

    sendMessage(message: BaseMessage): void;
    getStreamerInfo(): IStreamerInfo;
}

/**
 * The details of a streamer's request to be known by a given id, passed to a
 * {@link StreamerIdAuthorizer} so a consumer can decide whether to allow it.
 */
export interface IStreamerIdAuthRequest {
    // The streamer connection requesting the id. Use `streamer.request` to recover any identity a
    // consumer attached at connection time.
    streamer: IStreamer;
    // The raw id the streamer asked to be known by (the value it sent in its endpointId message).
    requestedId: string;
    // The unique id the registry would assign by default (the requested id, with a numeric suffix
    // appended if it collided with an existing streamer).
    sanitizedId: string;
    // True when the requested id was already taken and so differs from the id the registry would
    // otherwise commit. This is the condition an id-squatting attacker relies on.
    collided: boolean;
}

/**
 * An optional consumer-supplied hook that decides the id a streamer is allowed to register as.
 * Return the id to commit (the sanitized id to accept the default, or any other unique id to
 * override, e.g. to namespace per tenant), or null to reject the streamer and disconnect it.
 * This is the seam for implementing anti-squatting / ownership policy without the project
 * providing an authentication scheme.
 */
export type StreamerIdAuthorizer = (request: IStreamerIdAuthRequest) => string | null;

/**
 * Used by the API to describe a streamer.
 */
export interface IStreamerInfo {
    streamerId: string;
    type: string;
    streaming: boolean;
    remoteAddress: string | undefined;
    subscribers: IPlayerInfo[];
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
    defaultStreamerIdPrefix: string = 'UnknownStreamer';
    // Optional consumer hook to authorize/override the id a streamer registers as. See
    // {@link StreamerIdAuthorizer}. When unset the registry keeps its default behaviour of
    // accepting the requested id and appending a numeric suffix on collision.
    authorizeStreamerId?: StreamerIdAuthorizer;

    constructor(authorizeStreamerId?: StreamerIdAuthorizer) {
        super();
        this.streamers = [];
        this.authorizeStreamerId = authorizeStreamerId;
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
            Logger.error(
                `StreamerRegistry: Tried to register streamer ${streamer.streamerId} but that id already exists.`
            );
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
     * @returns True if the streamer was removed.
     */
    remove(streamer: IStreamer): boolean {
        const index = this.streamers.indexOf(streamer);
        if (index === -1) {
            Logger.debug(
                `StreamerRegistry: Tried to remove streamer ${streamer.streamerId} but it doesn't exist`
            );
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
        return this.streamers.find((streamer) => streamer.streamerId === streamerId);
    }

    /**
     * Used by players who haven't subscribed but try to send a message.
     * This is to cover legacy connections that do not know how to subscribe.
     * The player will be assigned the first streamer in the list.
     * @returns The first streamerId in the registry or null if there are none.
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
        return this.streamers.length === 0;
    }

    /**
     * Returns the total number of connected streamers.
     */
    count(): number {
        return this.streamers.length;
    }

    private onEndpointId(streamer: IStreamer, message: Messages.endpointId): void {
        const oldId = streamer.streamerId;

        // id might conflict or be invalid so here we sanitize it
        const sanitizedId = this.sanitizeStreamerId(message.id);

        let committedId: string | null = sanitizedId;
        if (this.authorizeStreamerId) {
            // Let the consumer accept the default id, override it (e.g. namespace per tenant), or
            // reject the registration entirely. This is where anti-squatting policy lives.
            committedId = this.authorizeStreamerId({
                streamer,
                requestedId: message.id,
                sanitizedId,
                collided: !!message.id && sanitizedId !== message.id
            });

            if (committedId === null) {
                Logger.warn(
                    `StreamerRegistry: streamer id '${message.id}' (was ${oldId}) rejected by authorizer. Disconnecting.`
                );
                this.remove(streamer);
                streamer.protocol.disconnect(1008, 'streamer id not authorized');
                return;
            }

            // An override must remain unique or it would corrupt id-based lookups. If the consumer
            // hands back an id already held by a different streamer we reject rather than clobber.
            const existing = this.find(committedId);
            if (existing && existing !== streamer) {
                Logger.error(
                    `StreamerRegistry: authorizer returned id '${committedId}' which is already in use. Disconnecting.`
                );
                this.remove(streamer);
                streamer.protocol.disconnect(1008, 'streamer id not authorized');
                return;
            }
        }

        streamer.streamerId = committedId;

        Logger.debug(`StreamerRegistry: Streamer id change. ${oldId} -> ${streamer.streamerId}`);
        streamer.emit('id_changed', streamer.streamerId);

        // because we might have sanitized the id, we confirm the id back to the streamer
        streamer.sendMessage(
            MessageHelpers.createMessage(Messages.endpointIdConfirm, { committedId: streamer.streamerId })
        );
    }

    private sanitizeStreamerId(id: string): string {
        // create a default id if none supplied
        if (!id) {
            id = this.defaultStreamerIdPrefix;
        }

        // search for existing streamerId and optionally append a numeric value
        let maxPostfix = -1;
        for (const streamer of this.streamers) {
            const idMatchRegex = /^(.*?)(\d*)$/;

            const [, baseId, postfix] = streamer.streamerId.match(idMatchRegex)!;
            // if the id is numeric then base id will be empty and we need to compare with the postfix
            if ((baseId !== '' && baseId !== id) || (baseId === '' && postfix !== id)) {
                continue;
            }
            const numPostfix = Number(postfix);
            if (numPostfix > maxPostfix) {
                maxPostfix = numPostfix;
            }
        }
        if (maxPostfix >= 0) {
            return id + (maxPostfix + 1);
        }
        return id;
    }
}

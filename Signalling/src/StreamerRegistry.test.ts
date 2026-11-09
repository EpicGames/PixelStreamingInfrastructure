// Copyright Epic Games, Inc. All Rights Reserved.
import type WebSocket from 'ws';
import { Messages } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.8';
import { StreamerConnection } from './StreamerConnection';
import { StreamerRegistry } from './StreamerRegistry';
import { SignallingServer } from './SignallingServer';

// A streamer the registry can add and talk to, with no socket behind it.
function unconnectedStreamer(): StreamerConnection {
    return new StreamerConnection({} as unknown as SignallingServer, {} as unknown as WebSocket);
}

describe('StreamerRegistry endpointId handling', () => {
    it('treats a non-string id as no id, so a later registration still works', () => {
        const registry = new StreamerRegistry();
        const first = unconnectedStreamer();
        registry.add(first);

        // The id arrives as any JSON value; a number here used to be stored as the streamer id.
        first.protocol.emit(Messages.endpointId.typeName, { type: Messages.endpointId.typeName, id: 5 });
        expect(typeof first.streamerId).toBe('string');

        const second = unconnectedStreamer();
        expect(() => registry.add(second)).not.toThrow();
        expect(second.streamerId).not.toBe(first.streamerId);
    });
});

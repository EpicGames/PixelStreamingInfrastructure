// Copyright Epic Games, Inc. All Rights Reserved.
import type WebSocket from 'ws';
import { Messages } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.8';
import { SFUConnection } from './SFUConnection';
import { StreamerConnection } from './StreamerConnection';
import { StreamerRegistry } from './StreamerRegistry';
import { PlayerRegistry } from './PlayerRegistry';
import { SignallingServer } from './SignallingServer';

// A streamer the SFU can subscribe to, with no socket behind it.
function unconnectedStreamer(streamerId: string): StreamerConnection {
    const streamer = new StreamerConnection({} as unknown as SignallingServer, {} as unknown as WebSocket);
    streamer.streamerId = streamerId;
    return streamer;
}

describe('SFUConnection subscribe', () => {
    it('leaves the previous streamer when it subscribes to another', () => {
        const a = unconnectedStreamer('A');
        const b = unconnectedStreamer('B');
        const streamerRegistry = new StreamerRegistry();
        streamerRegistry.streamers.push(a, b);
        const server = {
            streamerRegistry,
            playerRegistry: new PlayerRegistry()
        } as unknown as SignallingServer;
        const sfu = new SFUConnection(server, {} as unknown as WebSocket);
        sfu.playerId = 'SFU1';

        sfu.protocol.emit(Messages.subscribe.typeName, {
            type: Messages.subscribe.typeName,
            streamerId: 'A'
        });
        sfu.protocol.emit(Messages.subscribe.typeName, {
            type: Messages.subscribe.typeName,
            streamerId: 'B'
        });

        expect(a.subscribers.has('SFU1')).toBe(false);
        expect(b.subscribers.has('SFU1')).toBe(true);
        // A disconnect from the old streamer must not detach the SFU from the one it is on now.
        a.emit('disconnect');
        expect(sfu.subscribedStreamer).toBe(b);
    });
});

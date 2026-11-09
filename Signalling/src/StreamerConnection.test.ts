// Copyright Epic Games, Inc. All Rights Reserved.
import type WebSocket from 'ws';
import { StreamerConnection } from './StreamerConnection';
import { SignallingServer } from './SignallingServer';

describe('StreamerConnection disconnectPlayer reason', () => {
    // A streamer with one subscribed player whose protocol records the close it is asked for.
    function streamerWithPlayer() {
        const disconnect = jest.fn();
        const player = { protocol: { disconnect } };
        const server = { playerRegistry: { get: () => player } } as unknown as SignallingServer;
        const streamer = new StreamerConnection(server, {} as unknown as WebSocket);
        streamer.subscribers = new Set(['player-1']);
        return { streamer, disconnect };
    }

    function disconnectPlayer(streamer: StreamerConnection, reason: unknown): void {
        streamer.protocol.emit('disconnectPlayer', {
            type: 'disconnectPlayer',
            playerId: 'player-1',
            reason
        });
    }

    it('passes a short string reason through', () => {
        const { streamer, disconnect } = streamerWithPlayer();
        disconnectPlayer(streamer, 'bye');
        expect(disconnect).toHaveBeenCalledWith(1011, 'bye');
    });

    it('closes without a reason when the reason is over 123 bytes', () => {
        const { streamer, disconnect } = streamerWithPlayer();
        disconnectPlayer(streamer, 'x'.repeat(124));
        expect(disconnect).toHaveBeenCalledWith(1011, undefined);
    });

    it('counts the reason in bytes, not characters', () => {
        const { streamer, disconnect } = streamerWithPlayer();
        disconnectPlayer(streamer, String.fromCharCode(0xe9).repeat(62)); // 124 bytes in UTF-8
        expect(disconnect).toHaveBeenCalledWith(1011, undefined);
    });

    it('closes without a reason when the reason is not a string', () => {
        const { streamer, disconnect } = streamerWithPlayer();
        disconnectPlayer(streamer, { length: 1 });
        expect(disconnect).toHaveBeenCalledWith(1011, undefined);
    });
});

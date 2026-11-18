// Copyright Epic Games, Inc. All Rights Reserved.
import http from 'http';
import type { IServerConfig } from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.7';
import { publicConfigView, redactPeerOptions, REDACTED } from './publicConfig';

const PEER_OPTIONS = {
    iceTransportPolicy: 'all',
    iceServers: [
        { urls: ['stun:stun.example:19302'] },
        { urls: ['turn:turn.example:3478'], username: 'staticuser', credential: 'STATIC-TURN-PASSWORD' },
        { urls: 'turn:empty.example:3478', username: '', credential: '' }
    ]
};

describe('redactPeerOptions', () => {
    it('replaces ICE usernames and credentials and keeps everything else', () => {
        expect(redactPeerOptions(PEER_OPTIONS)).toEqual({
            iceTransportPolicy: 'all',
            iceServers: [
                { urls: ['stun:stun.example:19302'] },
                { urls: ['turn:turn.example:3478'], username: REDACTED, credential: REDACTED },
                { urls: 'turn:empty.example:3478', username: '', credential: '' }
            ]
        });
    });

    it('does not modify its input', () => {
        const input = structuredClone(PEER_OPTIONS);
        redactPeerOptions(input);
        expect(input).toEqual(PEER_OPTIONS);
    });

    it('passes through peer options with no ICE servers', () => {
        for (const value of ['', undefined, null, {}, { iceServers: 'x' }]) {
            expect(redactPeerOptions(value)).toEqual(value);
        }
    });
});

describe('publicConfigView', () => {
    const server = http.createServer();
    const config: IServerConfig = {
        streamerPort: 8888,
        playerPort: 80,
        sfuPort: 8889,
        maxSubscribers: 0,
        playerKeepaliveTimeout: 30000,
        peerOptions: PEER_OPTIONS,
        httpServer: server,
        playerWsOptions: { verifyClient: () => true },
        streamerWsOptions: { host: '127.0.0.1' },
        peerOptionsProvider: () => PEER_OPTIONS,
        authorizeStreamerId: () => null
    };
    const view = publicConfigView(config, { protocolVersion: '1.3.0', peerConnectionOptions: PEER_OPTIONS });
    const body = JSON.stringify(view);

    it('lists only the allowed server config fields', () => {
        expect(Object.keys(view.config).sort()).toEqual(
            [
                'maxSubscribers',
                'peerOptions',
                'playerKeepaliveTimeout',
                'playerPort',
                'sfuPort',
                'streamerPort'
            ].sort()
        );
        expect(view.config.streamerPort).toBe(8888);
    });

    it('keeps the protocol version', () => {
        expect(view.protocolConfig.protocolVersion).toBe('1.3.0');
    });

    it('never contains the TURN credential', () => {
        expect(body).not.toContain('STATIC-TURN-PASSWORD');
        expect(body).not.toContain('staticuser');
    });

    it('does not serialize the HTTP server or WebSocket options', () => {
        expect(body).not.toContain('_connectionKey');
        expect(body).not.toContain('127.0.0.1');
    });
});

// Copyright Epic Games, Inc. All Rights Reserved.
import { SignallingServer, IPeerOptionsRequest, PeerOptionsProvider } from './SignallingServer';

const STATIC_PEER_OPTIONS = { iceServers: [{ urls: ['stun:stun.example.com:19302'] }] };

const PLAYER_REQUEST: IPeerOptionsRequest = { peerType: 'player', peerId: 'player-1' };

// The constructor binds listening sockets and the class offers no way to close them, so a test that
// built a server properly would leak a listener per case. The peer options path depends on nothing
// the constructor sets up beyond these two fields, so we supply them directly.
function serverWith(provider?: PeerOptionsProvider): SignallingServer {
    const server = Object.create(SignallingServer.prototype) as SignallingServer;
    server.config = { streamerPort: 0, peerOptions: STATIC_PEER_OPTIONS, peerOptionsProvider: provider };
    server.protocolConfig = { peerConnectionOptions: STATIC_PEER_OPTIONS };
    return server;
}

function getPeerOptions(server: SignallingServer, request: IPeerOptionsRequest): unknown {
    // Private: called through the type system rather than exported, because the behaviour under test
    // is what a connecting peer is sent, not a public API.
    return (server as unknown as { getPeerOptions(request: IPeerOptionsRequest): unknown }).getPeerOptions(
        request
    );
}

describe('SignallingServer peer options', () => {
    it('sends the configured peer options when no provider is supplied', () => {
        expect(getPeerOptions(serverWith(), PLAYER_REQUEST)).toBe(STATIC_PEER_OPTIONS);
    });

    it('sends what the provider returns', () => {
        const minted = { iceServers: [{ urls: ['turn:turn.example.com:3478'], username: 'u' }] };
        expect(
            getPeerOptions(
                serverWith(() => minted),
                PLAYER_REQUEST
            )
        ).toBe(minted);
    });

    it('tells the provider which peer is connecting', () => {
        const seen: IPeerOptionsRequest[] = [];
        const server = serverWith((request) => {
            seen.push(request);
            return {};
        });

        getPeerOptions(server, PLAYER_REQUEST);
        getPeerOptions(server, { peerType: 'streamer', peerId: 'UnknownStreamer' });

        expect(seen).toEqual([
            { peerType: 'player', peerId: 'player-1' },
            { peerType: 'streamer', peerId: 'UnknownStreamer' }
        ]);
    });

    it('falls back to the configured peer options when the provider throws', () => {
        const server = serverWith(() => {
            throw new Error('credential service unreachable');
        });
        expect(getPeerOptions(server, PLAYER_REQUEST)).toBe(STATIC_PEER_OPTIONS);
    });
});

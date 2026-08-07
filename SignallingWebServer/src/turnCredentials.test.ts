// Copyright Epic Games, Inc. All Rights Reserved.
import crypto from 'crypto';
import {
    createTurnCredentials,
    createTurnCredentialsProvider,
    hasCredentiallessTurnServer
} from './turnCredentials';

const SECRET = 'a-shared-secret';
const TTL = 3600;

// The peer options an operator would write once this feature is in use: the TURN server is named,
// but no credentials are stored anywhere.
function samplePeerOptions() {
    return {
        iceServers: [
            { urls: ['stun:stun.l.google.com:19302'] },
            { urls: ['turn:turn.example.com:3478?transport=udp', 'turn:turn.example.com:443?transport=tcp'] }
        ]
    };
}

function iceServersOf(peerOptions: unknown): Record<string, unknown>[] {
    return (peerOptions as { iceServers: Record<string, unknown>[] }).iceServers;
}

describe('createTurnCredentials', () => {
    it('puts the expiry time in the username, in seconds', () => {
        const now = 1_700_000_000_000;
        const { username } = createTurnCredentials({ secret: SECRET, ttlSeconds: TTL }, 'player-1', now);
        expect(username).toBe(`${1_700_000_000 + TTL}:player-1`);
    });

    it('signs the username with the shared secret', () => {
        const { username, credential } = createTurnCredentials(
            { secret: SECRET, ttlSeconds: TTL },
            'player-1',
            1_700_000_000_000
        );
        const expected = crypto.createHmac('sha1', SECRET).update(username).digest('base64');
        expect(credential).toBe(expected);
    });

    it('matches a known coturn use-auth-secret vector', () => {
        // Frozen on purpose. The test above recomputes the credential the same way the code does, so
        // it cannot notice the scheme itself drifting - to base64url, to hex, or to a different
        // digest. This one would fail on any of those, which is what pins us to what coturn accepts.
        const { username, credential } = createTurnCredentials(
            { secret: 'north', ttlSeconds: 3600 },
            'player-1',
            1_700_000_000_000
        );
        expect(username).toBe('1700003600:player-1');
        expect(credential).toBe('8UZc+N37gQLT4mIkDM7RaDTM+c4=');
    });

    it('issues a different credential once the clock has moved on', () => {
        const options = { secret: SECRET, ttlSeconds: TTL };
        const first = createTurnCredentials(options, 'player-1', 1_700_000_000_000);
        const second = createTurnCredentials(options, 'player-1', 1_700_000_060_000);
        expect(second.username).not.toBe(first.username);
        expect(second.credential).not.toBe(first.credential);
    });
});

describe('hasCredentiallessTurnServer', () => {
    it('spots a turn server nobody will be able to authenticate against', () => {
        expect(hasCredentiallessTurnServer(samplePeerOptions())).toBe(true);
    });

    it('is quiet when the turn entries carry credentials', () => {
        const peerOptions = {
            iceServers: [{ urls: ['turn:turn.example.com:3478'], username: 'u', credential: 'c' }]
        };
        expect(hasCredentiallessTurnServer(peerOptions)).toBe(false);
    });

    it('is quiet when there is no turn server at all', () => {
        for (const peerOptions of ['', null, {}, { iceServers: [{ urls: ['stun:a:1'] }] }]) {
            expect(hasCredentiallessTurnServer(peerOptions)).toBe(false);
        }
    });
});

describe('createTurnCredentialsProvider', () => {
    const options = { secret: SECRET, ttlSeconds: TTL };

    it('fills in credentials on turn entries', () => {
        const provider = createTurnCredentialsProvider(samplePeerOptions(), options);
        const result = provider({ peerType: 'player', peerId: 'player-1' });
        const turnEntry = iceServersOf(result)[1];
        expect(turnEntry['username']).toMatch(/^\d+:player-1$/);
        expect(turnEntry['credential']).toEqual(expect.any(String));
    });

    it('leaves stun entries alone', () => {
        const provider = createTurnCredentialsProvider(samplePeerOptions(), options);
        const result = provider({ peerType: 'player', peerId: 'player-1' });
        expect(iceServersOf(result)[0]).toEqual({ urls: ['stun:stun.l.google.com:19302'] });
    });

    it('does not modify the peer options it was given', () => {
        const peerOptions = samplePeerOptions();
        const provider = createTurnCredentialsProvider(peerOptions, options);
        provider({ peerType: 'player', peerId: 'player-1' });
        expect(peerOptions).toEqual(samplePeerOptions());
    });

    it('gives each peer its own credentials', () => {
        const provider = createTurnCredentialsProvider(samplePeerOptions(), options);
        const first = provider({ peerType: 'player', peerId: 'player-1' });
        const second = provider({ peerType: 'player', peerId: 'player-2' });
        expect(iceServersOf(first)[1]['username']).not.toBe(iceServersOf(second)[1]['username']);
    });

    it('recognises turns and the singular url form', () => {
        const peerOptions = { iceServers: [{ url: 'turns:turn.example.com:5349' }] };
        const provider = createTurnCredentialsProvider(peerOptions, options);
        const result = provider({ peerType: 'player', peerId: 'player-1' });
        expect(iceServersOf(result)[0]['username']).toMatch(/^\d+:player-1$/);
    });

    it('replaces credentials that are already there', () => {
        // The migration case: an operator sets a secret while the old static pair is still written
        // into their peer options. Adding alongside rather than replacing would keep issuing it.
        const peerOptions = {
            iceServers: [
                { urls: ['turn:turn.example.com:3478'], username: 'static-user', credential: 'static-password' }
            ]
        };
        const provider = createTurnCredentialsProvider(peerOptions, options);
        const entry = iceServersOf(provider({ peerType: 'player', peerId: 'player-1' }))[0];
        expect(entry['username']).not.toBe('static-user');
        expect(entry['credential']).not.toBe('static-password');
    });

    it('recognises an uppercase scheme', () => {
        const provider = createTurnCredentialsProvider(
            { iceServers: [{ urls: ['TURN:turn.example.com:3478'] }] },
            options
        );
        const entry = iceServersOf(provider({ peerType: 'player', peerId: 'player-1' }))[0];
        expect(entry['username']).toMatch(/^\d+:player-1$/);
    });

    it('gives one peer a single identity across all of its turn entries', () => {
        const peerOptions = {
            iceServers: [{ urls: ['turn:a:3478'] }, { urls: ['turn:b:3478'] }]
        };
        const provider = createTurnCredentialsProvider(peerOptions, options);
        const result = iceServersOf(provider({ peerType: 'player', peerId: 'player-1' }));
        expect(result[0]['username']).toBe(result[1]['username']);
        expect(result[0]['credential']).toBe(result[1]['credential']);
    });

    it('does not expire the credential of a peer that is configured only once', () => {
        // A streamer receives its configuration when it connects and never again, so a rotating
        // credential would put a deadline on the stream rather than on an attacker.
        const provider = createTurnCredentialsProvider(samplePeerOptions(), options);
        const player = iceServersOf(provider({ peerType: 'player', peerId: 'player-1' }))[1];
        const streamer = iceServersOf(provider({ peerType: 'streamer', peerId: 'UnknownStreamer' }))[1];

        const expiryOf = (entry: Record<string, unknown>) => Number(String(entry['username']).split(':')[0]);
        expect(expiryOf(streamer)).toBeGreaterThan(expiryOf(player) + 365 * 24 * 60 * 60);
    });

    it('survives peer options that hold nothing to configure', () => {
        // What the signalling server passes when no peer options were supplied at all.
        for (const empty of ['', null, undefined]) {
            const provider = createTurnCredentialsProvider(empty, options);
            expect(provider({ peerType: 'player', peerId: 'player-1' })).toEqual(empty);
        }
    });

    it('passes peer options through untouched when there is no turn server to configure', () => {
        for (const peerOptions of [{}, { iceServers: [] }, { iceServers: [{ urls: ['stun:a:1'] }] }]) {
            const provider = createTurnCredentialsProvider(peerOptions, options);
            expect(provider({ peerType: 'player', peerId: 'player-1' })).toEqual(peerOptions);
        }
    });
});

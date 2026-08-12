// Copyright Epic Games, Inc. All Rights Reserved.
import crypto from 'crypto';
import { IPeerOptionsRequest, PeerOptionsProvider } from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.6';

/**
 * Options for time limited TURN credentials.
 */
export interface ITurnCredentialsOptions {
    // The shared secret, matching static-auth-secret in the TURN server's configuration.
    secret: string;

    // How long an issued credential stays valid, in seconds. This gates allocating a relay, not the
    // lifetime of one already allocated: an established session continues after its credential
    // expires, so this does not have to be longer than a call.
    ttlSeconds: number;
}

/**
 * A username and credential pair for a TURN server, in the form coturn's use-auth-secret mode and
 * its equivalents expect.
 */
export interface ITurnCredentials {
    // Carries the expiry time, so the TURN server can judge the credential without storing it.
    username: string;

    // The signature over that username. Placed in the `credential` field of an ICE server entry.
    credential: string;
}

// A peer that is configured once and then holds that configuration for as long as it runs - a
// streamer or an SFU - cannot be issued a rotating credential: there is no message that replaces a
// peer's configuration, so an expiry would put a deadline on the stream rather than on an attacker.
// They are given one that outlives any plausible uptime instead. The exposure this feature exists to
// close is a credential shared by every browser that loads a page; a streamer is deployed by the
// operator on a host they control, and a consumer who wants to rotate it too can say so through
// IServerConfig.peerOptionsProvider directly.
const CONFIGURED_ONCE_TTL_SECONDS = 10 * 365 * 24 * 60 * 60;

/**
 * Builds one time limited TURN credential pair.
 *
 * The scheme is the de facto standard one described in draft-uberti-behave-turn-rest-00 and
 * implemented by coturn's `use-auth-secret` mode: the username carries the expiry, and the password
 * is an HMAC of that username under a secret shared with the TURN server. The TURN server recomputes
 * the same HMAC, so no credential store and no request to this server is involved at validation
 * time.
 *
 * @param options - The shared secret and the lifetime to issue for.
 * @param peerId - Identifies the peer in the username, so relay usage can be traced back to a
 *                 connection in this server's logs. Any value is acceptable to the TURN server.
 * @param now - The current time in milliseconds. Injectable for tests.
 * @returns The credential pair to place in an ICE server entry.
 */
export function createTurnCredentials(
    options: ITurnCredentialsOptions,
    peerId: string,
    now: number = Date.now()
): ITurnCredentials {
    const expiry = Math.floor(now / 1000) + options.ttlSeconds;
    const username = `${expiry}:${peerId}`;
    const credential = crypto.createHmac('sha1', options.secret).update(username).digest('base64');
    return { username, credential };
}

/**
 * Whether an ICE server entry names at least one TURN server. STUN entries carry no credentials and
 * are left exactly as the operator wrote them.
 */
function isTurnServerEntry(entry: Record<string, unknown>): boolean {
    const urls: unknown = entry['urls'] ?? entry['url'];
    const urlList: unknown[] = Array.isArray(urls) ? urls : [urls];
    return urlList.some((url) => {
        // URI schemes are case insensitive, and browsers accept TURN: as readily as turn:. Comparing
        // as written would leave such an entry without credentials and say nothing about why.
        const scheme: string = typeof url === 'string' ? url.toLowerCase() : '';
        return scheme.startsWith('turn:') || scheme.startsWith('turns:');
    });
}

/**
 * Returns the iceServers array of a peer options object, or null when there is nothing to rewrite.
 */
function findIceServers(peerOptions: unknown): Record<string, unknown>[] | null {
    if (typeof peerOptions !== 'object' || peerOptions === null) {
        return null;
    }

    const iceServers: unknown = (peerOptions as Record<string, unknown>)['iceServers'];
    if (!Array.isArray(iceServers)) {
        return null;
    }

    return iceServers.filter(
        (entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null
    );
}

/**
 * Whether the peer options name a TURN server that has no credentials attached to it.
 *
 * Such an entry is unusable: the peer receiving it will be challenged by the TURN server and have
 * no answer, and the failure surfaces much later as a generic ICE connection failure. Worth saying
 * out loud at startup when nothing is configured to fill the credentials in.
 *
 * @param peerOptions - The peer options as configured.
 * @returns True when at least one TURN entry is missing a username or credential.
 */
export function hasCredentiallessTurnServer(peerOptions: unknown): boolean {
    const iceServers = findIceServers(peerOptions);
    if (!iceServers) {
        return false;
    }

    return iceServers.some((entry) => isTurnServerEntry(entry) && !entry['username']);
}

/**
 * How long the credential issued to one peer should last. See CONFIGURED_ONCE_TTL_SECONDS for why a
 * streamer does not get the configured lifetime.
 */
function ttlSecondsFor(request: IPeerOptionsRequest, options: ITurnCredentialsOptions): number {
    if (request.peerType === 'player') {
        return options.ttlSeconds;
    }
    return CONFIGURED_ONCE_TTL_SECONDS;
}

/**
 * Builds a PeerOptionsProvider that hands every connecting peer its own time limited TURN
 * credentials, in place of the static username and credential in the supplied peer options.
 *
 * Only entries naming a `turn:` or `turns:` URL are touched, and the supplied object is never
 * modified - each peer receives a copy. If the peer options contain no TURN entry the provider is a
 * pass-through, so misconfiguring this cannot stop a stream that was working.
 *
 * A streamer and an SFU are configured once and keep that configuration, so they are issued a
 * credential that does not practically expire; only a player receives one limited to `ttlSeconds`.
 *
 * @param peerOptions - The peer options as configured, minus the credentials. Must be something
 *                      structuredClone can copy, which anything parsed from JSON is.
 * @param options - The shared secret and credential lifetime.
 * @returns A provider suitable for IServerConfig.peerOptionsProvider.
 */
export function createTurnCredentialsProvider(
    peerOptions: unknown,
    options: ITurnCredentialsOptions
): PeerOptionsProvider {
    return (request: IPeerOptionsRequest): unknown => {
        const peerOptionsCopy: unknown = structuredClone(peerOptions);
        const iceServers = findIceServers(peerOptionsCopy);
        if (!iceServers) {
            return peerOptionsCopy;
        }

        // One pair per peer, not per entry: a peer advertised over several transports is one client
        // and should present one identity, and minting inside the loop would let two entries land
        // either side of a second boundary and disagree about when they expire.
        const credentials = createTurnCredentials(
            { ...options, ttlSeconds: ttlSecondsFor(request, options) },
            request.peerId
        );
        for (const entry of iceServers) {
            if (!isTurnServerEntry(entry)) {
                continue;
            }
            entry['username'] = credentials.username;
            entry['credential'] = credentials.credential;
        }

        return peerOptionsCopy;
    };
}

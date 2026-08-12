// Copyright Epic Games, Inc. All Rights Reserved.
import crypto from 'crypto';
import http from 'http';

/**
 * The shape ws expects for verifyClient in its callback form. Declared here rather than imported so
 * this module does not depend on which ws types happen to be hoisted.
 */
export type VerifyClient = (
    info: { origin: string; secure: boolean; req: http.IncomingMessage },
    callback: (result: boolean, code?: number, message?: string) => void
) => void;

/** Called when a connection is refused, so the caller can say so without this module logging. */
export type OnRefused = (request: http.IncomingMessage) => void;

/**
 * Parses a request target, returning null rather than throwing when it is not one.
 *
 * This has to fail rather than throw. `request.url` is whatever the client put on the request line,
 * and Node's HTTP parser accepts targets the URL constructor rejects - `//` is the shortest of them.
 * A throw here escapes through ws's upgrade handler, and with no uncaughtException handler anywhere
 * in the project that ends the process: one unauthenticated packet, taking every connected player
 * and the streamer with it. A request we cannot parse is simply a request presenting no token.
 */
function parseRequestTarget(target: string): URL | null {
    try {
        // The base is required by the constructor and otherwise unused - an upgrade request's target
        // is normally a path, though a client may legally send an absolute form.
        return new URL(target, 'http://localhost');
    } catch {
        return null;
    }
}

/**
 * Decodes a query string key the way URLSearchParams does, so `%74oken` is recognised as `token`.
 * A key with a malformed escape in it is returned as written, which cannot match and so fails closed.
 *
 * The tab and newline removal matters, and is not decoration: the URL parser strips U+0009, U+000A
 * and U+000D from its input before parsing, so `to&lt;tab&gt;ken` is the `token` parameter as far as the
 * reading side is concerned. If this disagreed, a request could present a token that is accepted and
 * then not removed - leaving the credential in the target that gets logged. The two sides have to
 * agree on what the token parameter is, in both directions.
 */
function decodeKey(key: string): string {
    try {
        return decodeURIComponent(key.replace(/[\t\n\r]/g, '').replace(/\+/g, ' '));
    } catch {
        return key;
    }
}

/**
 * Reads the token a client presented, from either place one can reasonably be put.
 *
 * A query parameter is what a browser can send, because a WebSocket opened from a page cannot carry
 * custom headers. The Authorization header is for everything that is not a browser - a test harness,
 * a proxy, a native client - where a credential in a URL would end up in logs and history.
 *
 * Note that a query string is form encoded, so a `+` in a token arrives as a space, and that a token
 * is compared byte for byte, so two Unicode spellings of the same text do not match. Issue tokens
 * that survive both (a GUID does) or send the header instead.
 *
 * Both places are read rather than one taking precedence over the other. A header that is present
 * but wrong used to end the matter, which would make anything in front of this server that injects
 * an Authorization header silently disable the only route a browser has.
 *
 * @param request - The HTTP upgrade request.
 * @returns Every token presented, in no significant order. Empty when none was.
 */
function tokensFromRequest(request: http.IncomingMessage): string[] {
    const presented: string[] = [];

    const authorization = request.headers.authorization;
    if (authorization) {
        // Case insensitive: the scheme in an Authorization header is a token, and RFC 9110 defines
        // token comparison as case insensitive. A client sending `bearer` is not wrong.
        const bearer = /^bearer\s+(.+)$/i.exec(authorization);
        if (bearer) {
            presented.push(bearer[1]);
        }
    }

    if (request.url) {
        // getAll, not get: `get` returns only the first, so a proxy that prepends its own `token`
        // parameter would disable the query route exactly the way a wrong Authorization header used
        // to. stripToken removes every `token` pair, so reading every one keeps the two sides square.
        presented.push(...(parseRequestTarget(request.url)?.searchParams.getAll('token') ?? []));
    }

    return presented;
}

/**
 * Removes the token from an accepted request's target, in place.
 *
 * The signalling server logs the target a player connected with, and that log is kept and rotated -
 * so without this, enabling the token writes it into a file, and into every backup of the machine
 * holding it, on every connection. A credential in a query string is exposed to whatever else
 * handles the URL - a proxy's access log, browser history - which is why the Authorization header is
 * the better option wherever a client can send one. This removes the copy that is ours to remove.
 *
 * The token parameter is spliced out of the raw string rather than the whole target being rebuilt
 * from a parsed URL. Rebuilding is lossy in ways a consumer can see, and the request is handed to
 * consumer code as the connection's `request`: re-serialising re-encodes every other value, gives a
 * bare key an `=`, normalises dot segments in the path and drops any fragment. Splicing changes
 * exactly the one parameter this module put there.
 */
function stripToken(request: http.IncomingMessage): void {
    const target = request.url;
    if (!target) {
        return;
    }

    const queryStart = target.indexOf('?');
    if (queryStart < 0) {
        return;
    }

    // A fragment is not normally sent on a request line, but it is not ours to discard if it is.
    const fragmentStart = target.indexOf('#', queryStart);
    const path = target.slice(0, queryStart);
    const query = target.slice(queryStart + 1, fragmentStart < 0 ? undefined : fragmentStart);
    const fragment = fragmentStart < 0 ? '' : target.slice(fragmentStart);

    const kept = query.split('&').filter((pair) => {
        if (pair === '') {
            return false;
        }
        const equals = pair.indexOf('=');
        return decodeKey(equals < 0 ? pair : pair.slice(0, equals)) !== 'token';
    });

    // `path || '/'` because a target of `?token=x` carries no path at all, and leaving request.url
    // as the empty string would be a stranger thing to hand on than the `/` it means.
    request.url =
        kept.length > 0 ? `${path || '/'}?${kept.join('&')}${fragment}` : `${path || '/'}${fragment}`;
}

/**
 * Builds a verifyClient that admits only connections presenting the expected token.
 *
 * This runs during the HTTP upgrade, which is the point of it: a rejected connection never becomes a
 * WebSocket, so it is never sent the config message - and therefore never receives the peer options,
 * which is where a TURN credential lives.
 *
 * The scheme is deliberately the simplest one that is useful: a single shared token, compared
 * literally. It is not a session, it does not expire and it does not identify anybody. A deployment
 * needing more than that should supply its own verifyClient through playerWsOptions, which is what
 * this is built on and what the security guidelines describe.
 *
 * @param token - The token every player must present.
 * @param onRefused - Called with the request of each refused connection.
 * @returns A verifyClient suitable for IServerConfig.playerWsOptions.
 */
export function createPlayerTokenVerifier(token: string, onRefused?: OnRefused): VerifyClient {
    // Hashed once rather than per request. The digest is not the token and is never compared to
    // anything an attacker supplies directly, so holding it costs nothing.
    const expected = crypto.createHash('sha256').update(token).digest();

    return (info, callback) => {
        // `some` short circuits, so a request presenting two tokens is measurably cheaper when the
        // first matches. That distinguishes states the client already knows it is in and says
        // nothing about the expected token, which is the only secret here.
        if (tokensFromRequest(info.req).some((presented) => secretsMatch(presented, expected))) {
            stripToken(info.req);
            callback(true);
            return;
        }

        onRefused?.(info.req);
        // 401 rather than 403, and a reason on the wire: a player that is refused sees only a failed
        // WebSocket in its console, so the status code is the only thing distinguishing "you need a
        // token" from "the server is down". Nothing about the expected token is disclosed by it.
        callback(false, 401, 'Unauthorized');
    };
}

/**
 * Compares a presented secret against an expected digest, without leaking which character differed
 * or how long the expected secret is.
 *
 * Both sides are hashed so the comparison is over two equal length digests. timingSafeEqual throws on
 * a length mismatch, so comparing the raw strings would need a length check in front of it, and that
 * check would answer "how long is the token" to anyone who asked enough times.
 */
function secretsMatch(presented: string, expected: Buffer): boolean {
    const presentedDigest = crypto.createHash('sha256').update(presented).digest();
    return crypto.timingSafeEqual(presentedDigest, expected);
}

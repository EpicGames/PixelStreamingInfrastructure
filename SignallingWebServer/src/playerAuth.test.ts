// Copyright Epic Games, Inc. All Rights Reserved.
import http from 'http';
import { createPlayerTokenVerifier } from './playerAuth';

/** Builds the argument ws passes to verifyClient, with only the parts this code reads. */
function upgradeRequest(options: { url?: string; authorization?: string }) {
    const headers: http.IncomingHttpHeaders = {};
    if (options.authorization !== undefined) {
        headers.authorization = options.authorization;
    }
    return {
        origin: '',
        secure: false,
        req: { url: options.url, headers } as http.IncomingMessage
    };
}

/** Runs a verifier and returns what it answered, plus the url the request was left holding. */
function verify(token: string, options: { url?: string; authorization?: string }) {
    const verifier = createPlayerTokenVerifier(token);
    const request = upgradeRequest(options);
    let result: { allowed: boolean; code?: number; message?: string; url?: string } | undefined;
    verifier(request, (allowed, code, message) => {
        result = { allowed, code, message, url: request.req.url };
    });
    return result;
}

describe('player token verifier', () => {
    it('admits a connection presenting the token as a query parameter', () => {
        expect(verify('opensesame', { url: '/?token=opensesame' })?.allowed).toBe(true);
    });

    it('admits a connection presenting the token as a bearer header', () => {
        expect(verify('opensesame', { authorization: 'Bearer opensesame' })?.allowed).toBe(true);
    });

    it('accepts the bearer scheme in any case', () => {
        expect(verify('opensesame', { authorization: 'bearer opensesame' })?.allowed).toBe(true);
    });

    it('reads the token from a url that has other parameters', () => {
        expect(verify('opensesame', { url: '/?foo=bar&token=opensesame&baz=1' })?.allowed).toBe(true);
    });

    it('refuses a connection presenting the wrong token', () => {
        const result = verify('opensesame', { url: '/?token=letmein' });
        expect(result?.allowed).toBe(false);
        expect(result?.code).toBe(401);
    });

    it('refuses a connection presenting no token at all', () => {
        expect(verify('opensesame', { url: '/' })?.allowed).toBe(false);
    });

    it('refuses a connection whose token is a prefix of the expected one', () => {
        expect(verify('opensesame', { url: '/?token=open' })?.allowed).toBe(false);
    });

    it('refuses an empty token', () => {
        expect(verify('opensesame', { url: '/?token=' })?.allowed).toBe(false);
    });

    it('refuses a request with no url', () => {
        expect(verify('opensesame', {})?.allowed).toBe(false);
    });

    it('ignores an authorization header that is not a bearer', () => {
        expect(verify('opensesame', { authorization: 'Basic opensesame' })?.allowed).toBe(false);
    });

    it('accepts a correct header alongside a wrong query token', () => {
        expect(
            verify('opensesame', { url: '/?token=letmein', authorization: 'Bearer opensesame' })
                ?.allowed
        ).toBe(true);
    });

    // Neither place takes precedence. A wrong header used to end the matter, so anything in front of
    // the server that injects an Authorization header disabled the only route a browser has.
    it('accepts a correct query token alongside a wrong header', () => {
        expect(
            verify('opensesame', { url: '/?token=opensesame', authorization: 'Bearer letmein' })
                ?.allowed
        ).toBe(true);
    });

    // Same defect one layer along: a proxy that PREPENDS its own token parameter would break the
    // query route if only the first were read.
    it('accepts a correct token that is not the first one presented', () => {
        const result = verify('opensesame', { url: '/?token=letmein&token=opensesame' });
        expect(result?.allowed).toBe(true);
        // And both are removed, so neither survives into the log.
        expect(result?.url).toBe('/');
    });

    it('url decodes a token before comparing it', () => {
        expect(verify('a b', { url: `/?token=${encodeURIComponent('a b')}` })?.allowed).toBe(true);
    });

    // Node's HTTP parser accepts request targets the URL constructor rejects. A throw here escapes
    // through ws's upgrade handler and ends the process, so every one of these must be a plain
    // refusal - reachable by anyone who can open a socket, without presenting anything.
    describe('request targets that are not valid URLs', () => {
        it.each(['//', '///', '//:', '//\\', 'http://[', '// ', '//?token=opensesame'])(
            'refuses %p without throwing',
            (url) => {
                expect(() => verify('opensesame', { url })).not.toThrow();
                expect(verify('opensesame', { url })?.allowed).toBe(false);
            }
        );

        it('does not throw when the token is valid but the target is not parseable', () => {
            // The header is read before the url, so this reaches stripToken rather than the parse.
            const result = verify('opensesame', { url: '//', authorization: 'Bearer opensesame' });
            expect(result?.allowed).toBe(true);
        });
    });

    describe('removing the token from an accepted request', () => {
        // The signalling server logs the url a player connected with, and that log is rotated and
        // backed up. Without this the token is written to disk on every single connection.
        it('takes the token out of the url', () => {
            expect(verify('opensesame', { url: '/?token=opensesame' })?.url).toBe('/');
        });

        it('keeps the path and every other parameter', () => {
            expect(verify('opensesame', { url: '/ws?StreamerId=abc&token=opensesame&x=1' })?.url).toBe(
                '/ws?StreamerId=abc&x=1'
            );
        });

        it('leaves a url that never carried a token alone', () => {
            expect(verify('opensesame', { url: '/ws?x=1', authorization: 'Bearer opensesame' })?.url).toBe(
                '/ws?x=1'
            );
        });

        it('leaves the url of a refused connection alone', () => {
            expect(verify('opensesame', { url: '/?token=letmein' })?.url).toBe('/?token=letmein');
        });

        // A semicolon is not a parameter separator: URLSearchParams stopped treating it as one when
        // it moved to the WHATWG rules, so `a=1;token=x` is one parameter named `a`. Both sides here
        // agree about that - the read side does not find a token, so such a request is refused and
        // never reaches the splice. Pinned because the two sides MUST agree: if the reader saw a
        // token the splicer did not, an accepted connection would keep its credential in the log.
        // Do not "fix" the splice to split on `;` as well - that would break any value containing one.
        it('does not treat a semicolon as a parameter separator', () => {
            expect(verify('opensesame', { url: '/?a=1;token=opensesame' })?.allowed).toBe(false);
        });

        it('leaves a semicolon inside another value alone', () => {
            expect(verify('t', { url: '/ws?a=1;2&token=t' })?.url).toBe('/ws?a=1;2');
        });

        // The URL parser strips tab, CR and LF before parsing, so `to<tab>ken` IS the token
        // parameter to the reading side. If the splice disagreed, such a request would be accepted
        // and keep its credential in the target that gets logged. Node's HTTP parser rejects these
        // with 400 before they ever arrive, but createPlayerTokenVerifier is exported and a consumer
        // driving it from a manual `upgrade` handler is not bound by that.
        it.each(['/?to\tken=opensesame', '/?to\nken=opensesame', '/?to\rken=opensesame'])(
            'reads and removes the token from %j alike',
            (url) => {
                const result = verify('opensesame', { url });
                expect(result?.allowed).toBe(true);
                expect(result?.url).not.toContain('opensesame');
            }
        );

        it('leaves a path behind rather than an empty url', () => {
            expect(verify('opensesame', { url: '?token=opensesame' })?.url).toBe('/');
        });

        it('removes a token whose key was percent encoded', () => {
            // URLSearchParams decodes the key, so this IS the token parameter as far as the read
            // side is concerned. If the two sides disagreed, the credential would survive the strip.
            expect(verify('opensesame', { url: '/?%74oken=opensesame' })?.url).toBe('/');
        });

        // Rebuilding the target from a parsed URL changes all of these; splicing does not. The
        // request is handed to consumer code, so leaving it as written is part of the contract.
        it.each([
            ['/ws?a=b%20c&token=t', '/ws?a=b%20c'],
            ['/ws?flag&token=t', '/ws?flag'],
            ["/ws?a=~!*()'&token=t", "/ws?a=~!*()'"],
            ['/ws/../x?token=t', '/ws/../x'],
            ['/ws?token=t#frag', '/ws#frag'],
            ['/ws?x=1&token=t&x=2', '/ws?x=1&x=2']
        ])('leaves %p as %p', (url, expected) => {
            expect(verify('t', { url })?.url).toBe(expected);
        });
    });
});

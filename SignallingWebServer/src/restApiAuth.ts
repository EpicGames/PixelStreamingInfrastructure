// Copyright Epic Games, Inc. All Rights Reserved.
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { Command, Option } from 'commander';
import { Logger } from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.7';
import { IProgramOptions, readSecretFile } from './Utils';
import { createTokenMatcher } from './playerAuth';

/** Called when a REST API request is refused, so the caller can say so without this module logging. */
export type OnRestApiRefused = (request: Request) => void;

/** Adds REST API token arguments to the Signalling Web Server command line. */
export function addRestApiTokenOptions(program: Command, config: IProgramOptions): Command {
    return program
        .addOption(
            new Option(
                '--rest_api_token <token>',
                'Requires every request to the REST API to present this token in an Authorization: Bearer header. A request that does not is refused with 401. Player, streamer and SFU connections are not affected.'
            ).default(config.rest_api_token ?? '')
        )
        .addOption(
            new Option(
                '--rest_api_token_file <filename>',
                'Reads the value of --rest_api_token from a file, so the token does not appear in the command line of this process.'
            ).default(config.rest_api_token_file || '')
        );
}

/** Loads a configured REST API token file into the parsed options. */
export function loadRestApiTokenFile(options: IProgramOptions): void {
    const filename: unknown = options.rest_api_token_file;
    if (filename === undefined || filename === null || filename === '') return;
    if (typeof filename !== 'string') {
        // Logged before the throw, which beats winston's flush.
        Logger.error('rest_api_token_file is not a filename; it must be the path of a file to read.');
        throw Error('Invalid rest_api_token_file.');
    }
    options.rest_api_token = readSecretFile(filename, 'rest_api_token_file');
}

/**
 * Returns the configured REST API token, or the empty string when there is none.
 *
 * Coerced and validated the same way as player_token and streamer_token: a number in a hand written
 * config.json is a token, said out loud, and anything else that is not text is refused rather than
 * leaving the API open on a deployment that asked for it to be closed.
 */
export function resolveRestApiToken(options: IProgramOptions): string {
    const rawToken: unknown = options.rest_api_token;
    if (rawToken === undefined || rawToken === null || rawToken === '') return '';

    if (typeof rawToken === 'string') return rawToken;
    if (typeof rawToken === 'number') {
        const token = String(rawToken);
        Logger.warn(
            `rest_api_token was given as a number and is being used as the text "${token}". ` +
                'Quote it in the config file to be sure of what clients must send.'
        );
        return token;
    }
    throw Error('Invalid rest_api_token.');
}

/**
 * Builds Express middleware that admits only requests presenting the expected token.
 *
 * Only the Authorization header is read, not a `?token=` query parameter as the WebSocket listeners
 * also accept. A WebSocket opened from a page cannot set headers, so those listeners have to take
 * the query string; an HTTP client can always set one, and a credential in a URL ends up in proxy
 * access logs and browser history.
 *
 * Mount it on `/api` before the REST routes. Express matches mount paths case-insensitively and by
 * path segment, the same way it matches the routes behind it, so `/API/players` and `/api/players/`
 * are covered by the same mount.
 *
 * @param token - The token every REST API request must present.
 * @param onRefused - Called with each refused request.
 */
export function createRestApiAuthMiddleware(token: string, onRefused?: OnRestApiRefused): RequestHandler {
    const matches = createTokenMatcher(token);

    return (req: Request, res: Response, next: NextFunction) => {
        const bearer = /^bearer\s+(.+)$/i.exec(req.headers.authorization ?? '');
        if (bearer && matches(bearer[1])) {
            next();
            return;
        }

        onRefused?.(req);
        res.setHeader('WWW-Authenticate', 'Bearer');
        res.status(401).json({ error: 'Unauthorized' });
    };
}

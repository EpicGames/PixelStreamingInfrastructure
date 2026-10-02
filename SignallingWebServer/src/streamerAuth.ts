// Copyright Epic Games, Inc. All Rights Reserved.
import { Command, Option } from 'commander';
import type { IServerConfig } from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.8';
import { Logger } from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.8';
import { IProgramOptions, readSecretFile } from './Utils';
import { createTokenVerifier, OnRefused } from './playerAuth';

/** Adds streamer-token arguments to the Signalling Web Server command line. */
export function addStreamerTokenOptions(program: Command, config: IProgramOptions): Command {
    return program
        .addOption(
            new Option(
                '--streamer_token <token>',
                'Requires every streamer to present this token when it connects, as a ?token= query parameter or an Authorization: Bearer header. A streamer that does not is refused at the HTTP upgrade with 401, before it is sent the config message. Player and SFU connections are not affected.'
            ).default(config.streamer_token ?? '')
        )
        .addOption(
            new Option(
                '--streamer_token_file <filename>',
                'Reads the value of --streamer_token from a file, so the token does not appear in the command line of this process.'
            ).default(config.streamer_token_file || '')
        );
}

/** Loads a configured streamer token file into the parsed options. */
export function loadStreamerTokenFile(options: IProgramOptions): void {
    const filename: unknown = options.streamer_token_file;
    if (filename === undefined || filename === null || filename === '') return;
    if (typeof filename !== 'string') {
        // Logged before the throw, as every other config validation in index.ts does: the throw
        // beats winston's flush, so without this line all the operator gets is a bare stack
        // trace that names no option.
        Logger.error('streamer_token_file is not a filename; it must be the path of a file to read.');
        throw Error('Invalid streamer_token_file.');
    }
    options.streamer_token = readSecretFile(filename, 'streamer_token_file');
}

/** Adds shared-token verification to the streamer listener when configured. */
export function configureStreamerToken(
    options: IProgramOptions,
    serverOptions: IServerConfig,
    onRefused?: OnRefused
): string {
    const rawToken: unknown = options.streamer_token;
    if (rawToken === undefined || rawToken === null || rawToken === '') return '';

    // Coerced rather than rejected, for the same reason index.ts coerces player_token: config.json
    // is hand written, so `"streamer_token": 12345678` arrives here as a number, and both flags are
    // documented as working the same way - refusing to start would hand an operator who copied the
    // player pattern a server that will not boot, with no message suggesting a quoted string. Said
    // out loud because the text may not be what was written: a long integer loses precision and
    // 1e21 becomes "1e+21", where the `+` decodes to a space and the query parameter route can
    // never work.
    let token: string;
    if (typeof rawToken === 'string') {
        token = rawToken;
    } else if (typeof rawToken === 'number') {
        token = String(rawToken);
        Logger.warn(
            `streamer_token was given as a number and is being used as the text "${token}". ` +
                'Quote it in the config file to be sure of what clients must send.'
        );
    } else {
        // `true`, an array, an object - a mistake in the config rather than a token, so it fails
        // closed instead of leaving the streamer port open on a deployment that asked for a door.
        throw Error('Invalid streamer_token.');
    }

    serverOptions.streamerWsOptions = {
        ...serverOptions.streamerWsOptions,
        verifyClient: createTokenVerifier(token, onRefused)
    };
    return token;
}

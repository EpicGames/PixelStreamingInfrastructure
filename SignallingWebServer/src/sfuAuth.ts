// Copyright Epic Games, Inc. All Rights Reserved.
import { Command, Option } from 'commander';
import type { IServerConfig } from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.8';
import { Logger } from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.8';
import { IProgramOptions, readSecretFile } from './Utils';
import { createTokenVerifier, OnRefused } from './playerAuth';

/** Adds SFU-token arguments to the Signalling Web Server command line. */
export function addSfuTokenOptions(program: Command, config: IProgramOptions): Command {
    return program
        .addOption(
            new Option(
                '--sfu_token <token>',
                'Requires every SFU to present this token when it connects, as a ?token= query parameter or an Authorization: Bearer header. An SFU that does not is refused at the HTTP upgrade with 401, before it is sent the config message. Player and streamer connections are not affected.'
            ).default(config.sfu_token ?? '')
        )
        .addOption(
            new Option(
                '--sfu_token_file <filename>',
                'Reads the value of --sfu_token from a file, so the token does not appear in the command line of this process.'
            ).default(config.sfu_token_file || '')
        );
}

/** Loads a configured SFU token file into the parsed options. */
export function loadSfuTokenFile(options: IProgramOptions): void {
    const filename: unknown = options.sfu_token_file;
    if (filename === undefined || filename === null || filename === '') return;
    if (typeof filename !== 'string') {
        // Logged before the throw, which beats winston's flush.
        Logger.error('sfu_token_file is not a filename; it must be the path of a file to read.');
        throw Error('Invalid sfu_token_file.');
    }
    options.sfu_token = readSecretFile(filename, 'sfu_token_file');
}

/**
 * Adds shared-token verification to the SFU listener when configured, coercing and validating the
 * token the same way as streamer_token.
 */
export function configureSfuToken(
    options: IProgramOptions,
    serverOptions: IServerConfig,
    onRefused?: OnRefused
): string {
    const rawToken: unknown = options.sfu_token;
    if (rawToken === undefined || rawToken === null || rawToken === '') return '';

    let token: string;
    if (typeof rawToken === 'string') {
        token = rawToken;
    } else if (typeof rawToken === 'number') {
        token = String(rawToken);
        Logger.warn(
            `sfu_token was given as a number and is being used as the text "${token}". ` +
                'Quote it in the config file to be sure of what clients must send.'
        );
    } else {
        // A mistake in the config rather than a token, so it fails closed.
        throw Error('Invalid sfu_token.');
    }

    serverOptions.sfuWsOptions = {
        ...serverOptions.sfuWsOptions,
        verifyClient: createTokenVerifier(token, onRefused)
    };
    return token;
}

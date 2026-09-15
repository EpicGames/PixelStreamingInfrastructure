// Copyright Epic Games, Inc. All Rights Reserved.
import fs from 'fs';
import { Command, Option } from 'commander';
import type { IServerConfig } from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.8';
import { Logger } from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.8';
import type { IProgramOptions } from './Utils';
import { createTokenVerifier, OnRefused } from './playerAuth';

/** Adds streamer-token arguments to the Signalling Web Server command line. */
export function addStreamerTokenOptions(program: Command, config: IProgramOptions): Command {
    return program
        .addOption(
            new Option(
                '--streamer_token <token>',
                'Requires every streamer to present this token when it connects, as a ?token= query parameter or an Authorization: Bearer header.'
            ).default(config.streamer_token ?? '')
        )
        .addOption(
            new Option(
                '--streamer_token_file <filename>',
                'Reads the value of --streamer_token from a file, so the token does not appear in the command line of this process.'
            ).default(config.streamer_token_file || '')
        );
}

/** Reads and trims a secret file, failing closed when it is missing or empty. */
export function readSecretFile(filename: string, optionName: string): string {
    if (!fs.existsSync(filename)) {
        Logger.error(`${optionName} "${filename}" does not exist.`);
        throw Error(`Failed to find the file ${filename} given to ${optionName}.`);
    }

    const secret = fs.readFileSync(filename, 'utf-8').trim();
    if (!secret) {
        Logger.error(`${optionName} "${filename}" is empty.`);
        throw Error(`The file ${filename} given to ${optionName} contains no value.`);
    }
    return secret;
}

/** Loads a configured streamer token file into the parsed options. */
export function loadStreamerTokenFile(options: IProgramOptions): void {
    const filename: unknown = options.streamer_token_file;
    if (filename === undefined || filename === null || filename === '') return;
    if (typeof filename !== 'string') throw Error('Invalid streamer_token_file.');
    options.streamer_token = readSecretFile(filename, 'streamer_token_file');
}

/** Adds shared-token verification to the streamer listener when configured. */
export function configureStreamerToken(
    options: IProgramOptions,
    serverOptions: IServerConfig,
    onRefused?: OnRefused
): string {
    const token: unknown = options.streamer_token;
    if (token === undefined || token === null || token === '') return '';
    if (typeof token !== 'string') throw Error('Invalid streamer_token.');

    serverOptions.streamerWsOptions = {
        ...serverOptions.streamerWsOptions,
        verifyClient: createTokenVerifier(token, onRefused)
    };
    return token;
}

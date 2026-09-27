// Copyright Epic Games, Inc. All Rights Reserved.
import fs from 'fs';
import { jsonc } from 'jsonc';
import { Logger } from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.8';

// A simple interface to describe the options from commander.js
export type IProgramOptions = Record<string, any>;

const SECRET_OPTIONS = ['turn_secret', 'player_token', 'streamer_token'];

/** Returns a copy safe to write to logs or stdout. */
export function redactConfig(options: IProgramOptions): IProgramOptions {
    const redacted = { ...options };
    for (const key of SECRET_OPTIONS) {
        if (redacted[key]) redacted[key] = '<redacted>';
    }
    return redacted;
}

/**
 * Reads a secret that was supplied as a file rather than on the command line.
 *
 * Trimmed because the usual way to write one of these is `echo $SECRET > secret.txt`, which leaves a
 * trailing newline. An empty file throws rather than returning nothing, because an empty secret
 * reads as "this feature was not configured" and silently starts the server with it off - which
 * looks identical to it working until the first peer needs it.
 */
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

/**
 * Cirular reference safe version of JSON.stringify
 */
export function stringify(obj: any): string {
    return jsonc.stringify(obj);
}

/**
 * Circular reference save version of JSON.stringify with extra formatting.
 */
export function beautify(obj: any): string {
    return jsonc.stringify(obj, undefined, '\t');
}

// Copyright Epic Games, Inc. All Rights Reserved.
import { jsonc } from 'jsonc';

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

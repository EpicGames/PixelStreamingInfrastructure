// Copyright Epic Games, Inc. All Rights Reserved.
import { jsonc } from 'jsonc';

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

/**
 * The longest text, or protocol message as JSON, that the logger writes whole. A client chooses the
 * size of what it sends, so anything longer is cut rather than written to the log in full.
 */
export const MAX_LOGGED_LENGTH = 16 * 1024;

/**
 * Returns the text, or if it is longer than MAX_LOGGED_LENGTH, its start and its full length.
 */
export function limitLogText(text: string): string {
    if (text.length <= MAX_LOGGED_LENGTH) {
        return text;
    }
    return `${text.slice(0, MAX_LOGGED_LENGTH)}... (${text.length} characters)`;
}

/**
 * Returns a protocol message as the log file should hold it: the message itself while its JSON fits in
 * MAX_LOGGED_LENGTH, otherwise its JSON text cut by limitLogText.
 */
export function limitLoggedMessage(message: object): object | string {
    const text = JSON.stringify(message);
    return text.length <= MAX_LOGGED_LENGTH ? message : limitLogText(text);
}

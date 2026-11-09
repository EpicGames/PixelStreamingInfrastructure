// Copyright Epic Games, Inc. All Rights Reserved.
import { MAX_LOGGED_LENGTH, limitLogText, limitLoggedMessage } from './Utils';

describe('limitLogText', () => {
    it('returns text up to the limit unchanged', () => {
        const text = 'a'.repeat(MAX_LOGGED_LENGTH);
        expect(limitLogText(text)).toBe(text);
    });

    it('cuts longer text to the limit and gives its full length', () => {
        const text = 'a'.repeat(MAX_LOGGED_LENGTH + 1);
        expect(limitLogText(text)).toBe(
            `${'a'.repeat(MAX_LOGGED_LENGTH)}... (${MAX_LOGGED_LENGTH + 1} characters)`
        );
    });
});

describe('limitLoggedMessage', () => {
    it('returns a message whose JSON fits as the message itself', () => {
        const message = { type: 'ping', time: 1 };
        expect(limitLoggedMessage(message)).toBe(message);
    });

    it('returns a message whose JSON is too long as its JSON text, cut', () => {
        const message = { type: 'ping', pad: 'a'.repeat(MAX_LOGGED_LENGTH) };
        const json = JSON.stringify(message);
        expect(limitLoggedMessage(message)).toBe(
            `${json.slice(0, MAX_LOGGED_LENGTH)}... (${json.length} characters)`
        );
    });
});

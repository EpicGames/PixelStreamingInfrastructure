// Copyright Epic Games, Inc. All Rights Reserved.
import { redactConfig } from './Utils';

describe('redactConfig', () => {
    it('replaces static TURN credentials inside peer options, at any depth', () => {
        const options = {
            peer_options: {
                iceServers: [{ urls: ['turn:relay.example:3478'], username: 'psuser', credential: 'hunter2' }]
            },
            nested: { deeper: { password: 'swordfish' } }
        };
        expect(redactConfig(options)).toEqual({
            peer_options: {
                iceServers: [
                    { urls: ['turn:relay.example:3478'], username: 'psuser', credential: '<redacted>' }
                ]
            },
            nested: { deeper: { password: '<redacted>' } }
        });
    });

    it('still redacts the top level secrets, and leaves unset ones alone', () => {
        expect(redactConfig({ turn_secret: 'abc', player_token: '', serve: true })).toEqual({
            turn_secret: '<redacted>',
            player_token: '',
            serve: true
        });
    });

    it('leaves an empty credential alone, so an unset value still reads as unset', () => {
        const options = {
            peer_options: { iceServers: [{ urls: ['turn:relay.example:3478'], credential: '' }] }
        };
        expect(redactConfig(options)).toEqual(options);
    });

    it('returns a copy and does not change the options it was given', () => {
        const options = { peer_options: { iceServers: [{ credential: 'hunter2' }] } };
        redactConfig(options);
        expect(options.peer_options.iceServers[0].credential).toBe('hunter2');
    });
});

// Copyright Epic Games, Inc. All Rights Reserved.
import * as wslib from 'ws';
import { SignallingServer, DEFAULT_MAX_PAYLOAD, IServerConfig } from './SignallingServer';

// The constructor binds real listening sockets and the class offers no way to close them, so the
// websocket servers are replaced here and only the options they are created with are checked.
jest.mock('ws', () => {
    const actual = jest.requireActual<typeof wslib>('ws');
    return {
        ...actual,
        WebSocketServer: jest.fn().mockImplementation(() => ({ on: jest.fn() }))
    };
});

const STREAMER_PORT = 8888;
const PLAYER_PORT = 80;
const SFU_PORT = 8889;

function createdOptions(config: Partial<IServerConfig>): Map<number | undefined, wslib.ServerOptions> {
    const constructor = jest.mocked(wslib.WebSocketServer);
    constructor.mockClear();
    new SignallingServer({
        streamerPort: STREAMER_PORT,
        playerPort: PLAYER_PORT,
        sfuPort: SFU_PORT,
        peerOptions: {},
        ...config
    });
    const byPort = new Map<number | undefined, wslib.ServerOptions>();
    for (const [options] of constructor.mock.calls) {
        byPort.set(options?.port, options ?? {});
    }
    return byPort;
}

describe('SignallingServer websocket message size', () => {
    it('limits every port to DEFAULT_MAX_PAYLOAD', () => {
        const options = createdOptions({});

        expect(options.size).toBe(3);
        expect(options.get(STREAMER_PORT)?.maxPayload).toBe(DEFAULT_MAX_PAYLOAD);
        expect(options.get(PLAYER_PORT)?.maxPayload).toBe(DEFAULT_MAX_PAYLOAD);
        expect(options.get(SFU_PORT)?.maxPayload).toBe(DEFAULT_MAX_PAYLOAD);
    });

    it('is 1 MiB', () => {
        expect(DEFAULT_MAX_PAYLOAD).toBe(1024 * 1024);
    });

    it('lets the websocket options of each port override the limit', () => {
        const options = createdOptions({
            streamerWsOptions: { maxPayload: 4 * 1024 * 1024 },
            playerWsOptions: { maxPayload: 64 * 1024 },
            sfuWsOptions: { maxPayload: 0 }
        });

        expect(options.get(STREAMER_PORT)?.maxPayload).toBe(4 * 1024 * 1024);
        expect(options.get(PLAYER_PORT)?.maxPayload).toBe(64 * 1024);
        expect(options.get(SFU_PORT)?.maxPayload).toBe(0);
    });

    it('keeps the other websocket options it is given', () => {
        const verifyClient = jest.fn();
        const options = createdOptions({ playerWsOptions: { verifyClient } });

        expect(options.get(PLAYER_PORT)?.verifyClient).toBe(verifyClient);
        expect(options.get(PLAYER_PORT)?.maxPayload).toBe(DEFAULT_MAX_PAYLOAD);
    });
});

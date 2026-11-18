// Copyright Epic Games, Inc. All Rights Reserved.
import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';
import { AddressInfo } from 'net';
import express from 'express';
import { initialize } from 'express-openapi';
import { Command } from 'commander';
import { Logger } from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.7';
import {
    addRestApiTokenOptions,
    createRestApiAuthMiddleware,
    loadRestApiTokenFile,
    resolveRestApiToken
} from './restApiAuth';
import { IProgramOptions, redactConfig } from './Utils';
import configHandler from './paths/config';
import playersHandler from './paths/players';
import playerByIdHandler from './paths/players/{playerId}';
import statusHandler from './paths/status';
import streamersHandler from './paths/streamers';
import streamerByIdHandler from './paths/streamers/{streamerId}';

// As in streamerAuth.test.ts: the modules under test log through the Signalling library's Logger,
// which is replaced here so the suite does not depend on a built Signalling/dist.
jest.mock(
    '@epicgames-ps/lib-pixelstreamingsignalling-ue5.7',
    () => ({ Logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() } }),
    { virtual: true }
);

const TOKEN = '8f14e45f-ea8d-4b3f-b6de-1cd97b4e2d21';

function parseOptions(args: string[] = [], config: IProgramOptions = {}): IProgramOptions {
    const program = addRestApiTokenOptions(new Command().exitOverride(), config);
    return program.parse(['node', 'test', ...args]).opts();
}

describe('REST API token startup options', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('has no token when none is given', () => {
        expect(resolveRestApiToken(parseOptions())).toBe('');
    });

    it('reads the token from the command line', () => {
        expect(resolveRestApiToken(parseOptions(['--rest_api_token', TOKEN]))).toBe(TOKEN);
    });

    it('reads the token from a config file', () => {
        expect(resolveRestApiToken(parseOptions([], { rest_api_token: TOKEN }))).toBe(TOKEN);
    });

    it('coerces a numeric config file token and warns', () => {
        expect(resolveRestApiToken(parseOptions([], { rest_api_token: 12345678 }))).toBe('12345678');
        expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('given as a number'));
    });

    it('refuses a token that is not text or a number', () => {
        for (const value of [true, ['a'], { a: 1 }]) {
            expect(() => resolveRestApiToken(parseOptions([], { rest_api_token: value }))).toThrow(
                'Invalid rest_api_token.'
            );
        }
    });

    it('reads the token from a file, trimmed', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rest-api-token-'));
        try {
            const file = path.join(dir, 'token.txt');
            fs.writeFileSync(file, `${TOKEN}\n`);
            const options = parseOptions(['--rest_api_token_file', file]);
            loadRestApiTokenFile(options);
            expect(resolveRestApiToken(options)).toBe(TOKEN);
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('refuses a token file option that is not a filename', () => {
        expect(() => loadRestApiTokenFile({ rest_api_token_file: 42 })).toThrow(
            'Invalid rest_api_token_file.'
        );
    });

    it('redacts the token from the startup config dump', () => {
        expect(redactConfig({ rest_api_token: TOKEN }).rest_api_token).toBe('<redacted>');
    });
});

/**
 * Starts the REST API the way index.ts does: the middleware on `/api`, then express-openapi's
 * routes behind it, over a stand-in signalling server.
 */
async function startApi(token: string): Promise<{ url: string; server: http.Server; refused: string[] }> {
    const refused: string[] = [];
    const app = express();
    app.use(
        '/api',
        createRestApiAuthMiddleware(token, (req) => refused.push(req.originalUrl))
    );

    const player = {
        getPlayerInfo: () => ({ playerId: 'Player0', type: 'Player', remoteAddress: '203.0.113.7' })
    };
    const streamer = {
        getStreamerInfo: () => ({ streamerId: 'DefaultStreamer', type: 'Streamer', streaming: true })
    };
    const signallingServer = {
        config: { streamerPort: 8888, playerPort: 80, peerOptions: {} },
        protocolConfig: { protocolVersion: '1.3.0', peerConnectionOptions: {} },
        startTime: new Date(),
        playerRegistry: {
            listPlayers: () => [player],
            get: (id: string) => (id === 'Player0' ? player : undefined),
            count: () => 1
        },
        streamerRegistry: {
            streamers: [streamer],
            find: (id: string) => (id === 'DefaultStreamer' ? streamer : undefined),
            count: () => 1
        }
    };

    await initialize({
        app,
        docsPath: '/api-definition',
        exposeApiDocs: true,
        apiDoc: './apidoc/api-definition-base.yml',
        paths: [
            { path: '/config', module: configHandler },
            { path: '/players', module: playersHandler },
            { path: '/players/{playerId}', module: playerByIdHandler },
            { path: '/status', module: statusHandler },
            { path: '/streamers', module: streamersHandler },
            { path: '/streamers/{streamerId}', module: streamerByIdHandler }
        ],
        dependencies: { signallingServer }
    });

    const server = await new Promise<http.Server>((resolve) => {
        const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });
    const { port } = server.address() as AddressInfo;
    return { url: `http://127.0.0.1:${port}`, server, refused };
}

describe('REST API token middleware', () => {
    let api: Awaited<ReturnType<typeof startApi>>;

    beforeAll(async () => {
        api = await startApi(TOKEN);
    });

    afterAll(async () => {
        await new Promise((resolve) => api.server.close(resolve));
    });

    const ROUTES = [
        '/api/config',
        '/api/players',
        '/api/players/Player0',
        '/api/status',
        '/api/streamers',
        '/api/streamers/DefaultStreamer',
        '/api/api-definition'
    ];

    // Every spelling Express routes to the same handler. Its mounts and routes are both case
    // insensitive and ignore a trailing slash, so the middleware must be reached by all of them.
    const VARIANTS = ROUTES.flatMap((route) => [route, route.toUpperCase(), `${route}/`, `${route}?x=1`]);

    it.each(VARIANTS)('refuses %s without a token', async (route) => {
        const res = await fetch(api.url + route);
        expect(res.status).toBe(401);
        expect(res.headers.get('www-authenticate')).toBe('Bearer');
        expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it.each(ROUTES)('refuses %s with a wrong token', async (route) => {
        const res = await fetch(api.url + route, { headers: { Authorization: `Bearer ${TOKEN}x` } });
        expect(res.status).toBe(401);
    });

    it.each(ROUTES)('serves %s with the token', async (route) => {
        const res = await fetch(api.url + route, { headers: { Authorization: `Bearer ${TOKEN}` } });
        expect(res.status).toBe(200);
    });

    it('accepts the scheme in any case', async () => {
        const res = await fetch(`${api.url}/api/status`, { headers: { Authorization: `bEaReR ${TOKEN}` } });
        expect(res.status).toBe(200);
    });

    it('does not accept the token as a query parameter', async () => {
        const res = await fetch(`${api.url}/api/status?token=${TOKEN}`);
        expect(res.status).toBe(401);
    });

    it('does not accept another scheme carrying the token', async () => {
        const res = await fetch(`${api.url}/api/status`, { headers: { Authorization: `Basic ${TOKEN}` } });
        expect(res.status).toBe(401);
    });

    it('reports refusals', async () => {
        api.refused.length = 0;
        await fetch(`${api.url}/api/players`);
        expect(api.refused).toEqual(['/api/players']);
    });

    it('leaves routes outside /api alone', async () => {
        // No such route here, so 404 rather than 401 shows the middleware did not answer it.
        const res = await fetch(`${api.url}/apiary`);
        expect(res.status).toBe(404);
    });
});

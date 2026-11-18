// Copyright Epic Games, Inc. All Rights Reserved.
import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';
import { Command } from 'commander';
import { IServerConfig, Logger } from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.7';
import { addSfuTokenOptions, configureSfuToken, loadSfuTokenFile } from './sfuAuth';
import { configureListenHosts } from './listenHosts';
import { IProgramOptions, redactConfig } from './Utils';

// As in streamerAuth.test.ts: the modules under test log through the Signalling library's Logger,
// which is replaced here so the suite does not depend on a built Signalling/dist.
jest.mock(
    '@epicgames-ps/lib-pixelstreamingsignalling-ue5.7',
    () => ({ Logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() } }),
    { virtual: true }
);

const TOKEN = 'supersecrettoken123';

function parseOptions(args: string[] = [], config: IProgramOptions = {}): IProgramOptions {
    const program = addSfuTokenOptions(new Command().exitOverride(), config);
    return program.parse(['node', 'test', ...args]).opts();
}

function serverOptions(): IServerConfig {
    return { streamerPort: 8888, playerPort: 80, sfuPort: 8889, peerOptions: {} };
}

function verify(
    options: IServerConfig,
    url: string,
    headers: http.IncomingHttpHeaders = {}
): { allowed: boolean; code?: number; message?: string } | undefined {
    const verifier = options.sfuWsOptions?.verifyClient;
    if (!verifier) return undefined;

    let result: { allowed: boolean; code?: number; message?: string } | undefined;
    verifier(
        { origin: '', secure: false, req: { url, headers } as http.IncomingMessage },
        (allowed, code, message) => {
            result = { allowed, code, message };
        }
    );
    return result;
}

describe('SFU token startup options', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('leaves SFU verification disabled when no token is given', () => {
        const serverOpts = serverOptions();
        expect(configureSfuToken(parseOptions(), serverOpts)).toBe('');
        expect(serverOpts.sfuWsOptions?.verifyClient).toBeUndefined();
    });

    it('refuses an SFU without the token and admits one with it', () => {
        const serverOpts = serverOptions();
        configureSfuToken(parseOptions(['--sfu_token', TOKEN]), serverOpts);

        expect(verify(serverOpts, '/')).toEqual({ allowed: false, code: 401, message: 'Unauthorized' });
        expect(verify(serverOpts, '/?token=wrong')).toEqual({
            allowed: false,
            code: 401,
            message: 'Unauthorized'
        });
        expect(verify(serverOpts, `/?token=${TOKEN}`)).toEqual({ allowed: true });
        expect(verify(serverOpts, '/', { authorization: `Bearer ${TOKEN}` })).toEqual({ allowed: true });
    });

    it('protects only the SFU listener', () => {
        const serverOpts = serverOptions();
        configureSfuToken(parseOptions(['--sfu_token', TOKEN]), serverOpts);
        expect(serverOpts.streamerWsOptions).toBeUndefined();
        expect(serverOpts.playerWsOptions).toBeUndefined();
    });

    it('keeps the SFU listen host set alongside it, in either order', () => {
        const tokenFirst = serverOptions();
        configureSfuToken(parseOptions(['--sfu_token', TOKEN]), tokenFirst);
        configureListenHosts({ sfu_host: '127.0.0.1' }, tokenFirst);

        const hostFirst = serverOptions();
        configureListenHosts({ sfu_host: '127.0.0.1' }, hostFirst);
        configureSfuToken(parseOptions(['--sfu_token', TOKEN]), hostFirst);

        for (const serverOpts of [tokenFirst, hostFirst]) {
            expect(serverOpts.sfuWsOptions?.host).toBe('127.0.0.1');
            expect(verify(serverOpts, `/?token=${TOKEN}`)).toEqual({ allowed: true });
        }
    });

    it('fails closed when a config value is not text or a number', () => {
        for (const value of [true, ['a'], { a: 1 }]) {
            expect(() => configureSfuToken(parseOptions([], { sfu_token: value }), serverOptions())).toThrow(
                'Invalid sfu_token.'
            );
        }
    });

    it('coerces a numeric config value and warns', () => {
        const serverOpts = serverOptions();
        expect(configureSfuToken(parseOptions([], { sfu_token: 12345678 }), serverOpts)).toBe('12345678');
        expect(verify(serverOpts, '/?token=12345678')).toEqual({ allowed: true });
        expect(Logger.warn).toHaveBeenCalledWith(expect.stringContaining('given as a number'));
    });

    it('redacts the token from the startup config dump', () => {
        expect(redactConfig(parseOptions(['--sfu_token', TOKEN])).sfu_token).toBe('<redacted>');
    });

    describe('--sfu_token_file', () => {
        let dir: string;

        beforeEach(() => {
            dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfu-token-'));
        });

        afterEach(() => {
            fs.rmSync(dir, { recursive: true, force: true });
        });

        it('loads and trims a valid file', () => {
            const file = path.join(dir, 'token.txt');
            fs.writeFileSync(file, `${TOKEN}\n`);
            const options = parseOptions(['--sfu_token_file', file]);
            loadSfuTokenFile(options);
            expect(options.sfu_token).toBe(TOKEN);
        });

        it('rejects a missing file', () => {
            expect(() => loadSfuTokenFile({ sfu_token_file: path.join(dir, 'missing.txt') })).toThrow();
        });

        it('rejects an empty file', () => {
            const file = path.join(dir, 'empty.txt');
            fs.writeFileSync(file, '\n');
            expect(() => loadSfuTokenFile({ sfu_token_file: file })).toThrow();
        });

        it('rejects a non-string filename from config', () => {
            expect(() => loadSfuTokenFile({ sfu_token_file: 42 })).toThrow('Invalid sfu_token_file.');
        });
    });
});

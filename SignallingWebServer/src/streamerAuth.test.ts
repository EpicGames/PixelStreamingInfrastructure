// Copyright Epic Games, Inc. All Rights Reserved.
import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';
import { Command } from 'commander';
import { IServerConfig, Logger } from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.8';
import {
    addStreamerTokenOptions,
    configureStreamerToken,
    loadStreamerTokenFile
} from './streamerAuth';
import { IProgramOptions, redactConfig } from './Utils';

function parseOptions(args: string[] = [], config: IProgramOptions = {}): IProgramOptions {
    const program = addStreamerTokenOptions(new Command().exitOverride(), config);
    return program.parse(['node', 'test', ...args]).opts();
}

function serverOptions(): IServerConfig {
    return { streamerPort: 8888, playerPort: 80, peerOptions: {} };
}

function verify(
    options: IServerConfig,
    url: string
): { allowed: boolean; code?: number; message?: string } | undefined {
    const verifier = options.streamerWsOptions?.verifyClient;
    if (!verifier) return undefined;

    let result: { allowed: boolean; code?: number; message?: string } | undefined;
    verifier(
        {
            origin: '',
            secure: false,
            req: { url, headers: {} } as http.IncomingMessage
        },
        (allowed, code, message) => {
            result = { allowed, code, message };
        }
    );
    return result;
}

describe('streamer token startup options', () => {
    it('leaves streamer verification disabled when the CLI token is omitted', () => {
        const serverOpts = serverOptions();
        configureStreamerToken(parseOptions(), serverOpts);
        expect(serverOpts.streamerWsOptions?.verifyClient).toBeUndefined();
    });

    it('wires the CLI token into streamer verification', () => {
        const serverOpts = serverOptions();
        configureStreamerToken(
            parseOptions(['--streamer_token', 'supersecrettoken123']),
            serverOpts
        );

        expect(verify(serverOpts, '/')).toEqual({
            allowed: false,
            code: 401,
            message: 'Unauthorized'
        });
        expect(verify(serverOpts, '/?token=wrong')).toEqual({
            allowed: false,
            code: 401,
            message: 'Unauthorized'
        });
        expect(verify(serverOpts, '/?token=supersecrettoken123')).toEqual({ allowed: true });
    });

    it('fails closed when a non-string config value supplies the default', () => {
        expect(() => configureStreamerToken(parseOptions([], { streamer_token: true }), serverOptions())).toThrow(
            'Invalid streamer_token.'
        );
    });

    it('redacts the parsed CLI token from logged configuration', () => {
        const options = parseOptions(['--streamer_token', 'supersecrettoken123']);
        expect(redactConfig(options).streamer_token).toBe('<redacted>');
    });

    describe('--streamer_token_file', () => {
        let temporaryDirectory: string;
        let loggerError: jest.SpyInstance;

        beforeEach(() => {
            temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'wilbur-streamer-auth-'));
            loggerError = jest.spyOn(Logger, 'error').mockImplementation();
        });

        afterEach(() => {
            loggerError.mockRestore();
            fs.rmSync(temporaryDirectory, { recursive: true, force: true });
        });

        it('rejects a missing file', () => {
            const filename = path.join(temporaryDirectory, 'missing');
            expect(() => loadStreamerTokenFile(parseOptions(['--streamer_token_file', filename]))).toThrow(
                `Failed to find the file ${filename} given to streamer_token_file.`
            );
        });

        it('rejects a non-string filename from config', () => {
            expect(() =>
                loadStreamerTokenFile(parseOptions([], { streamer_token_file: true }))
            ).toThrow('Invalid streamer_token_file.');
        });

        it('rejects an empty file', () => {
            const filename = path.join(temporaryDirectory, 'empty');
            fs.writeFileSync(filename, '\n');
            expect(() => loadStreamerTokenFile(parseOptions(['--streamer_token_file', filename]))).toThrow(
                `The file ${filename} given to streamer_token_file contains no value.`
            );
        });

        it('loads and trims a valid file', () => {
            const filename = path.join(temporaryDirectory, 'token');
            fs.writeFileSync(filename, '  supersecrettoken123\n');
            const options = parseOptions(['--streamer_token_file', filename]);

            loadStreamerTokenFile(options);

            expect(options.streamer_token).toBe('supersecrettoken123');
        });
    });
});

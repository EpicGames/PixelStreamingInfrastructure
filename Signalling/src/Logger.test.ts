// Copyright Epic Games, Inc. All Rights Reserved.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { IConfig, InitLogging, Logger } from './Logger';
import { MAX_LOGGED_LENGTH } from './Utils';

type Transport = (typeof Logger.transports)[number];

const LEVEL = Symbol.for('level');
const MESSAGE = Symbol.for('message');

// Runs a log call through a transport's format and returns the line it would write. Formatting does no
// I/O, so this reads exactly what the logger produces without waiting on the file.
function lineFor(transport: Transport, message: unknown): string {
    const info = transport.format?.transform({ level: 'info', message, [LEVEL]: 'info' });
    if (!info || info === true) {
        throw new Error('the format dropped the line');
    }
    return info[MESSAGE] as string;
}

// InitLogging opens the day's file, so every logger a test creates is closed before its folder is removed.
async function withLogger(config: IConfig, check: (console: Transport, file: Transport) => void) {
    InitLogging(config);
    const [consoleTransport, fileTransport] = Logger.transports;
    try {
        check(consoleTransport, fileTransport);
    } finally {
        await new Promise((resolve) => {
            fileTransport.once('finish', resolve);
            fileTransport.close?.();
        });
    }
}

describe('InitLogging', () => {
    let logDir: string;

    beforeEach(() => {
        logDir = fs.mkdtempSync(path.join(os.tmpdir(), 'signalling-log-'));
    });

    afterEach(() => {
        fs.rmSync(logDir, { recursive: true, force: true });
    });

    it('refuses a file size that the file transport would take as no limit', () => {
        expect(() => InitLogging({ logDir, logMaxSize: '100mb' })).toThrow('logMaxSize');
        expect(() => InitLogging({ logDir, logMaxSize: '0m' })).toThrow('logMaxSize');
    });

    it('refuses a file count that the file transport would take as no limit', () => {
        expect(() => InitLogging({ logDir, logMaxFiles: 0 })).toThrow('logMaxFiles');
        expect(() => InitLogging({ logDir, logMaxFiles: NaN })).toThrow('logMaxFiles');
    });

    it('limits the size of each log file and how many are kept', async () => {
        await withLogger({ logDir }, (_console, file) => {
            const { options } = file as unknown as { options: { maxSize: unknown; maxFiles: unknown } };
            expect(options.maxSize).toBe('100m');
            expect(options.maxFiles).toBe(14);
        });
        await withLogger({ logDir, logMaxSize: '5m', logMaxFiles: 3 }, (_console, file) => {
            const { options } = file as unknown as { options: { maxSize: unknown; maxFiles: unknown } };
            expect(options.maxSize).toBe('5m');
            expect(options.maxFiles).toBe(3);
        });
    });

    it('cuts long text on the console and in the file', async () => {
        const text = 'x'.repeat(100000);
        await withLogger({ logDir }, (console, file) => {
            const consoleLine = lineFor(console, text);
            expect(consoleLine.endsWith('... (100000 characters)')).toBe(true);
            expect(consoleLine.length).toBeLessThan(MAX_LOGGED_LENGTH + 100);

            const fileLine = lineFor(file, text);
            expect(
                (JSON.parse(fileLine) as { message: string }).message.endsWith('... (100000 characters)')
            ).toBe(true);
            expect(fileLine.length).toBeLessThan(MAX_LOGGED_LENGTH + 200);
        });
    });

    it('writes a protocol message to the file whole, or as cut JSON text when it is too long', async () => {
        const logObj = (protoMessage: object) => ({
            event: 'proto_message',
            direction: 'incoming',
            receiver: 'Player0',
            protoMessage
        });
        await withLogger({ logDir }, (_console, file) => {
            const short = JSON.parse(lineFor(file, logObj({ type: 'ping', time: 1 }))) as {
                protoMessage: unknown;
            };
            expect(short.protoMessage).toEqual({ type: 'ping', time: 1 });

            const long = { type: 'ping', pad: 'a'.repeat(100000) };
            const longLine = lineFor(file, logObj(long));
            const parsed = JSON.parse(longLine) as { protoMessage: string };
            expect(parsed.protoMessage.startsWith('{"type":"ping"')).toBe(true);
            expect(parsed.protoMessage.endsWith(`... (${JSON.stringify(long).length} characters)`)).toBe(
                true
            );
            expect(longLine.length).toBeLessThan(MAX_LOGGED_LENGTH + 300);
        });
    });
});

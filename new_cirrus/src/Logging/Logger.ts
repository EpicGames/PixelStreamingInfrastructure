// Copyright Epic Games, Inc. All Rights Reserved.
import fs from 'fs';
import stream from 'stream';

export enum LogLevel {
    Info,
    Log,
    Warning,
    Error
};

export type StructuredLog = { [key: string]: any };

export function logLevelToString(logLevel: LogLevel): string {
    switch (logLevel) {
    case LogLevel.Info: return "Info";
    case LogLevel.Log: return "Log";
    case LogLevel.Warning: return "\x1b[33mWarning\x1b[0m";
    case LogLevel.Error: return "\x1b[31mError\x1b[0m";
    }
    return "Unknown";
}

export interface ILogSink {
    log(logLevel: LogLevel, message: string | StructuredLog): void;
}

export class ConsoleLogWriter implements ILogSink {
    private minLogLevel: LogLevel;

    constructor() {
        this.minLogLevel = LogLevel.Info;
    }

    log(logLevel: LogLevel, message: string | StructuredLog): void {
        if (logLevel >= this.minLogLevel) {
            console.log(`[${logLevelToString(logLevel)}] ${message}`);
        }
    }
}

export class FileLogWriter implements ILogSink {
    private minLogLevel: LogLevel;
    private fileStream: stream.Writable;

    constructor(path: string) {
        this.minLogLevel = LogLevel.Info;
        this.fileStream = fs.createWriteStream(path, { flags: 'a' });
    }

    log(logLevel: LogLevel, message: string): void {
        if (logLevel >= this.minLogLevel) {
            const logString = `[${logLevelToString(logLevel)}] ${message}`;
            this.fileStream.write(logString.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, ''));
            this.fileStream.write('\n');
        }
    }
}

export class Logger$Type {
    logSinks: ILogSink[];

    constructor() {
        this.logSinks = [];
    }

    addWriter(writer: ILogSink) {
        this.logSinks.push(writer);
    }

    /**
     * The standard logging output
     * @param message - the message to be logged
     */
    info(message: string | StructuredLog) {
        this.logInternal(LogLevel.Info, message);
    }

    /**
     * The standard logging output
     * @param message - the message to be logged
     */
    log(message: string | StructuredLog) {
        this.logInternal(LogLevel.Log, message);
    }

    /**
     * The standard logging output
     * @param message - the message to be logged
     */
    warning(message: string | StructuredLog) {
        this.logInternal(LogLevel.Warning, message);
    }

    /**
     * The standard logging output
     * @param message - the message to be logged
     */
    error(message: string | StructuredLog) {
        this.logInternal(LogLevel.Error, message);
    }

    private logInternal(logLevel: LogLevel, message: string | StructuredLog): void {
        for (const sink of this.logSinks) {
            sink.log(logLevel, message);
        }
    }

    /**
     * Captures the stack and returns it
     * @returns the current stack
     */
    private GetStackTrace() {
        const error = new Error();
        let formattedStack = 'No Stack Available for this browser';

        // format the error
        if (error.stack) {
            formattedStack = error.stack.toString().replace(/Error/g, '');
        }

        return formattedStack;
    }

}

export const Logger = new Logger$Type();

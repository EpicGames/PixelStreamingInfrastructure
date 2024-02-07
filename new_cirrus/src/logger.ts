// Copyright Epic Games, Inc. All Rights Reserved.

export enum LogLevel {
    Info,
    Log,
    Error,
    Warning
};

export class Logger$Type {
    minLogLevel: LogLevel;

    constructor() {
        this.minLogLevel = LogLevel.Info;
    }

    /**
     * The standard logging output
     * @param message - the message to be logged
     */
    info(message: string) {
        this.logInternal(LogLevel.Info, message);
    }

    /**
     * The standard logging output
     * @param message - the message to be logged
     */
    log(message: string) {
        this.logInternal(LogLevel.Log, message);
    }

    /**
     * The standard logging output
     * @param message - the message to be logged
     */
    warning(message: string) {
        this.logInternal(LogLevel.Warning, message);
    }

    /**
     * The standard logging output
     * @param message - the message to be logged
     */
    error(message: string) {
        this.logInternal(LogLevel.Error, message);
    }

    private logInternal(logLevel: LogLevel, message: string): void {
        if (logLevel >= this.minLogLevel) {
            console.log(`[${this.levelToString(logLevel)}] ${message}`);
        }
    }

    private levelToString(logLevel: LogLevel): string {
        switch (logLevel) {
        case LogLevel.Info: return "Info";
        case LogLevel.Log: return "Log";
        case LogLevel.Warning: return "\x1b[33mWarning\x1b[0m";
        case LogLevel.Error: return "\x1b[31mError\x1b[0m";
        }
        return "Unknown";
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

// Copyright Epic Games, Inc. All Rights Reserved.

export enum LogLevel {
    Info,
    Log,
    Error,
    Warning
};

export class Logger$Type {
    minLogLevel: LogLevel;
    timestamp: boolean;

    constructor() {
        this.minLogLevel = LogLevel.Info;
        this.timestamp = true;
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
            let timestamp = '';
            if (this.timestamp) {
                timestamp = timeToString() + ' ';
            }
            console.log(`${timestamp}[${this.levelToString(logLevel)}] ${message}`);
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

/**
 * Pad the start of the given number with zeros so it takes up the number of digits.
 * e.g. zeroPad(5, 3) = '005' and zeroPad(23, 2) = '23'.
 */
function zeroPad(number: number, digits: number) {
    let string = number.toString();
    while (string.length < digits) {
        string = '0' + string;
    }
    return string;
}

/**
 * Create a string of the form 'YEAR.MONTH.DATE.HOURS.MINUTES.SECONDS'.
 */
function dateTimeToString() {
    let date = new Date();
    return `${date.getFullYear()}.${zeroPad(date.getMonth(), 2)}.${zeroPad(date.getDate(), 2)}.${zeroPad(date.getHours(), 2)}.${zeroPad(date.getMinutes(), 2)}.${zeroPad(date.getSeconds(), 2)}`;
}

/**
 * Create a string of the form 'HOURS.MINUTES.SECONDS.MILLISECONDS'.
 */
function timeToString() {
    let date = new Date();
    return `${zeroPad(date.getHours(), 2)}:${zeroPad(date.getMinutes(), 2)}:${zeroPad(date.getSeconds(), 2)}.${zeroPad(date.getMilliseconds(), 3)}`;
}

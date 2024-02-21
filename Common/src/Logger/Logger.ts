// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * A basic console logger utilized by the Pixel Streaming frontend to allow
 * logging to the browser console.
 */
export class Logger {
    static verboseLogLevel = 5;

    /**
     * Captures the stack and returns it
     * @returns the current stack
     */
    static GetStackTrace() {
        const error = new Error();
        let formattedStack = 'No Stack Available for this browser';

        // format the error
        if (error.stack) {
            formattedStack = error.stack.toString().replace(/Error/g, '');
        }

        return formattedStack;
    }

    /**
     * Set the log verbosity level
     */
    static SetLoggerVerbosity(verboseLogLevel: number) {
        if (this.verboseLogLevel != null) {
            this.verboseLogLevel = verboseLogLevel;
        }
    }

    /**
     * The standard logging output
     * @param stack - the stack trace
     * @param message - the message to be logged
     * @param verbosity - the verbosity level
     */
    static Log(stack: string, message: string, verbosity?: number) {
        if (verbosity !== undefined && verbosity > this.verboseLogLevel) {
            return;
        }

        this.CommonLog("Log", null, message);
    }

    /**
     * The standard logging output
     * @param stack - the stack trace
     * @param message - the message to be logged
     * @param verbosity - the verbosity level
     */
    static Info(stack: string, message: string, verbosity?: number) {
        if (verbosity !== undefined && verbosity > this.verboseLogLevel) {
            return;
        }

        this.CommonLog("Info", null, message);
    }

    /**
     * The standard logging output
     * @param stack - the stack trace
     * @param message - the message to be logged
     */
    static Error(stack: string, message: string) {
        this.CommonLog("Error", stack, message);
    }

    /**
     * The standard logging output
     * @param stack - the stack trace
     * @param message - the message to be logged
     */
    static Warning(stack: string, message: string) {
        this.CommonLog("Warning", null, message);
    }

    /**
     * The common log function that all other log functions call to.
     * @param level - the level of this log message.
     * @param stack - an optional stack trace string from where the log message was called.
     * @param message - the message to be logged.
     */
    static CommonLog(level: string, stack: null | string, message: string) {
        if (stack) {
            console.log(`[${level}] - ${message}\nCaller: ${stack}`);
        } else {
            console.log(`[${level}] - ${message}`);
        }
    }
}

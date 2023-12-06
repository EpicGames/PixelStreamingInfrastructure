// Copyright Epic Games, Inc. All Rights Reserved.
export class Logger {
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
    static SetLoggerVerbosity(verboseLogLevel) {
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
    static Log(stack, message, verbosity) {
        if (verbosity > this.verboseLogLevel) {
            return;
        }
        const returnString = `Level: Log\nMsg: ${message}\nCaller: ${stack}`;
        console.log(returnString);
    }
    /**
     * The standard logging output
     * @param stack - the stack trace
     * @param message - the message to be logged
     * @param verbosity - the verbosity level
     */
    static Info(stack, message, verbosity) {
        if (verbosity > this.verboseLogLevel) {
            return;
        }
        const returnString = `Level: Info\nMsg: ${message}`;
        console.info(returnString);
    }
    /**
     * The standard logging output
     * @param stack - the stack trace
     * @param message - the message to be logged
     */
    static Error(stack, message) {
        const returnString = `Level: Error\nMsg: ${message}\nCaller: ${stack}`;
        console.error(returnString);
    }
    /**
     * The standard logging output
     * @param stack - the stack trace
     * @param message - the message to be logged
     */
    static Warning(stack, message) {
        const returnString = `Level: Warning\nCaller: ${stack}\nMsg: ${message}`;
        console.warn(returnString);
    }
}
Logger.verboseLogLevel = 5;
//# sourceMappingURL=Logger.js.map
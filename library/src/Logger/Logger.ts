export class Logger {
    static verboseLogLevel: number = 5;

    /**
     * Captures the stack and returns it
     * @returns the current stack
     */
    static GetStackTrace() {
        let error = new Error();
        let formattedStack = "No Stack Available for this browser";

        // format the error
        if (error.stack) {
            formattedStack = error.stack.toString().replace(/Error/g, '');
        }

        return formattedStack;
    };

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
        if (verbosity > this.verboseLogLevel) {
            return;
        }

        let returnString = `Level: Log, Caller: ${stack}, Msg: ${message}`;
        console.log(returnString);
    }

    /**
     * The standard logging output 
     * @param stack - the stack trace
     * @param message - the message to be logged
     * @param verbosity - the verbosity level
     */
    static Info(stack: string, message: string, verbosity?: number) {
        if (verbosity > this.verboseLogLevel) {
            return;
        }

        let returnString = `Level: Info, Msg: ${message}`;
        console.info(returnString);
    }

    /**
     * The standard logging output 
     * @param stack - the stack trace
     * @param message - the message to be logged
     */
    static Error(stack: string, message: string) {
        let returnString = `Level: Error, Caller: ${stack}, Msg: ${message}`;
        console.error(returnString);
    }
}
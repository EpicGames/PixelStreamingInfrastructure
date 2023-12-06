export declare class Logger {
    static verboseLogLevel: number;
    /**
     * Captures the stack and returns it
     * @returns the current stack
     */
    static GetStackTrace(): string;
    /**
     * Set the log verbosity level
     */
    static SetLoggerVerbosity(verboseLogLevel: number): void;
    /**
     * The standard logging output
     * @param stack - the stack trace
     * @param message - the message to be logged
     * @param verbosity - the verbosity level
     */
    static Log(stack: string, message: string, verbosity?: number): void;
    /**
     * The standard logging output
     * @param stack - the stack trace
     * @param message - the message to be logged
     * @param verbosity - the verbosity level
     */
    static Info(stack: string, message: string, verbosity?: number): void;
    /**
     * The standard logging output
     * @param stack - the stack trace
     * @param message - the message to be logged
     */
    static Error(stack: string, message: string): void;
    /**
     * The standard logging output
     * @param stack - the stack trace
     * @param message - the message to be logged
     */
    static Warning(stack: string, message: string): void;
}

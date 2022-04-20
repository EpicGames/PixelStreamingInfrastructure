import { Config } from "../Config/Config";

/**
 * The current logger for the frontend 
 */
export class Logger {

    /**
     * The standard logging output 
     * @param text - the string to be logged 
     */
    static infoLog(text: string) {
        console.log(text);
    }

    /**
     * The verbose logging output 
     * @param text - the string to be logged 
     */
    static verboseLog(text: string) {
        if (Config._enableVerboseLogging === true) {
            console.log(text);
       }
    }

}
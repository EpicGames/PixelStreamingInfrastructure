import { Logger } from "../Logger/Logger";

export class MicController {
    useMic: boolean;
    isLocalhostConnection: boolean;
    isHttpsConnection: boolean;

    /**
     * @param urlParams - the url search parameters 
     */
    constructor(urlParams: URLSearchParams) {
        // get the mic status from the url 
        this.useMic = urlParams.has('useMic');

        if (this.useMic) {
            Logger.Info(Logger.GetStackTrace(), "Microphone access is enabled IT IS EXPERIMENTAL AND IS NOT PROPERLY SUPPORTED ACROSS UE. IF IT DOES NOT WORK ITS YOUR OWN FAULT! YOU HAVE BEEN TOLD.");
        }

        // if (!this.useMic) {
        //     Logger.Log(Logger.GetStackTrace(), "Microphone access is not enabled. Pass ?useMic in the url to enable it.");
        // }

        // check if the connection is not local and is https or mic will not work 
        this.isLocalhostConnection = location.hostname === "localhost" || location.hostname === "127.0.0.1";
        this.isHttpsConnection = location.protocol === 'https:';
        if (this.useMic && !this.isLocalhostConnection && !this.isHttpsConnection) {
            this.useMic = false;
            Logger.Error(Logger.GetStackTrace(), "Microphone access in the browser will not work if you are not on HTTPS or localhost. Disabling mic access.");
            Logger.Error(Logger.GetStackTrace(), "For testing you can enable HTTP microphone access Chrome by visiting chrome://flags/ and enabling 'unsafely-treat-insecure-origin-as-secure'");
        }
    }

}
import { Logger } from "../Logger/Logger";

export class ResponseController {

    responseEventListeners: Map<string, (response: string) => void> = new Map();

    constructor() { }

    /**
     * Add a response event listener to the response map
     * @param name - The name of the response 
     * @param listener - The method to be activated when the response is selected
     */
    addResponseEventListener(name: string, listener: (response: string) => {}) {
        this.responseEventListeners.set(name, listener);
    }

    /**
     * Remove a response event listener to the response map
     * @param name - The name of the response
     */
    removeResponseEventListener(name: string) {
        this.responseEventListeners.delete(name);
    }

    /**
     * Handle a response when receiving one form the streamer 
     * @param message - Data received from the data channel with the command in question
     */
    onResponse(message: Uint16Array) {
        Logger.Log(Logger.GetStackTrace(), "DataChannelReceiveMessageType.Response", 6);
        let responses = new TextDecoder("utf-16").decode(message.slice(1));

        Logger.Log(Logger.GetStackTrace(), responses, 6);
        this.responseEventListeners.forEach((listener: (response: string) => void, key: string) => {
            listener(responses);
        });
    }
}
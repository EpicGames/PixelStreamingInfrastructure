import { MessageDirection } from "./StreamMessageController";
import { TwoWayMap } from "./TwoWayMap";

export interface IStreamMessageController {
    toStreamerHandlers: Map<string, (messageType: any, messageData?: any[] | undefined) => void>;
    fromStreamerHandlers: Map<string, (messageType: any, messageData?: any[] | undefined) => void>;
    toStreamerMessages: TwoWayMap;
    fromStreamerMessages: TwoWayMap;

    /**
     * Populate the Default message protocol 
     */
    populateDefaultProtocol(): void;

    /**
     * Register a message handler 
     * @param messageDirection - the direction of the message; toStreamer or fromStreamer
     * @param messageType - the type of the message 
     * @param messageHandler - the function or method to be executed when this handler is called
     */
    registerMessageHandler(messageDirection: MessageDirection, messageType: string, messageHandler: (messageType: any, messageData?: any[] | undefined) => void): void;

    /**
     * Get the current map for to streamer handlers
     */
    getToStreamHandlersMap(): Map<string, (messageType: any, messageData?: any[] | undefined) => void>;

    /**
     * Get the current twoWayMap for to streamer messages
     */
    getToStreamerMessageMap(): TwoWayMap;
}
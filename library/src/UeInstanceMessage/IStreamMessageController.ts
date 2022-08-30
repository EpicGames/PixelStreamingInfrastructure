import { MessageDirection } from "./StreamMessageController";
import { TwoWayMap } from "./TwoWayMap";

export interface IStreamMessageController {
    toStreamerHandlers: Map<string, (messageType: any, messageData?: any[] | undefined) => void>;
    fromStreamerHandlers: Map<string, (messageType: any, messageData?: any[] | undefined) => void>;
    toStreamerMessages: TwoWayMap;
    fromStreamerMessages: TwoWayMap;

    populateDefaultProtocol(): void;

    registerMessageHandler(messageDirection: MessageDirection, messageType: string, messageHandler: (messageType: any, messageData?: any[] | undefined) => void): void;

    /**
     * Get the current twoWayMap for to streamer messages
     */
    getToStreamerMessageMap(): TwoWayMap;
}
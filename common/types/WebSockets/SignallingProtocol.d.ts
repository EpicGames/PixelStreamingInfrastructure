import { WebSocketController } from './WebSocketController';
/**
 * Signalling protocol for handling messages from the signalling server.
 */
export declare class SignallingProtocol {
    private FromUEMessageHandlers;
    constructor();
    addMessageHandler(messageId: string, messageHandler: (payload: string) => void): void;
    handleMessage(messageId: string, messageData: string): void;
    /**
     * Setup any default signalling message handling, these can be overridden or additional handlers added with `addMessageHandler`.
     * @param websocketController The controller to setup these handlers on.
     */
    static setupDefaultHandlers(websocketController: WebSocketController): void;
}

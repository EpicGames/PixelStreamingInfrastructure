import { MessageSend } from '../WebSockets/MessageSend';
import { MessageRecv } from '../WebSockets/MessageReceive';

export interface ITransport {
    events: EventTarget;
    sendMessage(msg: MessageSend): void;
    onMessage: (msg: MessageRecv) => void;
    connect(url: string): boolean;
    disconnect(): void;
    isConnected(): boolean;
}


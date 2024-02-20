import { BaseMessage } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { Logger } from './Logger';

/**
 * Most methods in here rely on connections implementing this interface so we can identify
 * who is sending or receiving etc.
 */
export interface IMessageLogger {
    getReadableIdentifier(): string;
}

/**
 * Call to log messages received on a connection that we will handle here at the server.
 * Do not call this for messages being forwarded to another connection.
 * @param recvr IMessageLogger The connection the message was received on.
 */
export function logIncoming(recvr: IMessageLogger, message: BaseMessage): void {
    Logger.info({
        event: 'proto_message',
        direction: 'incoming',
        receiver: recvr.getReadableIdentifier(),
        protoMessage: message
    });
}

/**
 * Call to log messages created here at the server and being sent to the connection.
 * Do not call this for messages being forwarded to this connection.
 * @param sender IMessageLogger The connection the message is being sent to.
 */
export function logOutgoing(sender: IMessageLogger, message: BaseMessage): void {
    Logger.info({
        event: 'proto_message',
        direction: 'outgoing',
        sender: sender.getReadableIdentifier(),
        protoMessage: message
    });
}

/**
 * Call this for messages being forwarded to this connection. That is messages received on
 * one connection and being sent to another with only minor changes being made.
 * @param recvr: IMessageLogger The connection the message was received on.
 * @param sender IMessageLogger The connection the message is being sent to.
 */
export function logForward(recvr: IMessageLogger, target: IMessageLogger, message: BaseMessage): void {
    Logger.info({
        event: 'proto_message',
        direction: 'forward',
        receiver: recvr.getReadableIdentifier(),
        target: target.getReadableIdentifier(),
        protoMessage: message
    });
}

/**
 * We don't want to log every incoming and outgoing messages. This is because some messages are simply
 * forwarded to other connections. This results in duplicated spam. So we only want to log incoming
 * messages that we handle internally, and any messages that we forward we only log once for the recv
 * and send events.
 * This creation method allows a simple way to enforce this. Any events we handle directly will
 * be preceded by the logging call.
 */
export function createHandlerListener(obj: IMessageLogger, handler: (message: any) => void) {
    return (message: BaseMessage) => {
        logIncoming(obj, message);
        handler.bind(obj)(message);
    };
}

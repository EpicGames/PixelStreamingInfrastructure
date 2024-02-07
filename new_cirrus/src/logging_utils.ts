import { BaseMessage } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { Logger } from './logger';
import { stringify } from './utils';

/**
 * Most methods in here rely on connections implementing this interface so we can identify
 * who is sending or receiving etc.
 */
export interface IMessageLogger {
	getIdentifier(): string;
}

/**
 * These identifier methods are here for convenience so all the connection types can have
 * their identifying strings changed in the one place. Rather than each of them implementing
 * their own in whatever code we're executing.
 */

export function streamerIdentifier(streamerId: string): string {
	return `S:${streamerId}`;
}

export function playerIdentifier(playerId: string): string {
	return `P:${playerId}`;
}

export function sfuIdentifier(streamerId: string, playerId: string): string {
	return `(${streamerId}:${playerId})`;
}

/**
 * Call to log messages received on a connection that we will handle here at the server.
 * Do not call this for messages being forwarded to another connection.
 * @param recvr IMessageLogger The connection the message was received on.
 */
export function logIncoming(recvr: IMessageLogger, message: BaseMessage): void {
	Logger.info(`${formatIdentifier(recvr.getIdentifier())} ${formatDirection('>')} ${separator()} ${formatMessage(message)}`);
}

/**
 * Call to log messages created here at the server and being sent to the connection.
 * Do not call this for messages being forwarded to this connection.
 * @param sender IMessageLogger The connection the message is being sent to.
 */
export function logOutgoing(sender: IMessageLogger, message: BaseMessage): void {
	Logger.info(`${formatIdentifier(sender.getIdentifier())} ${formatDirection('<')} ${separator()} ${formatMessage(message)}`);
}

/**
 * Call this for messages being forwarded to this connection. That is messages received on
 * one connection and being sent to another with only minor changes being made.
 * @param recvr: IMessageLogger The connection the message was received on.
 * @param sender IMessageLogger The connection the message is being sent to.
 */
export function logForward(recvr: IMessageLogger, target: IMessageLogger, message: BaseMessage): void {
	Logger.info(`${formatIdentifier(recvr.getIdentifier())} ${formatDirection('>')} ${formatIdentifier(target.getIdentifier())} ${separator()} ${formatMessage(message)}`);
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

function formatMessage(message: any): string {
	// Compact version
	return `[${message.type}]`;

	// Full message
	//return stringify(message);

	// List a compact version of the message. I don't really like this currently.
	// let str = '';
	// for (const param in message) {
	// 	const value = message[param];
	// 	if (str.length > 0) {
	// 		str += ', ';
	// 	}
	// 	if (param == 'type') {
	// 		str += `${param}=${value}`;
	// 	} else if (typeof value == 'object') {
	// 		str += `${param}={...}`;
	// 	} else if (typeof value == 'string') {
	// 		const maxLength = 20;
	// 		if (value.length > maxLength) {
	// 			str += `${param}=${JSON.stringify(value.substring(0, maxLength) + '...')}`;
	// 		} else {
	// 			str += `${param}="${JSON.stringify(value)}"`;
	// 		}
	// 	} else {
	// 		str += `${param}=${value}`;
	// 	}
	// }
	// return `[${str}]`;
}

function formatIdentifier(id: string): string {
	return `\x1b[34m${id}\x1b[0m`;
}

function formatDirection(indicator: string): string {
	return `\x1b[32m${indicator}\x1b[0m`;
}

function separator(): string {
	return `\x1b[36m::\x1b[0m`;
}

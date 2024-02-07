import { jsonc } from 'jsonc';
import { BaseMessage } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { Logger } from './logger';

export interface IMessageLogger {
	getIdentifier(): string;
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
		Logger.info(formatIncoming(obj.getIdentifier(), message));
		handler.bind(obj)(message);
	};
}

export function stringify(obj: any): string {
	return jsonc.stringify(obj);
}

export function beautify(obj: any): string {
	return jsonc.stringify(obj, undefined, '\t');
}

export function formatMessage(message: any): string {
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

export function formatIncoming(recId: string, message: BaseMessage): string {
	return `${formatIdentifier(recId)} ${formatDirection('>')} ${separator()} ${formatMessage(message)}`
}

export function formatOutgoing(senderId: string, message: BaseMessage): string {
	return `${formatIdentifier(senderId)} ${formatDirection('<')} ${separator()} ${formatMessage(message)}`;
}

export function formatForward(recId: string, senderId: string, message: BaseMessage): string {
	return `${formatIdentifier(recId)} ${formatDirection('>')} ${formatIdentifier(senderId)} ${separator()} ${formatMessage(message)}`;
}

export function streamerIdentifier(streamerId: string): string {
	return `S:${streamerId}`;
}

export function playerIdentifier(playerId: string): string {
	return `P:${playerId}`;
}

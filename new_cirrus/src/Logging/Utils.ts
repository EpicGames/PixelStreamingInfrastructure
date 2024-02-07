import { BaseMessage } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.5';
import { Logger, ILogSink, LogLevel, logLevelToString, StructuredLog } from './Logger';
import { stringify } from '../utils';

/**
 * Pad the start of the given number with zeros so it takes up the number of digits.
 * e.g. zeroPad(5, 3) = '005' and zeroPad(23, 2) = '23'.
 */
export function zeroPad(number: number, digits: number) {
    let string = number.toString();
    while (string.length < digits) {
        string = '0' + string;
    }
    return string;
}

/**
 * Create a string of the form 'YEAR.MONTH.DATE.HOURS.MINUTES.SECONDS'.
 */
function dateTimeToString() {
    let date = new Date();
    return `${date.getFullYear()}.${zeroPad(date.getMonth(), 2)}.${zeroPad(date.getDate(), 2)}.${zeroPad(date.getHours(), 2)}.${zeroPad(date.getMinutes(), 2)}.${zeroPad(date.getSeconds(), 2)}`;
}

/**
 * Create a string of the form 'HOURS.MINUTES.SECONDS.MILLISECONDS'.
 */
function timeToString() {
    let date = new Date();
    return `${zeroPad(date.getHours(), 2)}:${zeroPad(date.getMinutes(), 2)}:${zeroPad(date.getSeconds(), 2)}.${zeroPad(date.getMilliseconds(), 3)}`;
}

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
	const logData = {
		type: 'incoming',
		receiver: recvr.getIdentifier(),
		message: message
	};
	Logger.info(logData);
}

/**
 * Call to log messages created here at the server and being sent to the connection.
 * Do not call this for messages being forwarded to this connection.
 * @param sender IMessageLogger The connection the message is being sent to.
 */
export function logOutgoing(sender: IMessageLogger, message: BaseMessage): void {
	const logData = {
		type: 'outgoing',
		sender: sender.getIdentifier(),
		message: message
	};
	Logger.info(logData);
}

/**
 * Call this for messages being forwarded to this connection. That is messages received on
 * one connection and being sent to another with only minor changes being made.
 * @param recvr: IMessageLogger The connection the message was received on.
 * @param sender IMessageLogger The connection the message is being sent to.
 */
export function logForward(recvr: IMessageLogger, target: IMessageLogger, message: BaseMessage): void {
	const logData = {
		type: 'forward',
		receiver: recvr.getIdentifier(),
		target: target.getIdentifier(),
		message: message
	};
	Logger.info(logData);
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

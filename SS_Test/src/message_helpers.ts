import { MessageType, messageTypeRegistry } from './typeRegistry'
import * as Messages from './messages';

// this forces the evaluation of the messages file which fills the type registry
// its gross but i dont see a better way.
Messages;

export interface BaseMessage extends MessageType {
    type: string;
}

export function getProtoMessageFromString<T extends BaseMessage>(jsonString: string): T | null {
	let parsed = JSON.parse(jsonString);
	if (!parsed.type) {
		return null;
	}
	return getProtoMessage(parsed);
}

export function getProtoMessage<T extends BaseMessage>(msg: any): T | null {
	let messageType = messageTypeRegistry.get(msg.type);
	if (!messageType) {
		return null;
	}
	return messageType.fromJSON(msg) as T;
}

export function protoToJSON(msg: any): unknown {
	let messageType = messageTypeRegistry.get(msg.type);
	if (!messageType) {
		return null;
	}
	return messageType.toJSON(msg);
}

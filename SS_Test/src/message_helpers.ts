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

function haveSameFields(obj1: any, obj2: any): boolean {
  const keys1 = Object.keys(obj1).filter(key => key !== "$type").sort();
  const keys2 = Object.keys(obj2).filter(key => key !== "$type").sort();
  return keys1.length === keys2.length && keys1.every((key, index) => key === keys2[index]);
}

export function getProtoMessage<T extends BaseMessage>(msg: any): T | null {
	let messageType = messageTypeRegistry.get(msg.type);
	if (!messageType) {
		return null;
	}
	let parsed = messageType.fromJSON(msg) as T;
	let empty = messageType.fromPartial({});
	if (!haveSameFields(empty, msg)) {
		console.log(`bad incoming message?`);
		console.log(`${JSON.stringify(msg)}`);
	}
	return parsed;
}

export function protoToJSON(msg: any): unknown {
	let messageType = messageTypeRegistry.get(msg.type);
	if (!messageType) {
		return null;
	}
	return messageType.toJSON(msg);
}

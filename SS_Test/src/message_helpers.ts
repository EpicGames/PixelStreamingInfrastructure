import { MessageType, messageTypeRegistry } from './typeRegistry'
import * as Messages from './messages';

// this forces the evaluation of the messages file which fills the type registry
// its gross but i dont see a better way.
Messages;

export interface BaseMessage extends MessageType {
    type: string;
}

export function getProtoMessage<T extends BaseMessage>(jsonString: string): T | null {
	let parsed = JSON.parse(jsonString);
	if (!parsed.type) {
		return null;
	}

	let messageType = messageTypeRegistry.get(parsed.type);
	if (!messageType) {
		return null;
	}

	return messageType.fromJSON(parsed) as T;
}

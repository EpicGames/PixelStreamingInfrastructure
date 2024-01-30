import { IMessageType } from "@protobuf-ts/runtime";
import { BaseMessage } from './base_message';

export function createMessage(messageType: IMessageType<BaseMessage>, params?: any) {
    const message = messageType.create();
    message.type = messageType.typeName;
    if (params) {
        messageType.mergePartial(message, params);
    }
    return message;
}

import { IMessageType } from "@protobuf-ts/runtime";
import { BaseMessage } from './base_message';
import { Logger } from '../Logger/Logger';
import { MessageRegistry } from './message_registry';

/**
 * A helper for creating signalling messages. Takes in optional given parameters and
 * includes them in a message object with the 'type' field set properly for the message
 * type supplied.
 * @param messageType - A message type from MessageRegistry that indicates the type of message to create.
 * @param params - An optional object whose fields are added to the newly created message.
 * @returns The resulting message object.
 */
export function createMessage(messageType: IMessageType<BaseMessage>, params?: object) {
    const message = messageType.create();
    message.type = messageType.typeName;
    if (params) {
        messageType.mergePartial(message, params);
    }
    return message;
}

/**
 * Tests that the supplied message is valid. That is contains all expected fields and
 * doesn't contain any unknown fields.
 * @param msg - The message object to test.
 * @returns The message type from MessageRegistry of the supplied message object if it's valid, or null if invalid.
 */
export function validateMessage(msg: BaseMessage): IMessageType<BaseMessage> | null {
    let valid = true;

    if (!msg.type) {
        Logger.Error(Logger.GetStackTrace(), `Parsed message has no type. Rejected. ${JSON.stringify(msg)}`);
        return null;
    }

    const messageType = MessageRegistry[msg.type];
    if (!messageType) {
        Logger.Error(Logger.GetStackTrace(), `Message is of an unknown type: "${messageType}". Rejected.`);
        return null;
    }

    if (messageType.fields) {
        for (const field of messageType.fields) {
            if (!field.opt) {
                if (!Object.prototype.hasOwnProperty.call(msg, field.name)) {
                    Logger.Error(Logger.GetStackTrace(), `Message "${msg.type}"" is missing required field "${field.name}". Rejected.`);
                    valid = false;
                }
            }
        }
    }

    for (const fieldName in msg) {
        const found = messageType.fields.find(field => field.name === fieldName);
        if (!found) {
            Logger.Error(Logger.GetStackTrace(), `Message "${msg.type}" contains unknown field "${fieldName}". Rejected.`);
            valid = false;
        }
    }

    return valid ? messageType : null;
}
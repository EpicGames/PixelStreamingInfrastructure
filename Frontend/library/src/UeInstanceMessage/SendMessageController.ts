// Copyright Epic Games, Inc. All Rights Reserved.

import { DataChannelSender } from '../DataChannel/DataChannelSender';
import { Logger } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.7';
import { StreamMessageController } from './StreamMessageController';

export class SendMessageController {
    toStreamerMessagesMapProvider: StreamMessageController;
    dataChannelSender: DataChannelSender;

    /**
     * @param dataChannelSender - Data channel instance
     * @param toStreamerMessagesMapProvider - Stream Messages instance
     */
    constructor(
        dataChannelSender: DataChannelSender,
        toStreamerMessagesMapProvider: StreamMessageController
    ) {
        this.dataChannelSender = dataChannelSender;
        this.toStreamerMessagesMapProvider = toStreamerMessagesMapProvider;
    }

    /**
     * Send a message to the streamer through the data channel
     * @param messageType - the type of message we are sending
     * @param messageData - the message data we are sending over the data channel
     * @returns - nil
     */
    sendMessageToStreamer(messageType: string, messageData?: Array<number | string>) {
        if (messageData === undefined) {
            messageData = [];
        }

        const toStreamerMessages = this.toStreamerMessagesMapProvider.toStreamerMessages;
        const messageFormat = toStreamerMessages.get(messageType);
        if (messageFormat === undefined) {
            Logger.Error(
                `Attempted to send a message to the streamer with message type: ${messageType}, but the frontend hasn't been configured to send such a message. Check you've added the message type in your cpp`
            );
            return;
        }

        if (messageFormat.structure && messageData && messageFormat.structure.length !== messageData.length) {
            Logger.Error(
                `Provided message data doesn't match expected layout. Expected [ ${messageFormat.structure
                    .map((element: string) => {
                        switch (element) {
                            case 'uint8':
                            case 'uint16':
                            case 'int16':
                            case 'float':
                            case 'double':
                            default:
                                return 'number';
                            case 'string':
                                return 'string';
                        }
                    })
                    .toString()} ] but received [ ${messageData.map((element: number | string) => typeof element).toString()} ]`
            );
            return;
        }

        let byteLength = 0;
        // One loop to calculate the length in bytes of all of the provided data
        messageData.forEach((element: number | string, idx: number) => {
            const type = messageFormat.structure[idx];
            switch (type) {
                case 'uint8':
                    byteLength += 1;
                    break;

                case 'uint16':
                    byteLength += 2;
                    break;

                case 'int16':
                    byteLength += 2;
                    break;

                case 'float':
                    byteLength += 4;
                    break;

                case 'double':
                    byteLength += 8;
                    break;

                case 'string':
                    // 2 bytes for string length
                    byteLength += 2;
                    // 2 bytes per character
                    byteLength += 2 * (element as string).length;
                    break;
            }
        });

        const data = new DataView(new ArrayBuffer(byteLength + 1));
        data.setUint8(0, messageFormat.id);
        let byteOffset = 1;

        messageData.forEach((element: number | string, idx: number) => {
            const type = messageFormat.structure[idx];
            switch (type) {
                case 'uint8':
                    data.setUint8(byteOffset, element as number);
                    byteOffset += 1;
                    break;

                case 'uint16':
                    data.setUint16(byteOffset, element as number, true);
                    byteOffset += 2;
                    break;

                case 'int16':
                    data.setInt16(byteOffset, element as number, true);
                    byteOffset += 2;
                    break;

                case 'float':
                    data.setFloat32(byteOffset, element as number, true);
                    byteOffset += 4;
                    break;

                case 'double':
                    data.setFloat64(byteOffset, element as number, true);
                    byteOffset += 8;
                    break;

                case 'string':
                    data.setUint16(byteOffset, (element as string).length, true);
                    byteOffset += 2;
                    for (let i = 0; i < (element as string).length; i++) {
                        data.setUint16(byteOffset, (element as string).charCodeAt(i), true);
                        byteOffset += 2;
                    }
                    break;
            }
        });

        if (!this.dataChannelSender.canSend()) {
            Logger.Info(
                `Data channel cannot send yet, skipping sending message: ${messageType} - ${new Uint8Array(
                    data.buffer
                )}`
            );
            return;
        }

        this.dataChannelSender.sendData(data.buffer);
    }

    /**
     * Send a raw byte payload for a registered to-streamer message type. The
     * registered message id is prepended as a single byte, then the bytes
     * are sent through the data channel as-is — no JSON encoding, no
     * per-field structure validation.
     *
     * Useful for custom protocols where the application owns the binary
     * payload format on both ends. The application must have called
     * `streamMessageController.toStreamerMessages.set(...)` (or relied on
     * a default-registered type such as `UIInteraction`) so the message id
     * is known.
     *
     * @param messageType - Name of a registered to-streamer message type.
     * @param bytes - Payload to send, not including the message id byte.
     * @returns true if the bytes were submitted to the data channel; false
     *   if the message type isn't registered or the channel can't send.
     */
    sendBytesToStreamer(messageType: string, bytes: Uint8Array | ArrayBuffer): boolean {
        const messageFormat = this.toStreamerMessagesMapProvider.toStreamerMessages.get(messageType);
        if (messageFormat === undefined) {
            Logger.Error(
                `Attempted to send raw bytes for message type "${messageType}" but no such type is registered. Register it via streamMessageController.toStreamerMessages.set(...)`
            );
            return false;
        }

        if (!this.dataChannelSender.canSend()) {
            Logger.Info(`Data channel cannot send yet, skipping raw bytes for: ${messageType}`);
            return false;
        }

        const payload = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
        const buffer = new ArrayBuffer(1 + payload.byteLength);
        const view = new Uint8Array(buffer);
        view[0] = messageFormat.id;
        view.set(payload, 1);
        this.dataChannelSender.sendData(buffer);
        return true;
    }
}

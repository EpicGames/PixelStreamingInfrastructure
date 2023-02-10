// Copyright Epic Games, Inc. All Rights Reserved.

import { DataChannelSender } from '../DataChannel/DataChannelSender';
import { Logger } from '../Logger/Logger';
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
    sendMessageToStreamer(messageType: string, messageData?: Array<number>) {
        if (messageData === undefined) {
            messageData = [];
        }

        const toStreamerMessages =
            this.toStreamerMessagesMapProvider.toStreamerMessages;
        const messageFormat = toStreamerMessages.getFromKey(messageType);
        if (messageFormat === undefined) {
            Logger.Error(
                Logger.GetStackTrace(),
                `Attempted to send a message to the streamer with message type: ${messageType}, but the frontend hasn't been configured to send such a message. Check you've added the message type in your cpp`
            );
            return;
        }

        const data = new DataView(
            new ArrayBuffer(messageFormat.byteLength + 1)
        );
        data.setUint8(0, messageFormat.id);
        let byteOffset = 1;

        messageData.forEach((element: number, idx: number) => {
            const type = messageFormat.structure[idx];
            switch (type) {
                case 'uint8':
                    data.setUint8(byteOffset, element);
                    byteOffset += 1;
                    break;

                case 'uint16':
                    data.setUint16(byteOffset, element, true);
                    byteOffset += 2;
                    break;

                case 'int16':
                    data.setInt16(byteOffset, element, true);
                    byteOffset += 2;
                    break;

                case 'float':
                    data.setFloat32(byteOffset, element, true);
                    byteOffset += 4;
                    break;

                case 'double':
                    data.setFloat64(byteOffset, element, true);
                    byteOffset += 8;
                    break;
            }
        });

        if (!this.dataChannelSender.canSend()) {
            Logger.Info(
                Logger.GetStackTrace(),
                `Data channel cannot send yet, skipping sending message: ${messageType} - ${new Uint8Array(
                    data.buffer
                )}`
            );
            return;
        } else {
            this.dataChannelSender.sendData(data.buffer);
        }
    }
}

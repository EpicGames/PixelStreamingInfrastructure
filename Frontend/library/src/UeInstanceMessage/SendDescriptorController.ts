// Copyright Epic Games, Inc. All Rights Reserved.

import { DataChannelSender } from '../DataChannel/DataChannelSender';
import { Logger } from '../Logger/Logger';
import { StreamMessageController } from './StreamMessageController';

export class SendDescriptorController {
    toStreamerMessagesMapProvider: StreamMessageController;
    dataChannelSender: DataChannelSender;

    constructor(
        dataChannelSender: DataChannelSender,
        toStreamerMessagesMapProvider: StreamMessageController
    ) {
        this.dataChannelSender = dataChannelSender;
        this.toStreamerMessagesMapProvider = toStreamerMessagesMapProvider;
    }

    /**
     * Send a Latency Test to the UE Instance
     * @param descriptor - the descriptor for a latency test
     */
    sendLatencyTest(descriptor: object) {
        this.sendDescriptor('LatencyTest', descriptor);
    }

    /**
     * Send a Latency Test to the UE Instance
     * @param descriptor - the descriptor for a command
     */
    emitCommand(descriptor: object) {
        this.sendDescriptor('Command', descriptor);
    }

    /**
     * Send a Latency Test to the UE Instance
     * @param descriptor - the descriptor for a UI Interaction
     */
    emitUIInteraction(descriptor: object | string) {
        this.sendDescriptor('UIInteraction', descriptor);
    }

    /**
     * Send a Descriptor to the UE Instances
     * @param messageType - UE Message Type
     * @param descriptor - Descriptor Message as JSON
     */
    sendDescriptor(messageType: string, descriptor: object | string) {
        // Convert the descriptor object into a JSON string.
        const descriptorAsString = JSON.stringify(descriptor);
        const toStreamerMessages =
            this.toStreamerMessagesMapProvider.toStreamerMessages;
        const messageFormat = toStreamerMessages.getFromKey(messageType);
        if (messageFormat === undefined) {
            Logger.Error(
                Logger.GetStackTrace(),
                `Attempted to emit descriptor with message type: ${messageType}, but the frontend hasn't been configured to send such a message. Check you've added the message type in your cpp`
            );
        }

        Logger.Log(Logger.GetStackTrace(), 'Sending: ' + descriptor, 6);
        // Add the UTF-16 JSON string to the array byte buffer, going two bytes at
        // a time.
        const data = new DataView(
            new ArrayBuffer(1 + 2 + 2 * descriptorAsString.length)
        );
        let byteIdx = 0;
        data.setUint8(byteIdx, messageFormat.id);
        byteIdx++;
        data.setUint16(byteIdx, descriptorAsString.length, true);
        byteIdx += 2;
        for (let i = 0; i < descriptorAsString.length; i++) {
            data.setUint16(byteIdx, descriptorAsString.charCodeAt(i), true);
            byteIdx += 2;
        }

        if (!this.dataChannelSender.canSend()) {
            Logger.Info(
                Logger.GetStackTrace(),
                `Data channel cannot send yet, skipping sending descriptor message: ${messageType} - ${descriptorAsString}`
            );
            return;
        }

        this.dataChannelSender.sendData(data.buffer);
    }
}

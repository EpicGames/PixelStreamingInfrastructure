import { DataChannelController } from "../DataChannel/DataChannelController";
import { IStreamMessageController } from "./IStreamMessageController";
import { Logger } from "../Logger/Logger";
import { UeDataMessage } from "./UeDataMessage";

export class SendDescriptorController extends UeDataMessage {

    toStreamerMessagesMapProvider: IStreamMessageController;

    constructor(datachannelController: DataChannelController, toStreamerMessagesMapProvider: IStreamMessageController) {
        super(datachannelController);
        this.toStreamerMessagesMapProvider = toStreamerMessagesMapProvider;
    }
    
    /**
     * Send a Latency Test to the UE Instance
     * @param StartTimeMs - Start Time of the Latency test
     */
    sendLatencyTest(StartTimeMs: number) {
        let payload = {
            StartTime: StartTimeMs,
        };

        this.sendDescriptor("LatencyTest", JSON.stringify(payload));
    }

    emitCommand(descriptor: string) {
        let payload = {
            Console: descriptor
        }
        this.sendDescriptor("Command", JSON.stringify(payload));
    }

    emitUIInteraction(descriptor: string) {
        let payload = {
            Console: descriptor
        }
        this.sendDescriptor("UIInteraction", JSON.stringify(payload));
    }

    /**
     * Send a Descriptor to the UE Instances
     * @param messageType - UE Message Type
     * @param descriptor - Descriptor Message as JSON
     */
    sendDescriptor(messageType: string, descriptor: string) {
        // Convert the descriptor object into a JSON string.
        let descriptorAsString = JSON.stringify(descriptor);
        let toStreamerMessages = this.toStreamerMessagesMapProvider.getToStreamerMessageMap();
        let messageFormat = toStreamerMessages.getFromKey(messageType);
        if (messageFormat === undefined) {
            Logger.Error(Logger.GetStackTrace(), `Attempted to emit descriptor with message type: ${messageType}, but the frontend hasn't been configured to send such a message. Check you've added the message type in your cpp`);
        }

        Logger.Log(Logger.GetStackTrace(), "Sending: " + descriptor, 6);
        // Add the UTF-16 JSON string to the array byte buffer, going two bytes at
        // a time.
        let data = new DataView(new ArrayBuffer(1 + 2 + 2 * descriptorAsString.length));
        let byteIdx = 0;
        data.setUint8(byteIdx, messageFormat.id);
        byteIdx++;
        data.setUint16(byteIdx, descriptorAsString.length, true);
        byteIdx += 2;
        for (let i = 0; i < descriptorAsString.length; i++) {
            data.setUint16(byteIdx, descriptorAsString.charCodeAt(i), true);
            byteIdx += 2;
        }

        this.sendData(data.buffer);
    }

}
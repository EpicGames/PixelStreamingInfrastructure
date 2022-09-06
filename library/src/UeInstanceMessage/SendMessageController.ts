import { DataChannelSender } from "../DataChannel/DataChannelSender";
import { IStreamMessageController } from "./IStreamMessageController";
import { Logger } from "../Logger/Logger";

export class SendMessageController {

    toStreamerMessagesMapProvider: IStreamMessageController;
    dataChannelSender: DataChannelSender;

    constructor(dataChannelSender: DataChannelSender, toStreamerMessagesMapProvider: IStreamMessageController) {
        this.dataChannelSender = dataChannelSender;
        this.toStreamerMessagesMapProvider = toStreamerMessagesMapProvider;
    }

    sendMessageToStreamer(messageType: string, messageData?: Array<any>) {
        if (messageData === undefined) {
            messageData = [];
        }

        console.log(messageData);

        let toStreamerMessages = this.toStreamerMessagesMapProvider.getToStreamerMessageMap();
        let messageFormat = toStreamerMessages.getFromKey(messageType);
        if (messageFormat === undefined) {
            Logger.Error(Logger.GetStackTrace(), `Attempted to send a message to the streamer with message type: ${messageType}, but the frontend hasn't been configured to send such a message. Check you've added the message type in your cpp`);
            return;
        }

        let data = new DataView(new ArrayBuffer(messageFormat.byteLength + 1));
        data.setUint8(0, messageFormat.id);
        let byteOffset = 1;

        messageData.forEach((element: any, idx: any) => {
            let type = messageFormat.structure[idx];
            switch (type) {
                case "uint8":
                    data.setUint8(byteOffset, element);
                    byteOffset += 1;
                    break;

                case "uint16":
                    data.setUint16(byteOffset, element, true);
                    byteOffset += 2;
                    break;

                case "int16":
                    data.setInt16(byteOffset, element, true);
                    byteOffset += 2;
                    break;

                case "double":
                    data.setFloat64(byteOffset, element, true);
                    byteOffset += 8;
                    break;
            }
        });
        this.dataChannelSender.sendData(data.buffer);
    }
}
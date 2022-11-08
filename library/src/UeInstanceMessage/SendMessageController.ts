import { DataChannelSender } from "../DataChannel/DataChannelSender";
import { IStreamMessageController } from "./IStreamMessageController";
import { Logger } from "../Logger/Logger";

export class SendMessageController {

    toStreamerMessagesMapProvider: IStreamMessageController;
    dataChannelSender: DataChannelSender;

    /**
     * @param dataChannelSender - Data channel instance  
     * @param toStreamerMessagesMapProvider - Stream Messages instance 
     */
    constructor(dataChannelSender: DataChannelSender, toStreamerMessagesMapProvider: IStreamMessageController) {
        this.dataChannelSender = dataChannelSender;
        this.toStreamerMessagesMapProvider = toStreamerMessagesMapProvider;
    }

    /**
     * Send a message to the streamer through the data channel
     * @param messageType - the type of message we are sending  
     * @param messageData - the message data we are sending over the data channel 
     * @returns - nil
     */
    sendMessageToStreamer(messageType: string, messageData?: Array<any>) {
        if (messageData === undefined) {
            messageData = [];
        }

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

        if(!this.dataChannelSender.canSend()){
            console.log(`Data channel cannot send yet, skipping sending message: ${messageType} - ${new Uint8Array(data.buffer)}`);
            return;
        }
        else{
            this.dataChannelSender.sendData(data.buffer);
        }

    }
}
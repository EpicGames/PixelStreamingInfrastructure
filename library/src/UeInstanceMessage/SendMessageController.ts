import { DataChannelController } from "../DataChannel/DataChannelController";
import { IStreamMessageController } from "./IStreamMessageController";
import { Logger } from "../Logger/Logger";
import { UeDataMessage } from "./UeDataMessage";

export class SendMessageController extends UeDataMessage {

    toStreamerMessagesMapProvider: IStreamMessageController;

    constructor(datachannelController: DataChannelController, toStreamerMessagesMapProvider: IStreamMessageController) {
        super(datachannelController);
        this.toStreamerMessagesMapProvider = toStreamerMessagesMapProvider;
    }

    /**
     * Send IFrame Request to the UE Instance
     */
    SendIFrameRequest() {
        this.sendMessageToStreamer("IFrameRequest");
    }

    /**
     * Send Request to Take Quality Control to the UE Instance
     */
    SendRequestQualityControl() {
        this.sendMessageToStreamer("RequestQualityControl");
    }

    /**
     * Send Max FPS Request to the UE Instance
     */
    SendMaxFpsRequest() {
        this.sendMessageToStreamer("FpsRequest");
    }

    /**
     * Send Average Bitrate Request to the UE Instance
     */
    SendAverageBitrateRequest() {
        this.sendMessageToStreamer("AverageBitrateRequest");
    }

    /**
     * Send a Start Streaming Message to the UE Instance
     */
    SendStartStreaming() {
        this.sendMessageToStreamer("StartStreaming");
    }

    /**
     * Send a Stop Streaming Message to the UE Instance
     */
    SendStopStreaming() {
        this.sendMessageToStreamer("StopStreaming");
    }

    /**
     * Send a Request Initial Settings to the UE Instance
     */
    SendRequestInitialSettings() {
        this.sendMessageToStreamer("RequestInitialSettings");
    }

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
        this.sendData(data.buffer);
    }
}
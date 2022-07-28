import { DataChannelController } from "../DataChannel/DataChannelController";
import { Logger } from "../Logger/Logger";
import { UeDataMessage } from "./UeDataMessage";

/**
 * Handles sending a Descriptor to the UE Instance 
 */
export class UeDescriptor extends UeDataMessage {

    /**
    * @param datachannelController - Data Channel Controller
    */
    constructor(datachannelController: DataChannelController) {
        super(datachannelController);
    }

    /**
     * Send a Descriptor to the UE Instances
     * @param messageType - UE Message Type
     * @param JSODescriptor - Descriptor Message as JSON
     */
    sendDescriptor(messageType: number, JSODescriptor: string) {
        Logger.Log(Logger.GetStackTrace(), "Sending: " + JSODescriptor, 6);
        // Add the UTF-16 JSON string to the array byte buffer, going two bytes at
        // a time.
        let data = new DataView(new ArrayBuffer(1 + 2 + 2 * JSODescriptor.length));
        let byteIdx = 0;
        data.setUint8(byteIdx, messageType);
        byteIdx++;
        data.setUint16(byteIdx, JSODescriptor.length, true);
        byteIdx += 2;

        for (let i = 0; i < JSODescriptor.length; i++) {
            data.setUint16(byteIdx, JSODescriptor.charCodeAt(i), true);
            byteIdx += 2;
        }

        this.sendData(data.buffer);
    }
}
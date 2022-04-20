import { DataChannelController } from "../DataChannel/DataChannelController";

/**
 * Handles sending a message to the UE Instance
 */
export class UeDataMessage {

    dataChannelController: DataChannelController;

    /**
     * 
     * @param dataChannelController - Data Channel Controller
     */
    constructor(dataChannelController: DataChannelController){
        this.dataChannelController = dataChannelController;
    }

    /**
     * Send an Array Buffer to the UE Instance
     * @param buffer - Message Buffer Array
     */
    sendData(buffer: ArrayBuffer) {
        this.dataChannelController.sendData(buffer);
    }
}
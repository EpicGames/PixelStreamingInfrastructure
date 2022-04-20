import { DataChannelController } from "../DataChannel/DataChannelController";
import { UeDescriptor } from "./UeDescriptor";
import { UeMessageType } from "./UeMessageTypes";

/**
 * Handles the Sending of a Command Descriptor to the UE Instance
 */
export class UeDescriptorCommand extends UeDescriptor {
    
    /**
     * @param dataChannelController - Data Channel Controller
     */
    constructor(dataChannelController: DataChannelController) {
        super(dataChannelController);
    }

    /**
     * Sends the Descriptor Object to the UE Instance
     * @param descriptor - Descriptor String
     */
    sendCommand(descriptor: string) {
        let payload = JSON.stringify({
            Console: descriptor
        })
        this.sendDescriptor(UeMessageType.command, payload);

    }
}
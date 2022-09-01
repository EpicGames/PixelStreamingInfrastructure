import { Logger } from "../Logger/Logger";
import { IDataChannelController } from "./IDataChannelController";

/**
 * Handles the Sending and Receiving of messages to the UE Instance via the Data Channel
 */
export class DataChannelController implements IDataChannelController {
    dataChannel: RTCDataChannel;
    peerConnection: RTCPeerConnection;
    datachannelOptions: RTCDataChannelInit;
    label: string;
    isReceivingFreezeFrame = false;

    getDataChannelInstance(): DataChannelController {
        return this;
    }

    /**
     * To Create and Set up a Data Channel
     * @param peerConnection - The RTC Peer Connection
     * @param label - Label of the Data Channel
     * @param datachannelOptions - Optional RTC DataChannel options
     */
    createDataChannel(peerConnection: RTCPeerConnection, label: string, datachannelOptions?: RTCDataChannelInit) {
        this.peerConnection = peerConnection;
        this.label = label;
        this.datachannelOptions = datachannelOptions;
        if (datachannelOptions == null) {
            this.datachannelOptions = {} as RTCDataChannelInit
            this.datachannelOptions.ordered = true;
        }

        this.dataChannel = this.peerConnection.createDataChannel(this.label, this.datachannelOptions);
        //We Want an Array Buffer not a blob
        this.dataChannel.binaryType = "arraybuffer";
        this.dataChannel.onclose = () => this.handleOnClose();
    }

    /**
     * Handles when the Data Channel is closed
     */
    handleOnClose() {
        Logger.Log(Logger.GetStackTrace(), "Data Channel: " + this.label + " is closed.", 7);
    }
}
import { Logger } from "../Logger/Logger";
import { IDataChannelController } from "./IDataChannelController";

export class DataChannelSender {

    dataChannelProvider: IDataChannelController;

    constructor(dataChannelProvider: IDataChannelController) {
        this.dataChannelProvider = dataChannelProvider;
    }

    /**
     * Send Data over the Data channel to the UE Instance
     * @param data - Message Data Array Buffer
     */
    sendData(data: ArrayBuffer) {
        // reset the afk inactivity
        let dataChannelInstance = this.dataChannelProvider.getDataChannelInstance();

        if (dataChannelInstance.dataChannel.readyState == "open") {
            dataChannelInstance.dataChannel.send(data);
            this.resetAfkWarningTimerOnDataSend();
        } else {
            Logger.Error(Logger.GetStackTrace(), "Message Failed: " + new Uint8Array(data));
        }
    }

    /**
     * An override method for resetting the Afk warning timer when data is sent over the data channel 
     */
    resetAfkWarningTimerOnDataSend() { }
}
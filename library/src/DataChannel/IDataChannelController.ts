import { DataChannelController } from "../DataChannel/DataChannelController";

/**
 * An interface for the data channel controller 
 */
export interface IDataChannelController {

    /**
     * Returns an instance of this data chanel controller object
     */
    getDataChannelInstance(): DataChannelController;
}
import { DataChannelController } from "../DataChannel/DataChannelController"

/**
 * The Class that handles gyro input 
 */
export class GyroController {
 
    dataChannelController: DataChannelController;
 
    constructor(dataChannelController: DataChannelController) {
        this.dataChannelController = dataChannelController;
    }

    

}

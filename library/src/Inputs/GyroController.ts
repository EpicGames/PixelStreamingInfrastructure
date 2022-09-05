import { IStreamMessageController } from "../UeInstanceMessage/IStreamMessageController";

/**
 * The Class that handles gyro input 
 */
export class GyroController {

    toStreamerMessagesProvider: IStreamMessageController;

    constructor(toStreamerMessagesProvider: IStreamMessageController) {
        this.toStreamerMessagesProvider = toStreamerMessagesProvider;
    }
}

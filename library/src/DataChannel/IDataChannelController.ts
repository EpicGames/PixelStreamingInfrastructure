import { DataChannelController } from "../DataChannel/DataChannelController";

export interface IDataChannelController {
    getDataChannelInstance(): DataChannelController;
}
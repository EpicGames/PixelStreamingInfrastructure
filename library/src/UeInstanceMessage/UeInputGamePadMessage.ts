import { DataChannelController } from "../DataChannel/DataChannelController";
import { UeDataMessage } from "./UeDataMessage";
import { UeMessageType } from "./UeMessageTypes";

/**
 * The class for handling UE Input GamePad Messages. It implements the UeDataMessage class
 */
export class UeInputGamePadMessage extends UeDataMessage {

    /**
     * 
     * @param datachannelController - Data Channel Controller
     */
    constructor(datachannelController: DataChannelController) {
        super(datachannelController);
    }

    /**
     * Send the controller button press data through the data channel 
     * @param controllerIndex - the controller index number 
     * @param buttonIndex - the button index number
     * @param isRepeat - is this a repeat press 
     */
    sendControllerButtonPressed(controllerIndex: number, buttonIndex: number, isRepeat: boolean) {
        let Data = new DataView(new ArrayBuffer(4));
        Data.setUint8(0, UeMessageType.gamepadButtonPressed);
        Data.setUint8(1, controllerIndex);
        Data.setUint8(2, buttonIndex);
        Data.setUint8(3, Number(isRepeat).valueOf());
        this.sendData(Data.buffer);
    }

    /**
     * Send the controller button release data through the data channel 
     * @param controllerIndex - the controller index number 
     * @param buttonIndex  - the button index number
     */
    sendControllerButtonReleased(controllerIndex: number, buttonIndex: number) {
        let Data = new DataView(new ArrayBuffer(3));
        Data.setUint8(0, UeMessageType.gamepadButtonReleased);
        Data.setUint8(1, controllerIndex);
        Data.setUint8(2, buttonIndex);
        this.sendData(Data.buffer);
    }

    /**
     * Send controller axis data through the data channel 
     * @param controllerIndex - the controller index number 
     * @param axisIndex - the axis index number 
     * @param analogValue - the analogue value number 
     */
    sendControllerAxisMove(controllerIndex: number, axisIndex: number, analogValue: number) {
        let Data = new DataView(new ArrayBuffer(11));
        Data.setUint8(0, UeMessageType.gamepadAnalog);
        Data.setUint8(1, controllerIndex);
        Data.setUint8(2, axisIndex);
        Data.setFloat64(3, analogValue, true);

        this.sendData(Data.buffer);
    }



}

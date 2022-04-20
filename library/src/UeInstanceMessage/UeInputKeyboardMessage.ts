import { DataChannelController } from "../DataChannel/DataChannelController";
import { UeDataMessage } from "./UeDataMessage";
import { UeMessageType } from "./UeMessageTypes"

/**
 * Handles sending Keyboard Messages to the UE Instance
 */
export class UeInputKeyboardMessage extends UeDataMessage{

    /**
     * 
     * @param datachannelController - Data Channel Controller
     */
    constructor(datachannelController: DataChannelController){
        super(datachannelController);
    }

    /**
     * Sends the key down to the UE Instance
     * @param keyCode - Key code
     * @param isRepeat - Is the key repeating
     */
    sendKeyDown(keyCode:number, isRepeat:Boolean){
        let Payload = new Uint8Array([UeMessageType.keyDown, keyCode, Number(isRepeat).valueOf()]);
        this.sendData(Payload.buffer);
    }

    /**
     * Sends the Key Up to the UE Instance
     * @param keyCode - Key code
     */
    sendKeyUp(keyCode: number){
        let payload = new Uint8Array([UeMessageType.keyUp, keyCode]);
        this.sendData(payload.buffer);
    }

    /**
     * Sends the key press to the UE Instance
     * @param CharCode - character code of a key pressed
     */
    sendKeyPress(CharCode:number){
        let data = new DataView(new ArrayBuffer(3));
        data.setUint8(0, UeMessageType.keyPress);
        data.setUint16(1, CharCode, true);
        this.sendData(data.buffer);
    }
}
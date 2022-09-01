import { DataChannelSender } from "../DataChannel/DataChannelSender";
import { UeMessageType } from "./UeMessageTypes"

/**
 * Handles sending Keyboard Messages to the UE Instance
 */
export class UeInputKeyboardMessage {

    dataChannelSender: DataChannelSender;

    /**
     * @param dataChannelSender - Data Channel Controller
     */
    constructor(dataChannelSender: DataChannelSender) {
        this.dataChannelSender = dataChannelSender;
    }

    /**
     * Sends the key down to the UE Instance
     * @param keyCode - Key code
     * @param isRepeat - Is the key repeating
     */
    sendKeyDown(keyCode: number, isRepeat: boolean) {
        let Payload = new Uint8Array([UeMessageType.keyDown, keyCode, Number(isRepeat).valueOf()]);
        this.dataChannelSender.sendData(Payload.buffer);
    }

    /**
     * Sends the Key Up to the UE Instance
     * @param keyCode - Key code
     */
    sendKeyUp(keyCode: number) {
        let payload = new Uint8Array([UeMessageType.keyUp, keyCode]);
        this.dataChannelSender.sendData(payload.buffer);
    }

    /**
     * Sends the key press to the UE Instance
     * @param CharCode - character code of a key pressed
     */
    sendKeyPress(CharCode: number) {
        let data = new DataView(new ArrayBuffer(3));
        data.setUint8(0, UeMessageType.keyPress);
        data.setUint16(1, CharCode, true);
        this.dataChannelSender.sendData(data.buffer);
    }
}
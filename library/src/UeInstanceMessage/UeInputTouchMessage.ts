import { DataChannelSender } from "../DataChannel/DataChannelSender";
import { IVideoPlayer } from "../VideoPlayer/IVideoPlayer";
import { UeMessageType } from "./UeMessageTypes"

/**
 * Handles Sending Touch messages to the UE Instance
 */
export class UeInputTouchMessage {

    fingers: number[];
    fingersIds: { [key: number]: number };

    videoElementProvider: IVideoPlayer;
    dataChannelSender: DataChannelSender;


    /**
     * @param dataChannelSender - Data channel sender
     */
    constructor(dataChannelSender: DataChannelSender, videoElementProvider: IVideoPlayer) {
        this.dataChannelSender = dataChannelSender;
        this.videoElementProvider = videoElementProvider;
        this.fingersIds = {}
        this.fingers = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    }

    /**
     * Handles Touch event Start
     * @param touches - Touch List
     */
    sendTouchStart(touches: TouchList) {
        this.sendTouch(UeMessageType.touchStart, touches);
    }

    /**
     * Handles Touch event End
     * @param touches - Touch List
     */
    sendTouchEnd(touches: TouchList) {
        this.sendTouch(UeMessageType.touchEnd, touches);
    }

    /**
     * Handles Touch event Move
     * @param touches - Touch List
     */
    sendTouchMove(touches: TouchList) {
        this.sendTouch(UeMessageType.touchMove, touches);
    }

    /**
     * Handles Sending the Touch Event to the UE Instance via the Data channel
     * @param touches - Touch List
     */
    sendTouch(touchType: number, touches: TouchList) {
        let data = new DataView(new ArrayBuffer(2 + 7 * touches.length));
        data.setUint8(0, touchType);
        data.setUint8(1, touches.length);
        let byte = 2;
        for (let t = 0; t < touches.length; t++) {
            let touch = touches[t];
            let x = touch.clientX;//- offsetLeft;
            let y = touch.clientY;//- offsetTop;

            let coord = this.normaliseAndQuantiseUnsigned(x, y);
            //      byte =  2
            data.setUint16(byte, coord.x, true);
            byte += 2;
            //      byte =  4
            data.setUint16(byte, coord.y, true);
            byte += 2;
            //      byte =  6
            data.setUint8(byte, this.fingersIds[touch.identifier]);
            byte += 1;
            //      byte =  7
            data.setUint8(byte, 255 * touch.force);   // force is between 0.0 and 1.0 so quantize into byte.
            byte += 1;
            //      byte =  8
            data.setUint8(byte, coord.inRange ? 1 : 0); // mark the touch as in the player or not
            byte += 1;
        }
        this.dataChannelSender.sendData(data.buffer);
    }
}
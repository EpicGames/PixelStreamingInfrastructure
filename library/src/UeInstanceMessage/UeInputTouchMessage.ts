import { DataChannelController } from "../DataChannel/DataChannelController";
import { NormaliseAndQuantiseUnsigned } from "../Inputs/CoordinateData";
import { Logger } from "../Logger/Logger";
import { IVideoPlayer } from "../VideoPlayer/IVideoPlayer";
import { UeDataMessage } from "./UeDataMessage";
import { UeMessageType } from "./UeMessageTypes"

/**
 * Handles Sending Touch messages to the UE Instance
 */
export class UeInputTouchMessage extends UeDataMessage {

    fingers: number[];
    fingersIds: { [key: number]: number };

    readonly unsignedOutOfRange: number = 65535;
    readonly signedOutOfRange: number = 32767;

    printInputs: boolean;

    videoElementProvider: IVideoPlayer;


    /**
     * @param datachannelController - Data channel Controller
     */
    constructor(datachannelController: DataChannelController, videoElementProvider: IVideoPlayer) {
        super(datachannelController);
        this.videoElementProvider = videoElementProvider;
        this.fingersIds = {}
        this.fingers = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
        this.printInputs = false;
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
        this.sendData(data.buffer);
    }

    /**
     * TO DO
     * @param x - X Coordinate
     * @param y - Y Coordinate
     * @returns - Normalised and Quantised Unsigned values
     */
    normaliseAndQuantiseUnsigned(x: number, y: number): NormaliseAndQuantiseUnsigned {
        let rootDiv = this.videoElementProvider.getVideoParentElement();
        let videoElement = this.videoElementProvider.getVideoElement();

        if (rootDiv && videoElement) {
            let playerAspectRatio = rootDiv.clientHeight / rootDiv.clientWidth;
            let videoAspectRatio = videoElement.videoHeight / videoElement.videoWidth;

            // Unsigned XY positions are the ratio (0.0..1.0) along a viewport axis,
            // quantized into an uint16 (0..65536).
            // Signed XY deltas are the ratio (-1.0..1.0) along a viewport axis,
            // quantized into an int16 (-32767..32767).
            // This allows the browser viewport and client viewport to have a different
            // size.
            // Hack: Currently we set an out-of-range position to an extreme (65535)
            // as we can't yet accurately detect mouse enter and leave events
            // precisely inside a video with an aspect ratio which causes mattes.
            if (playerAspectRatio > videoAspectRatio) {

                let ratio = playerAspectRatio / videoAspectRatio;
                // Unsigned.
                let normalizedX = x / rootDiv.clientWidth;
                let normalizedY = ratio * (y / rootDiv.clientHeight - 0.5) + 0.5;

                if (normalizedX < 0.0 || normalizedX > 1.0 || normalizedY < 0.0 || normalizedY > 1.0) {
                    return {
                        inRange: false,
                        x: this.unsignedOutOfRange,
                        y: this.unsignedOutOfRange
                    }
                } else {
                    return {
                        inRange: true,
                        x: normalizedX * (this.unsignedOutOfRange + 1),
                        y: normalizedY * (this.unsignedOutOfRange + 1)
                    };
                }

            } else {
                if (this.printInputs) {
                    Logger.verboseLog('Setup Normalize and Quantize for playerAspectRatio <= videoAspectRatio');
                }

                let ratio = videoAspectRatio / playerAspectRatio;
                // Unsigned. 
                let normalizedX = ratio * (x / rootDiv.clientWidth - 0.5) + 0.5;
                let normalizedY = y / rootDiv.clientHeight;
                if (normalizedX < 0.0 || normalizedX > 1.0 || normalizedY < 0.0 || normalizedY > 1.0) {
                    return {
                        inRange: false,
                        x: this.unsignedOutOfRange,
                        y: this.unsignedOutOfRange
                    };
                } else {
                    return {
                        inRange: true,
                        x: normalizedX * (this.unsignedOutOfRange + 1),
                        y: normalizedY * (this.unsignedOutOfRange + 1)
                    };
                }
            }
        }
    }
}
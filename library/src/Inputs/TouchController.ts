import { UeInputTouchMessage } from "../UeInstanceMessage/UeInputTouchMessage";
import { DataChannelController } from "../DataChannel/DataChannelController";
import { ITouchController } from "./ITouchController";
import { IVideoPlayer } from "../VideoPlayer/IVideoPlayer";
import { Logger } from "../Logger/Logger";
/** 
 * Handles the Touch input Events
 */
export class TouchController implements ITouchController {
    ueInputTouchMessage: UeInputTouchMessage;
    playerElement: HTMLDivElement;

    /**
     * 
     * @param dataChannelController - the data channel controller 
     * @param playerElement - the player element DOM
     */
    constructor(dataChannelController: DataChannelController, playerElement: HTMLDivElement, videoElementProvider: IVideoPlayer) {
        this.ueInputTouchMessage = new UeInputTouchMessage(dataChannelController, videoElementProvider);
        this.playerElement = playerElement;
        document.ontouchstart = (ev: TouchEvent) => this.onTouchStart(ev);
        document.ontouchend = (ev: TouchEvent) => this.onTouchEnd(ev);
        document.ontouchmove = (ev: TouchEvent) => this.onTouchMove(ev);
        Logger.Log(Logger.GetStackTrace(), "Touch Events Registered", 6);
    }

    /**
     * When a touch event starts 
     * @param event - the touch event being intercepted  
     */
    onTouchStart(event: TouchEvent) {
        Logger.Log(Logger.GetStackTrace(), "on Touch Start", 6);
        for (let i = 0; i < event.changedTouches.length; i++) {
            let touch: Touch = event.changedTouches[i];

            let finger = this.ueInputTouchMessage.fingers.pop();
            if (finger === undefined) {
                Logger.Log(Logger.GetStackTrace(), "who has more then 10 fingers", 6);
            }
            this.ueInputTouchMessage.fingersIds[touch.identifier] = finger;
            Logger.Log(Logger.GetStackTrace(), "touch.identifier: " + touch.identifier, 6);
            Logger.Log(Logger.GetStackTrace(), "finger: " + finger, 6);
        }

        this.ueInputTouchMessage.sendTouchStart(event.changedTouches);
    }

    /**
     * When a touch event ends 
     * @param event - the touch event being intercepted  
     */
    onTouchEnd(event: TouchEvent) {
        Logger.Log(Logger.GetStackTrace(), "on Touch END", 6);

        for (let i = 0; i < event.changedTouches.length; i++) {
            let touch = event.changedTouches[i];
            Logger.Log(Logger.GetStackTrace(), "on Forget Touch", 6);
            Logger.Log(Logger.GetStackTrace(), "touch id: " + touch.identifier, 6);
            Logger.Log(Logger.GetStackTrace(), "Fingers id Touch id: " + this.ueInputTouchMessage.fingersIds[touch.identifier], 6);
            this.ueInputTouchMessage.fingers.push(this.ueInputTouchMessage.fingersIds[touch.identifier]);
            delete this.ueInputTouchMessage.fingersIds[touch.identifier];
            Logger.Log(Logger.GetStackTrace(), "touch.identifier: " + touch.identifier, 6);
        }
        this.ueInputTouchMessage.sendTouchEnd(event.changedTouches);
    }

    /**
     * when a moving touch event occurs 
     * @param event - the touch event being intercepted  
     */
    onTouchMove(event: TouchEvent) {
        for (let i = 0; i < event.touches.length; i++) {
            let touch = event.touches[i];
            Logger.Log(Logger.GetStackTrace(), "X: " + touch.clientX + " Y: " + touch.clientY, 6);
        }
        this.ueInputTouchMessage.sendTouchMove(event.touches);
    }
}

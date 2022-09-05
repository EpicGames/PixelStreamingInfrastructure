import { ITouchController } from "./ITouchController";
import { IVideoPlayer } from "../VideoPlayer/IVideoPlayer";
import { Logger } from "../Logger/Logger";
import { IStreamMessageController } from "../UeInstanceMessage/IStreamMessageController";
/** 
 * Handles the Touch input Events
 */
export class TouchController implements ITouchController {
    toStreamerMessagesProvider: IStreamMessageController;
    playerElement: HTMLVideoElement;

    /**
     * 
     * @param videoElementProvider - the provider of the video element 
     */
    constructor(toStreamerMessagesProvider: IStreamMessageController, videoElementProvider: IVideoPlayer) {
        this.toStreamerMessagesProvider = toStreamerMessagesProvider;
        this.playerElement = videoElementProvider.getVideoElement();
        this.playerElement.ontouchstart = (ev: TouchEvent) => this.onTouchStart(ev);
        this.playerElement.ontouchend = (ev: TouchEvent) => this.onTouchEnd(ev);
        this.playerElement.ontouchmove = (ev: TouchEvent) => this.onTouchMove(ev);
        Logger.Log(Logger.GetStackTrace(), "Touch Events Registered", 6);
    }

    rememberTouch(){

    }

    forgetTouch(){
        
    }

    /**
     * When a touch event starts 
     * @param event - the touch event being intercepted  
     */
    onTouchStart(touchEvent: TouchEvent) {
        Logger.Log(Logger.GetStackTrace(), "on Touch Start", 6);
        for (let i = 0; i < touchEvent.changedTouches.length; i++) {
            let touch: Touch = touchEvent.changedTouches[i];

            let finger = this.ueInputTouchMessage.fingers.pop();
            if (finger === undefined) {
                Logger.Log(Logger.GetStackTrace(), "who has more then 10 fingers", 6);
            }
            this.ueInputTouchMessage.fingersIds[touch.identifier] = finger;
            Logger.Log(Logger.GetStackTrace(), "touch.identifier: " + touch.identifier, 6);
            Logger.Log(Logger.GetStackTrace(), "finger: " + finger, 6);
        }

        this.ueInputTouchMessage.sendTouchStart(touchEvent.changedTouches);
        touchEvent.preventDefault();
    }

    /**
     * When a touch event ends 
     * @param touchEvent - the touch event being intercepted  
     */
    onTouchEnd(touchEvent: TouchEvent) {
        Logger.Log(Logger.GetStackTrace(), "on Touch END", 6);

        for (let i = 0; i < touchEvent.changedTouches.length; i++) {
            let touch = touchEvent.changedTouches[i];
            Logger.Log(Logger.GetStackTrace(), "on Forget Touch", 6);
            Logger.Log(Logger.GetStackTrace(), "touch id: " + touch.identifier, 6);
            Logger.Log(Logger.GetStackTrace(), "Fingers id Touch id: " + this.ueInputTouchMessage.fingersIds[touch.identifier], 6);
            this.ueInputTouchMessage.fingers.push(this.ueInputTouchMessage.fingersIds[touch.identifier]);
            this.ueInputTouchMessage.fingers.sort(function (a, b) { return b - a });
            delete this.ueInputTouchMessage.fingersIds[touch.identifier];
            Logger.Log(Logger.GetStackTrace(), "touch.identifier: " + touch.identifier, 6);
        }
        this.ueInputTouchMessage.sendTouchEnd(touchEvent.changedTouches);
        touchEvent.preventDefault()
    }

    /**
     * when a moving touch event occurs 
     * @param event - the touch event being intercepted  
     */
    onTouchMove(touchEvent: TouchEvent) {
        for (let i = 0; i < touchEvent.touches.length; i++) {
            let touch = touchEvent.touches[i];
            Logger.Log(Logger.GetStackTrace(), "X: " + touch.clientX + " Y: " + touch.clientY, 6);
        }
        this.ueInputTouchMessage.sendTouchMove(touchEvent.touches);
        touchEvent.preventDefault();
    }
}

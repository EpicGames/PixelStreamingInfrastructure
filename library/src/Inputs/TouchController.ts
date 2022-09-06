import { ITouchController } from "./ITouchController";
import { IVideoPlayer } from "../VideoPlayer/IVideoPlayer";
import { Logger } from "../Logger/Logger";
import { IStreamMessageController } from "../UeInstanceMessage/IStreamMessageController";
import { INormalizeAndQuantize } from "../NormalizeAndQuantize/INormalizeAndQuantize";
/** 
 * Handles the Touch input Events
 */
export class TouchController implements ITouchController {
    toStreamerMessagesProvider: IStreamMessageController;
    videoElementProvider: IVideoPlayer;
    normalizeAndQuantize: INormalizeAndQuantize;
    videoElementParent: HTMLVideoElement;
    fingers = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    fingerIds = new Map();
    maxByteValue: number = 255;

    /**
     * 
     * @param videoElementProvider - the provider of the video element 
     */
    constructor(toStreamerMessagesProvider: IStreamMessageController, videoElementProvider: IVideoPlayer, normalizeAndQuantize: INormalizeAndQuantize) {
        this.toStreamerMessagesProvider = toStreamerMessagesProvider;
        this.videoElementProvider = videoElementProvider;
        this.normalizeAndQuantize = normalizeAndQuantize;
        this.videoElementParent = videoElementProvider.getVideoElement();
        this.videoElementParent.ontouchstart = (ev: TouchEvent) => this.onTouchStart(ev);
        this.videoElementParent.ontouchend = (ev: TouchEvent) => this.onTouchEnd(ev);
        this.videoElementParent.ontouchmove = (ev: TouchEvent) => this.onTouchMove(ev);
        Logger.Log(Logger.GetStackTrace(), "Touch Events Registered", 6);
    }

    rememberTouch(touch: Touch) {
        let finger = this.fingers.pop();
        if (finger === undefined) {
            console.log('exhausted touch identifiers');
        }
        this.fingerIds.set(touch.identifier, finger);
    }

    forgetTouch(touch: Touch) {
        this.fingers.push(this.fingerIds.get(touch.identifier));
        // Sort array back into descending order. This means if finger '1' were to lift after finger '0', we would ensure that 0 will be the first index to pop
        this.fingers.sort(function (a, b) { return b - a });
        this.fingerIds.delete(touch.identifier);
    }

    /**
     * When a touch event starts 
     * @param touchEvent - the touch event being intercepted  
     */
    onTouchStart(touchEvent: TouchEvent) {
        for (let t = 0; t < touchEvent.changedTouches.length; t++) {
            this.rememberTouch(touchEvent.changedTouches[t]);
        }
        Logger.Log(Logger.GetStackTrace(), 'touch start', 6);

        this.emitTouchData("TouchStart", touchEvent.changedTouches);
        touchEvent.preventDefault();
    }

    /**
     * When a touch event ends 
     * @param touchEvent - the touch event being intercepted  
     */
    onTouchEnd(touchEvent: TouchEvent) {
        Logger.Log(Logger.GetStackTrace(), 'touch end', 6);
        this.emitTouchData("TouchEnd", touchEvent.changedTouches);
        // Re-cycle unique identifiers previously assigned to each touch.
        for (let t = 0; t < touchEvent.changedTouches.length; t++) {
            this.forgetTouch(touchEvent.changedTouches[t]);
        }
        touchEvent.preventDefault();
    }

    /**
     * when a moving touch event occurs 
     * @param touchEvent - the touch event being intercepted  
     */
    onTouchMove(touchEvent: TouchEvent) {
        Logger.Log(Logger.GetStackTrace(), 'touch move', 6);
        this.emitTouchData("TouchMove", touchEvent.touches);
        touchEvent.preventDefault();
    }

    emitTouchData(type: string, touches: TouchList) {
        let videoElementParent = this.videoElementProvider.getVideoParentElement();
        let toStreamerHandlers = this.toStreamerMessagesProvider.getToStreamHandlersMap();

        for (let t = 0; t < touches.length; t++) {
            let numTouches = 1; // the number of touches to be sent this message
            let touch = touches[t];
            let x = touch.clientX - videoElementParent.offsetLeft;
            let y = touch.clientY - videoElementParent.offsetTop;
            Logger.Log(Logger.GetStackTrace(), `F${this.fingerIds.get(touch.identifier)}=(${x}, ${y})`, 6);

            let coord = this.normalizeAndQuantize.normalizeAndQuantizeUnsigned(x, y);
            switch (type) {
                case "TouchStart":
                    toStreamerHandlers.get("TouchStart")("TouchStart", [numTouches, coord.x, coord.y, this.fingerIds.get(touch.identifier), this.maxByteValue * touch.force, coord.inRange ? 1 : 0]);
                    break;
                case "TouchEnd":
                    toStreamerHandlers.get("TouchEnd")("TouchEnd", [numTouches, coord.x, coord.y, this.fingerIds.get(touch.identifier), this.maxByteValue * touch.force, coord.inRange ? 1 : 0]);
                    break;
                case "TouchMove":
                    toStreamerHandlers.get("TouchMove")("TouchMove", [numTouches, coord.x, coord.y, this.fingerIds.get(touch.identifier), this.maxByteValue * touch.force, coord.inRange ? 1 : 0]);
                    break;
            }
        }
    }
}

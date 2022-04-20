import { MouseController } from "../Inputs/MouseController";
import { Logger } from "../Logger/Logger";
import { IVideoPlayerTouchInterface } from "./VideoTouchEventInterfaces";

/**
 * Storage for finger Data
 */
interface fingerInterface {
    ID: number;
    X: number;
    Y: number;
}

/**
 * Real Touch Event Handler
 */
export class VideoPlayerTouchEvents implements IVideoPlayerTouchInterface {

    mouseController: MouseController;
    htmlVideoElement: HTMLVideoElement;

    clientRect: DOMRect;
    finger: fingerInterface;

    fingers: number[]// = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    fingerIds = {};

    constructor(mouseController: MouseController, htmlDivElement: HTMLDivElement) {
        this.clientRect = htmlDivElement.getBoundingClientRect();
        this.mouseController = mouseController;
        this.fingers = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    }

    /**
     * Handle the touch Start event, sends the touch data to the UE Instance
     * @param touchEvent - Touch Event
     */
    onTouchStart(touchEvent: TouchEvent) {
        // Assign a unique identifier to each touch.
        for (let t = 0; t < touchEvent.changedTouches.length; t++) {
            this.rememberTouch(touchEvent.changedTouches[t]);
        }
        //this._UEMouseController.sendTouch(UeMessageType.TouchStart, touchEvent.changedTouches)
        touchEvent.preventDefault();
    }

    /**
     * Handle the touch End event, sends the touch data to the UE Instance
     * @param touchEvent - Touch Event
     */
    onTouchEnd(touchEvent: TouchEvent) {
        Logger.verboseLog('touch end');

        ///this._UEMouseController.sendTouch(UeMessageType.TouchEnd, touchEvent.changedTouches);

        // Re-cycle unique identifiers previously assigned to each touch.
        for (let t = 0; t < touchEvent.changedTouches.length; t++) {
            this.forgetTouch(touchEvent.changedTouches[t]);
        }
        touchEvent.preventDefault();
    }

    /**
     * Handle the touch Move event, sends the touch data to the UE Instance
     * @param touchEvent - Touch Event
     */
    onTouchMove(touchEvent: TouchEvent) {
        Logger.verboseLog('touch move');
        //this.ueMouseController.sendTouch(UeMessageType.TouchMove, touchEvent.touches);
        touchEvent.preventDefault();
    }

    /**
     * handles Remember Touch
     * @param touch - Touch Data
     */
    rememberTouch(touch: Touch) {
        let finger = this.fingers.pop();
        if (finger === undefined) {
            Logger.verboseLog('exhausted touch identifiers');
        }
        this.fingerIds[touch.identifier] = finger;
    }

    /**
     * handles forget Touch
     * @param touch - Touch Data
     */
    forgetTouch(touch: Touch) {
        this.fingers.push(this.fingerIds[touch.identifier]);
        delete this.fingerIds[touch.identifier];
    }
}
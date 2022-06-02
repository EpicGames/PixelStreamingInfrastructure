import { UeInputTouchMessage } from "../UeInstanceMessage/UeInputTouchMessage";
import { DataChannelController } from "../DataChannel/DataChannelController";
import { ITouchController } from "./ITouchController";
import { IVideoPlayer } from "../VideoPlayer/IVideoPlayer";
/** 
 * Handles the Touch input Events
 */
export class TouchController implements ITouchController {
    ueInputTouchMessage: UeInputTouchMessage;
    playerElement: HTMLDivElement;

    logging: boolean;

    /**
     * 
     * @param dataChannelController - the data channel controller 
     * @param playerElement - the player element DOM
     */
    constructor(dataChannelController: DataChannelController, playerElement: HTMLDivElement, videoElementProvider: IVideoPlayer) {
        this.ueInputTouchMessage = new UeInputTouchMessage(dataChannelController, videoElementProvider);
        this.playerElement = playerElement;
        document.ontouchstart = this.onTouchStart.bind(this);
        document.ontouchend = this.onTouchEnd.bind(this);
        document.ontouchmove = this.onTouchMove.bind(this);
        console.log("Touch Events Registered");
        this.logging = false;
    }

    /**
     * When a touch event starts 
     * @param event - the touch event being intercepted  
     */
    onTouchStart(event: TouchEvent) {
        if (this.logging) { console.log("on Touch Start"); }
        for (let i = 0; i < event.changedTouches.length; i++) {
            let touch: Touch = event.changedTouches[i];

            let finger = this.ueInputTouchMessage.fingers.pop();
            if (finger === undefined) {
                if (this.logging) { console.log("who has more then 10 fingers"); }
            }
            this.ueInputTouchMessage.fingersIds[touch.identifier] = finger;

            if (this.logging) { console.log("touch.identifier: " + touch.identifier); }
            if (this.logging) { console.log("finger: " + finger); }
        }

        this.ueInputTouchMessage.sendTouchStart(event.changedTouches);
    }

    /**
     * When a touch event ends 
     * @param event - the touch event being intercepted  
     */
    onTouchEnd(event: TouchEvent) {
        if (this.logging) { console.log("on Touch END"); }

        for (let i = 0; i < event.changedTouches.length; i++) {
            let touch = event.changedTouches[i];
            if (this.logging) {
                console.log("on Forget Touch");
                console.log("touch id: " + touch.identifier);
                console.log("Fingers id Touch id: " + this.ueInputTouchMessage.fingersIds[touch.identifier]);
            }

            this.ueInputTouchMessage.fingers.push(this.ueInputTouchMessage.fingersIds[touch.identifier]);

            delete this.ueInputTouchMessage.fingersIds[touch.identifier];
            if (this.logging) { console.log("touch.identifier: " + touch.identifier); }
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
            if (this.logging) { console.log("X: " + touch.clientX + " Y: " + touch.clientY); }
        }
        this.ueInputTouchMessage.sendTouchMove(event.touches);
    }
}

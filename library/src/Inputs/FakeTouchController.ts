import { UeInputMouseMessage } from "../UeInstanceMessage/UeInputMouseMessage";
import { DataChannelController } from "../DataChannel/DataChannelController";
import { ITouchController } from "./ITouchController";
import { MouseButton } from "./MouseButtons";


/**
 * Allows for the usage of fake touch events and implements ITouchController
 * @param dataChannelController - The controller for the Data channel 
 * @param videoPlayerElement - The video player DOM element 
 */
export class FakeTouchController implements ITouchController {
    finger: Finger;
    ueInputMouseMessage: UeInputMouseMessage;
    videoPlayerElement: HTMLVideoElement;

    constructor(dataChannelController: DataChannelController, videoPlayerElement: HTMLVideoElement) {
        this.ueInputMouseMessage = new UeInputMouseMessage(dataChannelController);
        this.videoPlayerElement = videoPlayerElement;
        document.ontouchstart = this.onTouchStart.bind(this);
        document.ontouchend = this.onTouchEnd.bind(this);
        document.ontouchmove = this.onTouchMove.bind(this);
    }

    /**
     * When a touch event begins 
     * @param touch - the activating touch event 
     */
    onTouchStart(touch: TouchEvent): void {
        if (this.finger == null) {
            let first_touch = touch.changedTouches[0];
            this.finger = {
                ID: first_touch.identifier,
                X: first_touch.clientX - this.videoPlayerElement.getBoundingClientRect().left,
                Y: first_touch.clientY - - this.videoPlayerElement.getBoundingClientRect().top
            }

            let mouseEvent = new MouseEvent(touch.type, first_touch)

            this.videoPlayerElement.onmouseenter(mouseEvent);
            this.ueInputMouseMessage.sendMouseDown(MouseButton.mainButton, this.finger.X, this.finger.Y);
        }
    }

    /**
     * When a touch event ends 
     * @param touchEvent - the activating touch event 
     */
    onTouchEnd(touchEvent: TouchEvent): void {
        for (let i = 0; i < touchEvent.changedTouches.length; i++) {
            let touch = touchEvent.changedTouches[i];

            if (touch.identifier === this.finger.ID) {
                let x = touch.clientX - this.videoPlayerElement.getBoundingClientRect().left;
                let y = touch.clientY - this.videoPlayerElement.getBoundingClientRect().top;
                this.ueInputMouseMessage.sendMouseUp(MouseButton.mainButton, x, y);

                let mouseEvent = new MouseEvent(touchEvent.type, touch)
                this.videoPlayerElement.onmouseleave(mouseEvent);
                this.finger = null;
            }
        }

    }

    /**
     * On a Move touch event 
     * @param touchEvent - the activating touch event 
     */
    onTouchMove(touchEvent: TouchEvent): void {
        for (let i = 0; i < touchEvent.touches.length; i++) {
            let touch = touchEvent.touches[i];
            if (touch.identifier === this.finger.ID) {
                let x = touch.clientX - this.videoPlayerElement.getBoundingClientRect().left;
                let y = touch.clientY - this.videoPlayerElement.getBoundingClientRect().top;
                this.ueInputMouseMessage.sendMouseMove(x, y, x - this.finger.X, y - this.finger.Y);
                this.finger.X = x;
                this.finger.Y = y;
            }
        }
    }
}

/**
 * The interface for finger position mapping 
 */
export interface Finger {
    ID: number;
    X: number;
    Y: number;
}
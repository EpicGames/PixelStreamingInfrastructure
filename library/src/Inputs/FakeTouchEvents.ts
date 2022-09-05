import { MouseButton } from "./MouseButtons";
import { MouseController } from "./MouseController";
import { ITouchEvents } from "./ITouchEvents";

/**
 * Storage for finger Data
 */
interface fingerInterface {
    ID: number;
    X: number;
    Y: number;
}


/**
 * Fake touch event handler
 */
export class FakeTouchEvents implements ITouchEvents {

    mouseController: MouseController;
    htmlVideoElement: HTMLVideoElement;

    clientRect: DOMRect;
    finger: fingerInterface;

    constructor(MouseController: MouseController, htmlDivElement: HTMLDivElement) {
        this.clientRect = htmlDivElement.getBoundingClientRect();
        this.mouseController = MouseController;
    }

    /**
     * Handle the touch Start event, sends the touch data to the UE Instance
     * @param touchEvent - Mouse Event
     */
    onTouchStart(touchEvent: TouchEvent) {
        if (this.finger === undefined) {
            let firstTouch = touchEvent.changedTouches[0];
            this.finger = {
                ID: firstTouch.identifier,
                X: firstTouch.clientX - this.clientRect.left,
                Y: firstTouch.clientY - this.clientRect.top
            };

            let event = new Event("onmouseenter");
            this.htmlVideoElement.dispatchEvent(event);
            this.mouseController.sendMouseDown(MouseButton.mainButton, this.finger.X, this.finger.Y);
        }
        touchEvent.preventDefault();
    }

    /**
     * Handle the touch End event, sends the touch data to the UE Instance
     * @param touchEvent - touch Event
     */
    onTouchEnd(touchEvent: TouchEvent) {
        for (let t = 0; t < touchEvent.changedTouches.length; t++) {
            let touch = touchEvent.changedTouches[t];
            if (touch.identifier === this.finger.ID) {
                let x = touch.clientX - this.clientRect.left;
                let y = touch.clientY - this.clientRect.top;

                this.mouseController.sendMouseUp(MouseButton.mainButton, x, y);
                let event = new Event("onmouseleave");
                this.htmlVideoElement.dispatchEvent(event);
                // Hack: Manual mouse leave event.
                this.finger = undefined;
                break;
            }
        }
        touchEvent.preventDefault();
    }

    /**
     * Handle the touch Move event, sends the touch data to the UE Instance
     * @param touchEvent - Touch Event
     */
    onTouchMove(touchEvent: TouchEvent) {
        for (let t = 0; t < touchEvent.touches.length; t++) {
            let touch = touchEvent.touches[t];
            if (touch.identifier === this.finger.ID) {
                let x = touch.clientX - this.clientRect.left;
                let y = touch.clientY - this.clientRect.top;

                this.mouseController.sendMouseMove(x, y, x - this.finger.X, y - this.finger.Y);

                this.finger.X = x;
                this.finger.Y = y;
                break;
            }
        }
        touchEvent.preventDefault();
    }
}
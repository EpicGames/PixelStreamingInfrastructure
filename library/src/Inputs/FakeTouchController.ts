import { ITouchController } from "./ITouchController";
import { MouseButton } from "./MouseButtons";
import { IStreamMessageController } from "../UeInstanceMessage/IStreamMessageController";
import { IVideoPlayer } from "../VideoPlayer/IVideoPlayer";


/**
 * Allows for the usage of fake touch events and implements ITouchController
 * @param dataChannelController - The controller for the Data channel 
 * @param videoPlayerElement - The video player DOM element 
 */
export class FakeTouchController implements ITouchController {
    finger: Finger;
    toStreamerMessagesProvider: IStreamMessageController;
    videoElementProvider: IVideoPlayer;

    constructor(toStreamerMessagesProvider: IStreamMessageController, videoElementProvider: IVideoPlayer) {
        this.toStreamerMessagesProvider = toStreamerMessagesProvider;
        this.videoElementProvider = videoElementProvider;
        document.ontouchstart = (ev: TouchEvent) => this.onTouchStart(ev);
        document.ontouchend = (ev: TouchEvent) => this.onTouchEnd(ev);
        document.ontouchmove = (ev: TouchEvent) => this.onTouchMove(ev);
    }

    /**
     * When a touch event begins 
     * @param touch - the activating touch event 
     */
    onTouchStart(touch: TouchEvent): void {
        let videoElementParent = this.videoElementProvider.getVideoParentElement();
        let toStreamerHandlers = this.toStreamerMessagesProvider.getToStreamHandlersMap();

        if (this.finger == null) {
            let first_touch = touch.changedTouches[0];
            this.finger = {
                ID: first_touch.identifier,
                X: first_touch.clientX - videoElementParent.getBoundingClientRect().left,
                Y: first_touch.clientY - - videoElementParent.getBoundingClientRect().top
            }

            let mouseEvent = new MouseEvent(touch.type, first_touch)

            videoElementParent.onmouseenter(mouseEvent);
            toStreamerHandlers.get("MouseDown")("MouseDown", [MouseButton.mainButton, this.finger.X, this.finger.Y]);
        }
    }

    /**
     * When a touch event ends 
     * @param touchEvent - the activating touch event 
     */
    onTouchEnd(touchEvent: TouchEvent): void {
        let videoElementParent = this.videoElementProvider.getVideoParentElement();
        let toStreamerHandlers = this.toStreamerMessagesProvider.getToStreamHandlersMap();

        for (let i = 0; i < touchEvent.changedTouches.length; i++) {
            let touch = touchEvent.changedTouches[i];

            if (touch.identifier === this.finger.ID) {
                let x = touch.clientX - videoElementParent.getBoundingClientRect().left;
                let y = touch.clientY - videoElementParent.getBoundingClientRect().top;
                toStreamerHandlers.get("MouseUp")("MouseUp", [MouseButton.mainButton, x, y]);

                let mouseEvent = new MouseEvent(touchEvent.type, touch)
                videoElementParent.onmouseleave(mouseEvent);
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
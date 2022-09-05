import { ITouchController } from "./ITouchController";
import { MouseButton } from "./MouseButtons";
import { IStreamMessageController } from "../UeInstanceMessage/IStreamMessageController";
import { IVideoPlayer } from "../VideoPlayer/IVideoPlayer";
import { INormalizeAndQuantize } from "../NormalizeAndQuantize/INormalizeAndQuantize";


/**
 * Allows for the usage of fake touch events and implements ITouchController
 * @param dataChannelController - The controller for the Data channel 
 * @param videoPlayerElement - The video player DOM element 
 */
export class FakeTouchController implements ITouchController {
    finger: Finger;
    toStreamerMessagesProvider: IStreamMessageController;
    videoElementProvider: IVideoPlayer;
    normalizeAndQuantize: INormalizeAndQuantize;

    constructor(toStreamerMessagesProvider: IStreamMessageController, videoElementProvider: IVideoPlayer, normalizeAndQuantize: INormalizeAndQuantize) {
        this.toStreamerMessagesProvider = toStreamerMessagesProvider;
        this.videoElementProvider = videoElementProvider;
        this.normalizeAndQuantize = normalizeAndQuantize;
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
                id: first_touch.identifier,
                x: first_touch.clientX - videoElementParent.getBoundingClientRect().left,
                y: first_touch.clientY - - videoElementParent.getBoundingClientRect().top
            }

            let mouseEvent = new MouseEvent(touch.type, first_touch);
            videoElementParent.onmouseenter(mouseEvent);
            let coord = this.normalizeAndQuantize.normalizeAndQuantizeUnsigned(this.finger.x, this.finger.y);
            toStreamerHandlers.get("MouseDown")("MouseDown", [MouseButton.mainButton, coord.x, coord.y]);
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

            if (touch.identifier === this.finger.id) {
                let x = touch.clientX - videoElementParent.getBoundingClientRect().left;
                let y = touch.clientY - videoElementParent.getBoundingClientRect().top;
                let coord = this.normalizeAndQuantize.normalizeAndQuantizeUnsigned(this.finger.x, this.finger.y);
                toStreamerHandlers.get("MouseUp")("MouseUp", [MouseButton.mainButton, coord.x, coord.y]);

                let mouseEvent = new MouseEvent(touchEvent.type, touch);
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
        let videoElementParent = this.videoElementProvider.getVideoParentElement();
        let toStreamerHandlers = this.toStreamerMessagesProvider.getToStreamHandlersMap();

        for (let i = 0; i < touchEvent.touches.length; i++) {
            let touch = touchEvent.touches[i];
            if (touch.identifier === this.finger.id) {
                let x = touch.clientX - videoElementParent.getBoundingClientRect().left;
                let y = touch.clientY - videoElementParent.getBoundingClientRect().top;
                let coord = this.normalizeAndQuantize.normalizeAndQuantizeUnsigned(x, y);
                let delta = this.normalizeAndQuantize.normalizeAndQuantizeSigned(x - this.finger.x, y - this.finger.y);
                toStreamerHandlers.get("MoveMouse")("MouseMove", [coord.x, coord.y, delta.x, delta.y]);
                this.finger.x = x;
                this.finger.y = y;
            }
        }
    }
}

/**
 * The interface for finger position mapping 
 */
export interface Finger {
    id: number;
    x: number;
    y: number;
}
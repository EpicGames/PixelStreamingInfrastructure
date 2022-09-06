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
    playerElementClientRect: DOMRect;

    constructor(toStreamerMessagesProvider: IStreamMessageController, videoElementProvider: IVideoPlayer, normalizeAndQuantize: INormalizeAndQuantize) {
        this.toStreamerMessagesProvider = toStreamerMessagesProvider;
        this.videoElementProvider = videoElementProvider;
        this.normalizeAndQuantize = normalizeAndQuantize;
        document.ontouchstart = (ev: TouchEvent) => this.onTouchStart(ev);
        document.ontouchend = (ev: TouchEvent) => this.onTouchEnd(ev);
        document.ontouchmove = (ev: TouchEvent) => this.onTouchMove(ev);
    }

    setPlayerElementClientRect(playerElementClientRect: any) {
        this.playerElementClientRect = playerElementClientRect;
    }

    /**
     * When a touch event begins 
     * @param touch - the activating touch event 
     */
    onTouchStart(touch: TouchEvent): void {
        if (this.finger == null) {
            let first_touch = touch.changedTouches[0];
            this.finger = new Finger(first_touch.identifier, first_touch.clientX - this.playerElementClientRect.left, first_touch.clientY - this.playerElementClientRect.top);

            let playerElement = this.videoElementProvider.getVideoParentElement() as HTMLDivElement;
            let mouseEvent = new MouseEvent(touch.type, first_touch);
            playerElement.onmouseenter(mouseEvent);

            let coord = this.normalizeAndQuantize.normalizeAndQuantizeUnsigned(this.finger.x, this.finger.y);
            let toStreamerHandlers = this.toStreamerMessagesProvider.getToStreamHandlersMap();
            toStreamerHandlers.get("MouseDown")("MouseDown", [MouseButton.mainButton, coord.x, coord.y]);
        }
        touch.preventDefault();
    }

    /**
     * When a touch event ends 
     * @param touchEvent - the activating touch event 
     */
    onTouchEnd(touchEvent: TouchEvent): void {
        let playerElement = this.videoElementProvider.getVideoParentElement();
        let toStreamerHandlers = this.toStreamerMessagesProvider.getToStreamHandlersMap();

        for (let t = 0; t < touchEvent.changedTouches.length; t++) {
            let touch = touchEvent.changedTouches[t];
            if (touch.identifier === this.finger.id) {
                let x = touch.clientX - this.playerElementClientRect.left;
                let y = touch.clientY - this.playerElementClientRect.top;
                let coord = this.normalizeAndQuantize.normalizeAndQuantizeUnsigned(x, y);
                toStreamerHandlers.get("MouseUp")("MouseUp", [MouseButton.mainButton, coord.x, coord.y]);

                let mouseEvent = new MouseEvent(touchEvent.type, touch);
                playerElement.onmouseleave(mouseEvent);
                this.finger = null;
                break;
            }
        }
        touchEvent.preventDefault();
    }

    /**
     * On a Move touch event 
     * @param touchEvent - the activating touch event 
     */
    onTouchMove(touchEvent: TouchEvent): void {
        let toStreamerHandlers = this.toStreamerMessagesProvider.getToStreamHandlersMap();

        for (let t = 0; t < touchEvent.touches.length; t++) {
            let touch = touchEvent.touches[t];
            if (touch.identifier === this.finger.id) {
                let x = touch.clientX - this.playerElementClientRect.left;
                let y = touch.clientY - this.playerElementClientRect.top;
                let coord = this.normalizeAndQuantize.normalizeAndQuantizeUnsigned(x, y);
                let delta = this.normalizeAndQuantize.normalizeAndQuantizeSigned(x - this.finger.x, y - this.finger.y);
                toStreamerHandlers.get("MoveMouse")("MouseMove", [coord.x, coord.y, delta.x, delta.y]);
                this.finger.x = x;
                this.finger.y = y;
                break;
            }
        }
        touchEvent.preventDefault();
    }
}

/**
 * The interface for finger position mapping 
 */
export class Finger {
    id: number;
    x: number;
    y: number;

    constructor(id: number, x: number, y: number) {
        this.id = id;
        this.x = x;
        this.y = y;
    }
}
import { ITouchController } from "./ITouchController";
import { MouseButton } from "./MouseButtons";
import { IStreamMessageController } from "../UeInstanceMessage/IStreamMessageController";
import { IVideoPlayer } from "../VideoPlayer/IVideoPlayer";
import { INormalizeAndQuantize } from "../NormalizeAndQuantize/INormalizeAndQuantize";


/**
 * Allows for the usage of fake touch events and implements ITouchController
 * @param dataChannelController - The controller for the Data channel 
 * @param videovideoElementParent - The video player DOM element 
 */
export class FakeTouchController implements ITouchController {
    fakeTouchFinger: FakeTouchFinger;
    toStreamerMessagesProvider: IStreamMessageController;
    videoElementProvider: IVideoPlayer;
    normalizeAndQuantize: INormalizeAndQuantize;
    videoElementParentClientRect: DOMRect;

    constructor(toStreamerMessagesProvider: IStreamMessageController, videoElementProvider: IVideoPlayer, normalizeAndQuantize: INormalizeAndQuantize) {
        this.toStreamerMessagesProvider = toStreamerMessagesProvider;
        this.videoElementProvider = videoElementProvider;
        this.normalizeAndQuantize = normalizeAndQuantize;
        document.ontouchstart = (ev: TouchEvent) => this.onTouchStart(ev);
        document.ontouchend = (ev: TouchEvent) => this.onTouchEnd(ev);
        document.ontouchmove = (ev: TouchEvent) => this.onTouchMove(ev);
    }

    setvideoElementParentClientRect(videoElementParentClientRect: any) {
        this.videoElementParentClientRect = videoElementParentClientRect;
    }

    /**
     * When a touch event begins 
     * @param touch - the activating touch event 
     */
    onTouchStart(touch: TouchEvent): void {
        if (this.fakeTouchFinger == null) {
            let first_touch = touch.changedTouches[0];
            this.fakeTouchFinger = new FakeTouchFinger(first_touch.identifier, first_touch.clientX - this.videoElementParentClientRect.left, first_touch.clientY - this.videoElementParentClientRect.top);

            let videoElementParent = this.videoElementProvider.getVideoParentElement() as HTMLDivElement;
            let mouseEvent = new MouseEvent(touch.type, first_touch);
            videoElementParent.onmouseenter(mouseEvent);

            let coord = this.normalizeAndQuantize.normalizeAndQuantizeUnsigned(this.fakeTouchFinger.x, this.fakeTouchFinger.y);
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
        let videoElementParent = this.videoElementProvider.getVideoParentElement();
        let toStreamerHandlers = this.toStreamerMessagesProvider.getToStreamHandlersMap();

        for (let t = 0; t < touchEvent.changedTouches.length; t++) {
            let touch = touchEvent.changedTouches[t];
            if (touch.identifier === this.fakeTouchFinger.id) {
                let x = touch.clientX - this.videoElementParentClientRect.left;
                let y = touch.clientY - this.videoElementParentClientRect.top;
                let coord = this.normalizeAndQuantize.normalizeAndQuantizeUnsigned(x, y);
                toStreamerHandlers.get("MouseUp")("MouseUp", [MouseButton.mainButton, coord.x, coord.y]);

                let mouseEvent = new MouseEvent(touchEvent.type, touch);
                videoElementParent.onmouseleave(mouseEvent);
                this.fakeTouchFinger = null;
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
            if (touch.identifier === this.fakeTouchFinger.id) {
                let x = touch.clientX - this.videoElementParentClientRect.left;
                let y = touch.clientY - this.videoElementParentClientRect.top;
                let coord = this.normalizeAndQuantize.normalizeAndQuantizeUnsigned(x, y);
                let delta = this.normalizeAndQuantize.normalizeAndQuantizeSigned(x - this.fakeTouchFinger.x, y - this.fakeTouchFinger.y);
                toStreamerHandlers.get("MoveMouse")("MouseMove", [coord.x, coord.y, delta.x, delta.y]);
                this.fakeTouchFinger.x = x;
                this.fakeTouchFinger.y = y;
                break;
            }
        }
        touchEvent.preventDefault();
    }
}

/**
 * The interface for finger position mapping 
 */
export class FakeTouchFinger {
    id: number;
    x: number;
    y: number;

    constructor(id: number, x: number, y: number) {
        this.id = id;
        this.x = x;
        this.y = y;
    }
}
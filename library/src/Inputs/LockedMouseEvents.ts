import { MouseController } from "./MouseController";
import { Logger } from "../Logger/Logger";
import { IVideoPlayer } from "../VideoPlayer/IVideoPlayer";
import { IMouseEvents } from "./IMouseEvents";
import { NormaliseAndQuantiseUnsigned } from "../NormalizeAndQuantize/NormalizeAndQuantize";
import { IActiveKeys } from "./InputClassesFactory";

/**
 * Handle the mouse locked events
 */
export class LockedMouseEvents implements IMouseEvents {
    x: number;
    y: number;
    coord: NormaliseAndQuantiseUnsigned;
    videoElementProvider: IVideoPlayer;
    mouseController: MouseController;
    activeKeysProvider: IActiveKeys;

    /**
     * @param videoElementProvider - The HTML Video Element provider
     * @param mouseController  - Mouse Controller
     */
    constructor(videoElementProvider: IVideoPlayer, mouseController: MouseController, activeKeysProvider: IActiveKeys) {
        this.videoElementProvider = videoElementProvider;
        this.mouseController = mouseController;
        this.activeKeysProvider = activeKeysProvider;

        let videoElementParent = this.videoElementProvider.getVideoParentElement() as any;
        this.x = videoElementParent.width / 2;
        this.y = videoElementParent.height / 2;
        this.coord = this.mouseController.normalizeAndQuantize.normalizeAndQuantizeUnsigned(this.x, this.y);
    }

    /**
     * Handle when the locked state Changed
     */
    lockStateChange() {
        let videoElementParent = this.videoElementProvider.getVideoParentElement();
        let toStreamerHandlers = this.mouseController.toStreamerMessagesProvider.getToStreamHandlersMap();

        if (document.pointerLockElement === videoElementParent || document.mozPointerLockElement === videoElementParent) {
            Logger.Log(Logger.GetStackTrace(), 'Pointer locked');
            document.addEventListener("mousemove", (mouseEvent: MouseEvent) => this.updateMouseMovePosition(mouseEvent), false);
        } else {
            Logger.Log(Logger.GetStackTrace(), 'The pointer lock status is now unlocked');
            document.removeEventListener("mousemove", (mouseEvent: MouseEvent) => this.updateMouseMovePosition(mouseEvent), false);

            // If mouse loses focus, send a key up for all of the currently held-down keys
            // This is necessary as when the mouse loses focus, the windows stops listening for events and as such
            // the keyup listener won't get fired
            let activeKeys = this.activeKeysProvider.getActiveKeys();
            let setKeys = new Set(activeKeys);
            let newKeysIterable: Array<any> = [];

            setKeys.forEach((setKey: any) => {
                newKeysIterable[setKey];
            });

            newKeysIterable.forEach((uniqueKeycode) => {
                toStreamerHandlers.get("KeyUp")("KeyUp", [uniqueKeycode]);
            });
            // Reset the active keys back to nothing
            activeKeys = [];
        }
    }

    /**
     * Handle the mouse move event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    updateMouseMovePosition(mouseEvent: MouseEvent) {
        let toStreamerHandlers = this.mouseController.toStreamerMessagesProvider.getToStreamHandlersMap();
        let videoElement = this.videoElementProvider.getVideoElement();

        this.x += mouseEvent.movementX;
        this.y += mouseEvent.movementY;
        if (this.x > videoElement.clientWidth) {
            this.x -= videoElement.clientWidth;
        }
        if (this.y > videoElement.clientHeight) {
            this.y -= videoElement.clientHeight;
        }
        if (this.x < 0) {
            this.x = videoElement.clientWidth + this.x;
        }
        if (this.y < 0) {
            this.y = videoElement.clientHeight - this.y;
        }

        let coord = this.mouseController.normalizeAndQuantize.normalizeAndQuantizeUnsigned(this.x, this.y);
        let delta = this.mouseController.normalizeAndQuantize.normalizeAndQuantizeSigned(mouseEvent.movementX, mouseEvent.movementY);
        toStreamerHandlers.get("MouseMove")("MouseMove", [coord.x, coord.y, delta.x, delta.y]);
    }

    /**
     * Handle the mouse Down event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handleMouseDown(mouseEvent: MouseEvent) {
        let toStreamerHandlers = this.mouseController.toStreamerMessagesProvider.getToStreamHandlersMap();
        toStreamerHandlers.get("MouseDown")("MouseDown", [mouseEvent.button, this.coord.x, this.coord.y]);
    }


    /**
     * Handle the mouse Up event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handleMouseUp(mouseEvent: MouseEvent) {
        let toStreamerHandlers = this.mouseController.toStreamerMessagesProvider.getToStreamHandlersMap();
        toStreamerHandlers.get("MouseUp")("MouseUp", [mouseEvent.button, this.coord.x, this.coord.y]);
    }

    /**
     * Handle the mouse wheel event, sends the mouse wheel data to the UE Instance
     * @param wheelEvent - Mouse Event
     */
    handleMouseWheel(wheelEvent: WheelEvent) {
        let toStreamerHandlers = this.mouseController.toStreamerMessagesProvider.getToStreamHandlersMap();
        toStreamerHandlers.get("MouseWheel")("MouseWheel", [wheelEvent.wheelDelta, this.coord.x, this.coord.y]);
    }

    /**
    * Handle the mouse double click event, sends the mouse data to the UE Instance
    * @param mouseEvent - Mouse Event
    */
    handleMouseDouble(mouseEvent: MouseEvent) {
        let toStreamerHandlers = this.mouseController.toStreamerMessagesProvider.getToStreamHandlersMap();
        toStreamerHandlers.get("MouseDouble")("MouseDouble", [mouseEvent.button, this.coord.x, this.coord.y]);
    }

    /**
     * Handle the press mouse buttons event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handelPressMouseButtons(mouseEvent: MouseEvent) {
        this.mouseController.pressMouseButtons(mouseEvent.buttons, this.x, this.y);
    }

    /**
     * Handle the release mouse buttons event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handelReleaseMouseButtons(mouseEvent: MouseEvent) {
        this.mouseController.releaseMouseButtons(mouseEvent.buttons, this.x, this.y);
    }
}

declare global {
    interface Document {
        mozPointerLockElement: any;
        mozExitPointerLock?(): void;
    }

    interface WheelEvent {
        wheelDelta: any;
    }
}
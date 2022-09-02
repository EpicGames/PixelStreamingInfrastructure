import { MouseController } from "../Inputs/MouseController";
import { Logger } from "../Logger/Logger";
import { IVideoPlayer } from "./IVideoPlayer";
import { IVideoPlayerMouseInterface } from "./VideoPlayerMouseInterface";

/**
 * Handle the mouse locked events
 */
export class VideoPlayerMouseLockedEvents implements IVideoPlayerMouseInterface {

    x: number;
    y: number;

    videoElementProvider: IVideoPlayer;
    mouseController: MouseController;

    /**
     * @param videoElementProvider - The HTML Video Element provider
     * @param mouseController  - Mouse Controller
     */
    constructor(videoElementProvider: IVideoPlayer, mouseController: MouseController) {
        this.videoElementProvider = videoElementProvider;
        this.mouseController = mouseController;

        let videoElement = this.videoElementProvider.getVideoElement();
        this.x = videoElement.width / 2;
        this.y = videoElement.height / 2;
    }

    /**
     * Handle when the locked state Changed
     */
    handleLockStateChange() {
        Logger.Log(Logger.GetStackTrace(), "Lock state has changed", 6);
        let videoElement = this.videoElementProvider.getVideoElement();
        if (document.pointerLockElement === videoElement) {
            document.onmousemove = (mouseEvent) => this.handleMouseMove(mouseEvent);
            document.onwheel = (wheelEvent) => this.handleMouseWheel(wheelEvent);
            videoElement.onmousedown = (wheelEvent) => this.handleMouseDown(wheelEvent);
            videoElement.onmouseup = (mouseEvent) => this.handleMouseUp(mouseEvent);
        } else {
            document.onmousemove = null;
            videoElement.onmousedown = null;
            videoElement.onmouseup = null;
            videoElement.onwheel = null;
        }
    }

    /**
     * Handle the mouse move event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handleMouseMove(mouseEvent: MouseEvent) {
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

        this.mouseController.sendMouseMove(this.x, this.y, mouseEvent.movementX, mouseEvent.movementY);
    }

    /**
     * Handle the mouse Down event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handleMouseDown(mouseEvent: MouseEvent) {
        this.mouseController.sendMouseDown(mouseEvent.button, mouseEvent.x, mouseEvent.y);
    }


    /**
     * Handle the mouse Up event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handleMouseUp(mouseEvent: MouseEvent) {
        this.mouseController.sendMouseUp(mouseEvent.button, mouseEvent.x, mouseEvent.y);
    }

    /**
     * Handle the mouse wheel event, sends the mouse wheel data to the UE Instance
     * @param wheelEvent - Mouse Event
     */
    handleMouseWheel(wheelEvent: WheelEvent) {
        this.mouseController.sendMouseWheel(wheelEvent.deltaY, wheelEvent.x, wheelEvent.y);
    }

    /**
    * Handle the mouse double click event, sends the mouse data to the UE Instance
    * @param mouseEvent - Mouse Event
    */
    handleMouseDouble(mouseEvent: MouseEvent) {
        this.mouseController.sendMouseDouble(mouseEvent.button, mouseEvent.x, mouseEvent.y)
    }

    /**
     * Handle the press mouse buttons event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handelPressMouseButtons(mouseEvent: MouseEvent) {
        this.mouseController.pressMouseButtons(mouseEvent.buttons, mouseEvent.x, mouseEvent.y);
    }

    /**
     * Handle the release mouse buttons event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handelReleaseMouseButtons(mouseEvent: MouseEvent) {
        this.mouseController.releaseMouseButtons(mouseEvent.buttons, mouseEvent.x, mouseEvent.x);
    }
}
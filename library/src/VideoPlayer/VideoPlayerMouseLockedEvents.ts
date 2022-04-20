import { MouseController } from "../Inputs/MouseController";
import { IVideoPlayerMouseInterface } from "./VideoPlayerMouseInterface";

/**
 * Handle the mouse locked events
 */
export class VideoPlayerMouseLockedEvents implements IVideoPlayerMouseInterface {

    x: number;
    y: number;

    htmlVideoElement: HTMLVideoElement;
    mouseController: MouseController;

    /**
     * @param htmlVideoElement - The HTML Video Element
     * @param mouseController  - Mouse Controller
     */
    constructor(htmlVideoElement: HTMLVideoElement, mouseController: MouseController) {
        this.htmlVideoElement = htmlVideoElement;
        this.mouseController = mouseController;

        this.x = this.htmlVideoElement.width / 2;
        this.y = this.htmlVideoElement.height / 2;
    }

    /**
     * Handle the mouse move event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handleMouseMove(mouseEvent: MouseEvent) {
        this.x += mouseEvent.movementX;
        this.y += mouseEvent.movementY;
        if (this.x > this.htmlVideoElement.clientWidth) {
            this.x -= this.htmlVideoElement.clientWidth;
        }
        if (this.y > this.htmlVideoElement.clientHeight) {
            this.y -= this.htmlVideoElement.clientHeight;
        }
        if (this.x < 0) {
            this.x = this.htmlVideoElement.clientWidth + this.x;
        }
        if (this.y < 0) {
            this.y = this.htmlVideoElement.clientHeight - this.y;
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
     * Handle the mouse context menu event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handleContextMenu(mouseEvent: MouseEvent) {
        console.info("onContextMenu");
    }
}
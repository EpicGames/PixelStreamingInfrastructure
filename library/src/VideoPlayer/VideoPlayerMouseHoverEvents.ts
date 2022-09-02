import { MouseController } from "../Inputs/MouseController";
import { Logger } from "../Logger/Logger";
import { IVideoPlayerMouseInterface } from "./VideoPlayerMouseInterface";

/**
 * Video Player mouse Hover handler
 */
export class VideoPlayerMouseHoverEvents implements IVideoPlayerMouseInterface {

    mouseController: MouseController;

    /**
     * @param mouseController - Mouse Controller
     */
    constructor(mouseController: MouseController) {
        this.mouseController = mouseController;
    }

    /**
     * Handle the mouse move event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handleMouseMove(mouseEvent: MouseEvent) {
        Logger.Log(Logger.GetStackTrace(), "MouseMove", 6);
        this.mouseController.sendMouseMove(mouseEvent.offsetX, mouseEvent.offsetY, mouseEvent.movementX, mouseEvent.movementY);
        mouseEvent.preventDefault();
    }

    /**
     * Handle the mouse Down event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handleMouseDown(mouseEvent: MouseEvent) {
        Logger.Log(Logger.GetStackTrace(), "onMouse Down", 6);
        this.mouseController.sendMouseDown(mouseEvent.button, mouseEvent.offsetX, mouseEvent.offsetY);
        mouseEvent.preventDefault();
    }

    /**
     * Handle the mouse Up event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handleMouseUp(mouseEvent: MouseEvent) {
        this.mouseController.sendMouseUp(mouseEvent.button, mouseEvent.offsetX, mouseEvent.offsetY);
        mouseEvent.preventDefault();
    }

    /**
    * Handle the mouse context menu event, sends the mouse data to the UE Instance
    * @param mouseEvent - Mouse Event
    */
    handleContextMenu(mouseEvent: MouseEvent) {
        this.mouseController.sendMouseUp(mouseEvent.button, mouseEvent.offsetX, mouseEvent.offsetY);
        mouseEvent.preventDefault();
    }

    /**
     * Handle the mouse wheel event, sends the mouse wheel data to the UE Instance
     * @param wheelEvent - Mouse Event
     */
    handleMouseWheel(wheelEvent: WheelEvent) {
        this.mouseController.sendMouseWheel(wheelEvent.detail * -120, wheelEvent.offsetX, wheelEvent.offsetY);
        wheelEvent.preventDefault();
    }

    /**
     * Handle the mouse double click event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handleMouseDouble(mouseEvent: MouseEvent) {
        this.mouseController.sendMouseDouble(mouseEvent.button, mouseEvent.offsetX, mouseEvent.offsetY);
    }

    /**
     * Handle the press mouse buttons event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handelPressMouseButtons(mouseEvent: MouseEvent) {
        this.mouseController.pressMouseButtons(mouseEvent.buttons, mouseEvent.offsetX, mouseEvent.offsetY);
    }

    /**
     * Handle the release mouse buttons event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handelReleaseMouseButtons(mouseEvent: MouseEvent) {
        this.mouseController.releaseMouseButtons(mouseEvent.buttons, mouseEvent.offsetX, mouseEvent.offsetY);
    }
}
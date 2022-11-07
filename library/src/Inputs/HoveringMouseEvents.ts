import { MouseController } from "./MouseController";
import { Logger } from "../Logger/Logger";
import { IMouseEvents } from "./IMouseEvents";

/**
 * Video Player mouse Hover handler
 */
export class HoveringMouseEvents implements IMouseEvents {

    mouseController: MouseController;

    /**
     * @param mouseController - Mouse Controller instance
     */
    constructor(mouseController: MouseController) {
        this.mouseController = mouseController;
    }

    /**
     * Handle the mouse move event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    updateMouseMovePosition(mouseEvent: MouseEvent) {
        Logger.Log(Logger.GetStackTrace(), "MouseMove", 6);
        let coord = this.mouseController.normalizeAndQuantize.normalizeAndQuantizeUnsigned(mouseEvent.offsetX, mouseEvent.offsetY);
        let delta = this.mouseController.normalizeAndQuantize.normalizeAndQuantizeSigned(mouseEvent.movementX, mouseEvent.movementY);
        let toStreamerHandlers = this.mouseController.toStreamerMessagesProvider.getToStreamHandlersMap();
        toStreamerHandlers.get("MouseMove")("MouseMove", [coord.x, coord.y, delta.x, delta.y]);
        mouseEvent.preventDefault();
    }

    /**
     * Handle the mouse Down event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handleMouseDown(mouseEvent: MouseEvent) {
        Logger.Log(Logger.GetStackTrace(), "onMouse Down", 6);
        let coord = this.mouseController.normalizeAndQuantize.normalizeAndQuantizeUnsigned(mouseEvent.offsetX, mouseEvent.offsetY);
        let toStreamerHandlers = this.mouseController.toStreamerMessagesProvider.getToStreamHandlersMap();
        toStreamerHandlers.get("MouseDown")("MouseDown", [mouseEvent.button, coord.x, coord.y]);
        mouseEvent.preventDefault();
    }

    /**
     * Handle the mouse Up event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handleMouseUp(mouseEvent: MouseEvent) {
        let coord = this.mouseController.normalizeAndQuantize.normalizeAndQuantizeUnsigned(mouseEvent.offsetX, mouseEvent.offsetY);
        let toStreamerHandlers = this.mouseController.toStreamerMessagesProvider.getToStreamHandlersMap();
        toStreamerHandlers.get("MouseUp")("MouseUp", [mouseEvent.button, coord.x, coord.y]);
        mouseEvent.preventDefault();
    }

    /**
    * Handle the mouse context menu event, sends the mouse data to the UE Instance
    * @param mouseEvent - Mouse Event
    */
    handleContextMenu(mouseEvent: MouseEvent) {
        let coord = this.mouseController.normalizeAndQuantize.normalizeAndQuantizeUnsigned(mouseEvent.offsetX, mouseEvent.offsetY);
        let toStreamerHandlers = this.mouseController.toStreamerMessagesProvider.getToStreamHandlersMap();
        toStreamerHandlers.get("MouseUp")("MouseUp", [mouseEvent.button, coord.x, coord.y]);
        mouseEvent.preventDefault();
    }

    /**
     * Handle the mouse wheel event, sends the mouse wheel data to the UE Instance
     * @param wheelEvent - Mouse Event
     */
    handleMouseWheel(wheelEvent: WheelEvent) {
        let coord = this.mouseController.normalizeAndQuantize.normalizeAndQuantizeUnsigned(wheelEvent.offsetX, wheelEvent.offsetY);
        let toStreamerHandlers = this.mouseController.toStreamerMessagesProvider.getToStreamHandlersMap();
        toStreamerHandlers.get("MouseWheel")("MouseWheel", [wheelEvent.wheelDelta, coord.x, coord.y]);
        wheelEvent.preventDefault();
    }

    /**
     * Handle the mouse double click event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handleMouseDouble(mouseEvent: MouseEvent) {
        let coord = this.mouseController.normalizeAndQuantize.normalizeAndQuantizeUnsigned(mouseEvent.offsetX, mouseEvent.offsetY);
        let toStreamerHandlers = this.mouseController.toStreamerMessagesProvider.getToStreamHandlersMap();
        toStreamerHandlers.get("MouseDouble")("MouseDouble", [mouseEvent.button, coord.x, coord.y]);
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
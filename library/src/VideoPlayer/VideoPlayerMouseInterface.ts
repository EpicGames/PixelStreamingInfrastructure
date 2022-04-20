/**
 * Interface for Mouse Events
 */
export interface IVideoPlayerMouseInterface {
    /**
     * Handle when the mouse move
     * @param mouseEvent - Mouse Event
     */
    handleMouseMove(mouseEvent: MouseEvent): void;

    /**
     * Handle when the Button Down
     * @param mouseEvent - Mouse Event
     */
    handleMouseDown(mouseEvent: MouseEvent): void;

    /**
     * Handle when the button up
     * @param mouseEvent - Mouse Event
     */
    handleMouseUp(mouseEvent: MouseEvent): void;

    /**
    * Handle when the mouse wheel  
    * @param wheelEvent - Mouse wheel
    */
    handleMouseWheel(wheelEvent: WheelEvent): void;

    /**
    * Handle the mouse context menu
    * @param mouseEvent - mouse event
    */
    handleContextMenu(mouseEvent: MouseEvent): void;
}
// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * Interface for Mouse Events
 */
export interface IMouseEvents {
    /**
     * Handle when the locked state Changed
     */
    lockStateChange?(): void;

    /**
     * Handle when the mouse move
     * @param mouseEvent - Mouse Event
     */
    updateMouseMovePosition?(mouseEvent: MouseEvent): void;

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
     * Handle when the button double click
     * @param mouseEvent - Mouse Event
     */
    handleMouseDouble(mouseEvent: MouseEvent): void;

    /**
     * Handle the press mouse buttons event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handlePressMouseButtons(mouseEvent: MouseEvent): void;

    /**
     * Handle the release mouse buttons event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handleReleaseMouseButtons(mouseEvent: MouseEvent): void;

    /**
     * Handle the mouse context menu
     * @param mouseEvent - mouse event
     */
    handleContextMenu?(mouseEvent: MouseEvent): void;

    /**
     * Unregisters any registered mouse event handlers
     */
    unregisterMouseEvents(): void;
}

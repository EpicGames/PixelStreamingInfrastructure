// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * Interface for Touch Events
 */
export interface ITouchController {
    /**
     * Fire when a touch event starts
     * @param touchEvent - Touch Event Data
     */
    onTouchStart(touchEvent: TouchEvent): void;

    /**
     * Fire when a touch event ends
     * @param touchEvent - Touch Event Data
     */
    onTouchEnd(touchEvent: TouchEvent): void;

    /**
     * Fire when touch moves
     * @param touchEvent - Touch Event Data
     */
    onTouchMove(touchEvent: TouchEvent): void;

    /**
     * Unregisters all touch event handlers
     */
    unregisterTouchEvents(): void;
}

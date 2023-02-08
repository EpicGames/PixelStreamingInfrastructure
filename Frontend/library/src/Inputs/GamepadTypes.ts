// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * The interface for controllers
 */
export interface Controller {
    currentState: Gamepad;
    prevState: Gamepad;
}

/**
 * Additional types for Window and Navigator
 */
declare global {
    interface Window {
        mozRequestAnimationFrame(callback: FrameRequestCallback): number;
        webkitRequestAnimationFrame(callback: FrameRequestCallback): number;
    }

    interface Navigator {
        webkitGetGamepads(): Gamepad[];
    }
}
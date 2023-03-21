// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * The interface for controllers
 */
export interface Controller {
    currentState: Gamepad;
    prevState: Gamepad;
    id: number | undefined;
}

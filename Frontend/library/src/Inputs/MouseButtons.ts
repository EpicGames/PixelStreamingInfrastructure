// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * Mouse Button Data
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button}
 */
export class MouseButton {
    static mainButton = 0; // Left button.
    static auxiliaryButton = 1; // Wheel button.
    static secondaryButton = 2; // Right button.
    static fourthButton = 3; // Browser Back button.
    static fifthButton = 4; // Browser Forward button.
}

/**
 * Mouse Button Mask Data
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons}
 */
export class MouseButtonsMask {
    static primaryButton = 1; // Left button.
    static secondaryButton = 2; // Right button.
    static auxiliaryButton = 4; // Wheel button.
    static fourthButton = 8; // Browser Back button.
    static fifthButton = 16; // Browser Forward button.
}

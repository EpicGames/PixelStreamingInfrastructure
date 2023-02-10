// Copyright Epic Games, Inc. All Rights Reserved.

export class WebXRUtils {
    /**
     * Deep copies a gamepad's values by first converting it to a JSON object and then back to a gamepad
     *
     * @param gamepad the original gamepad
     * @returns a new gamepad object, populated with the original gamepads values
     */
    static deepCopyGamepad(gamepad: Gamepad): Gamepad {
        return JSON.parse(
            JSON.stringify({
                buttons: gamepad.buttons.map((b) =>
                    JSON.parse(
                        JSON.stringify({
                            pressed: b.pressed,
                            touched: b.touched
                        })
                    )
                ),
                axes: gamepad.axes
            })
        );
    }
}

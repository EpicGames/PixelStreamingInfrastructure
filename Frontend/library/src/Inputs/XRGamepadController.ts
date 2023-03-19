// Copyright Epic Games, Inc. All Rights Reserved.

import { StreamMessageController } from '../UeInstanceMessage/StreamMessageController';
import { Controller } from './GamepadTypes';
import { WebXRUtils } from '../Util/WebXRUtils';

/**
 * The class that handles the functionality of xrgamepads and controllers
 */
export class XRGamepadController {
    controllers: Array<Controller>;
    toStreamerMessagesProvider: StreamMessageController;

    /**
     * @param toStreamerMessagesProvider - Stream message instance
     */
    constructor(toStreamerMessagesProvider: StreamMessageController) {
        this.toStreamerMessagesProvider = toStreamerMessagesProvider;
        this.controllers = [];
    }

    updateStatus(
        source: XRInputSource,
        frame: XRFrame,
        refSpace: XRReferenceSpace
    ) {
        if (source.gamepad) {
            const gamepadPose = frame.getPose(source.gripSpace, refSpace);
            if (!gamepadPose) {
                return;
            }

            let system = 0;
            if (source.profiles.includes('htc-vive')) {
                system = 1;
            } else if (source.profiles.includes('oculus-touch')) {
                system = 2;
            }
            // TODO (william.belcher): Add other profiles (Quest, Microsoft Mixed Reality, etc)
            this.toStreamerMessagesProvider.toStreamerHandlers.get('XRSystem')([
                system
            ]);

            // Default: AnyHand (2)
            let handedness = 2;
            switch (source.handedness) {
                case 'left':
                    handedness = 0;
                    break;
                case 'right':
                    handedness = 1;
                    break;
            }

            // Send controller transform
            const matrix = gamepadPose.transform.matrix;
            const mat = [];
            for (let i = 0; i < 16; i++) {
                mat[i] = new Float32Array([matrix[i]])[0];
            }

            // prettier-ignore
            this.toStreamerMessagesProvider.toStreamerHandlers.get('XRControllerTransform')([
                mat[0], mat[4], mat[8], mat[12],
                mat[1], mat[5], mat[9], mat[13],
                mat[2], mat[6], mat[10], mat[14],
                mat[3], mat[7], mat[11], mat[15],
                handedness
            ]);

            // Handle controller buttons and axes
            if (this.controllers[handedness] === undefined) {
                this.controllers[handedness] = {
                    prevState: undefined,
                    currentState: undefined,
					id: undefined
                };
                this.controllers[handedness].prevState =
                    WebXRUtils.deepCopyGamepad(source.gamepad);
            }

            this.controllers[handedness].currentState =
                WebXRUtils.deepCopyGamepad(source.gamepad);

            const controller = this.controllers[handedness];
            const currState = controller.currentState;
            const prevState = controller.prevState;
            // Iterate over buttons
            for (let i = 0; i < currState.buttons.length; i++) {
                const currButton = currState.buttons[i];
                const prevButton = prevState.buttons[i];

                if (currButton.pressed) {
                    // press
                    this.toStreamerMessagesProvider.toStreamerHandlers.get(
                        'XRButtonPressed'
                    )([handedness, i, prevButton.pressed ? 1 : 0]);
                } else if (!currButton.pressed && prevButton.pressed) {
                    this.toStreamerMessagesProvider.toStreamerHandlers.get(
                        'XRButtonReleased'
                    )([handedness, i, 0]);
                }

                if (currButton.touched && !currButton.pressed) {
                    // press
                    this.toStreamerMessagesProvider.toStreamerHandlers.get(
                        'XRButtonPressed'
                    )([handedness, 3, prevButton.touched ? 1 : 0]);
                } else if (!currButton.touched && prevButton.touched) {
                    this.toStreamerMessagesProvider.toStreamerHandlers.get(
                        'XRButtonReleased'
                    )([handedness, 3, 0]);
                }
            }

            // Iterate over gamepad axes
            for (let i = 0; i < currState.axes.length; i++) {
                this.toStreamerMessagesProvider.toStreamerHandlers.get(
                    'XRAnalog'
                )([handedness, i, currState.axes[i]]);
            }

            this.controllers[handedness].prevState = currState;
        }
    }
}

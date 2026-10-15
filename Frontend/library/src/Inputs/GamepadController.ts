// Copyright Epic Games, Inc. All Rights Reserved.

import { StreamMessageController } from '../UeInstanceMessage/StreamMessageController';
import { IInputController } from './IInputController';
import { Controller, deepCopyGamepad } from './GamepadTypes';

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

/**
 * Gamepad layout codes enum
 */

export enum GamepadLayout {
    RightClusterBottomButton = 0,
    RightClusterRightButton = 1,
    RightClusterLeftButton = 2,
    RightClusterTopButton = 3,
    LeftShoulder = 4,
    RightShoulder = 5,
    LeftTrigger = 6,
    RightTrigger = 7,
    SelectOrBack = 8,
    StartOrForward = 9,
    LeftAnalogPress = 10,
    RightAnalogPress = 11,
    LeftClusterTopButton = 12,
    LeftClusterBottomButton = 13,
    LeftClusterLeftButton = 14,
    LeftClusterRightButton = 15,
    CentreButton = 16,
    // Axes
    LeftStickHorizontal = 0,
    LeftStickVertical = 1,
    RightStickHorizontal = 2,
    RightStickVertical = 3
}

/**
 * Handles gamepad events from the document to send to the streamer.
 */
export class GamepadController implements IInputController {
    controllers: Array<Controller>;
    streamMessageController: StreamMessageController;

    onGamepadConnectedListener: (event: GamepadEvent) => void;
    onGamepadDisconnectedListener: (event: GamepadEvent) => void;
    beforeUnloadListener: (event: Event) => void;
    requestAnimationFrame: (callback: FrameRequestCallback) => number;
    // The pending updateStatus frame; only one status loop runs per controller.
    statusLoopHandle: number | undefined;

    constructor(streamMessageController: StreamMessageController) {
        this.streamMessageController = streamMessageController;

        this.onGamepadConnectedListener = this.onGamepadConnected.bind(this);
        this.onGamepadDisconnectedListener = this.onGamepadDisconnected.bind(this);
        this.beforeUnloadListener = this.onBeforeUnload.bind(this);
        this.requestAnimationFrame = (
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.requestAnimationFrame
        ).bind(window);
    }

    register() {
        window.addEventListener('beforeunload', this.beforeUnloadListener);

        const browserWindow = window as Window;
        if ('GamepadEvent' in browserWindow) {
            window.addEventListener('gamepadconnected', this.onGamepadConnectedListener);
            window.addEventListener('gamepaddisconnected', this.onGamepadDisconnectedListener);
        } else if ('WebKitGamepadEvent' in browserWindow) {
            window.addEventListener('webkitgamepadconnected', this.onGamepadConnectedListener);
            window.addEventListener('webkitgamepaddisconnected', this.onGamepadDisconnectedListener);
        }
        this.controllers = [];
        if (navigator.getGamepads) {
            for (const gamepad of navigator.getGamepads()) {
                if (gamepad) {
                    this.onGamepadConnected(new GamepadEvent('gamepadconnected', { gamepad }));
                }
            }
        }
    }

    unregister() {
        window.removeEventListener('beforeunload', this.beforeUnloadListener);
        window.removeEventListener('gamepadconnected', this.onGamepadConnectedListener);
        window.removeEventListener('gamepaddisconnected', this.onGamepadDisconnectedListener);
        window.removeEventListener('webkitgamepadconnected', this.onGamepadConnectedListener);
        window.removeEventListener('webkitgamepaddisconnected', this.onGamepadDisconnectedListener);
        if (this.statusLoopHandle !== undefined) {
            window.cancelAnimationFrame(this.statusLoopHandle);
            this.statusLoopHandle = undefined;
        }
        for (const controller of this.controllers) {
            if (controller && controller.id !== undefined) {
                this.streamMessageController.toStreamerHandlers.get('GamepadDisconnected')([controller.id]);
            }
        }
        this.controllers = [];
    }

    onGamepadResponseReceived(gamepadId: number) {
        for (const controller of this.controllers) {
            if (controller && controller.id === undefined) {
                controller.id = gamepadId;
                break;
            }
        }
    }

    private onGamepadConnected(event: GamepadEvent) {
        const gamepad = event.gamepad;
        const newController: Controller = {
            currentState: deepCopyGamepad(gamepad),
            prevState: deepCopyGamepad(gamepad),
            id: undefined
        };

        this.controllers[gamepad.index] = newController;
        this.startStatusLoop();
        this.streamMessageController.toStreamerHandlers.get('GamepadConnected')();
    }

    private onGamepadDisconnected(event: GamepadEvent) {
        const gamepad = event.gamepad;
        const deletedController = this.controllers[gamepad.index];
        // Clear only this slot. Compacting the array would move the remaining pads off the indices that
        // scanGamepads uses to find them, so they would never receive state updates again.
        this.controllers[gamepad.index] = undefined;
        if (deletedController?.id !== undefined) {
            this.streamMessageController.toStreamerHandlers.get('GamepadDisconnected')([
                deletedController.id
            ]);
        }
    }

    private scanGamepads() {
        const gamepads = navigator.getGamepads
            ? navigator.getGamepads()
            : navigator.webkitGetGamepads
              ? navigator.webkitGetGamepads()
              : [];
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i] && this.controllers[gamepads[i].index] !== undefined) {
                this.controllers[gamepads[i].index].currentState = gamepads[i];
            }
        }
    }

    // Starts the per-frame status loop unless one is already pending. Each connect used to start another
    // loop, and every loop sends the same messages, so with several pads the traffic was duplicated.
    private startStatusLoop() {
        if (this.statusLoopHandle === undefined) {
            this.statusLoopHandle = this.requestAnimationFrame(() => this.updateStatus());
        }
    }

    private updateStatus() {
        this.statusLoopHandle = undefined;
        this.scanGamepads();
        const toStreamerHandlers = this.streamMessageController.toStreamerHandlers;

        // Iterate over multiple controllers in the case the multiple gamepads are connected
        for (const controller of this.controllers) {
            if (!controller) {
                continue;
            }
            // If we haven't received an id (possible if using an older version of UE), return to original functionality
            const controllerId =
                controller.id === undefined ? this.controllers.indexOf(controller) : controller.id;
            const currentState = controller.currentState;
            for (let i = 0; i < controller.currentState.buttons.length; i++) {
                // Typed as GamepadLayout so the comparisons below share an enum type.
                // Asserting `i as GamepadLayout` inline satisfies no-unsafe-enum-comparison
                // but trips no-unnecessary-type-assertion; this satisfies both.
                const buttonIndex: GamepadLayout = i;
                const currentButton = controller.currentState.buttons[i];
                const previousButton = controller.prevState.buttons[i];
                if (currentButton.pressed) {
                    // press
                    if (buttonIndex === GamepadLayout.LeftTrigger) {
                        // UEs left analog has a button index of 5
                        toStreamerHandlers.get('GamepadAnalog')([controllerId, 5, currentButton.value]);
                    } else if (buttonIndex === GamepadLayout.RightTrigger) {
                        // UEs right analog has a button index of 6
                        toStreamerHandlers.get('GamepadAnalog')([controllerId, 6, currentButton.value]);
                    } else {
                        toStreamerHandlers.get('GamepadButtonPressed')([
                            controllerId,
                            i,
                            previousButton.pressed ? 1 : 0
                        ]);
                    }
                } else if (!currentButton.pressed && previousButton.pressed) {
                    // release
                    if (buttonIndex === GamepadLayout.LeftTrigger) {
                        // UEs left analog has a button index of 5
                        toStreamerHandlers.get('GamepadAnalog')([controllerId, 5, 0]);
                    } else if (buttonIndex === GamepadLayout.RightTrigger) {
                        // UEs right analog has a button index of 6
                        toStreamerHandlers.get('GamepadAnalog')([controllerId, 6, 0]);
                    } else {
                        toStreamerHandlers.get('GamepadButtonReleased')([controllerId, i, 0]);
                    }
                }
            }
            // Iterate over gamepad axes (we will increment in lots of 2 as there is 2 axes per stick)
            for (let i = 0; i < currentState.axes.length; i += 2) {
                // Horizontal axes are even numbered
                const x = parseFloat(currentState.axes[i].toFixed(4));

                // Vertical axes are odd numbered
                // https://w3c.github.io/gamepad/#remapping Gamepad browser side standard mapping has positive down, negative up. This is downright disgusting. So we fix it.
                const y = -parseFloat(currentState.axes[i + 1].toFixed(4));

                // UE's analog axes follow the same order as the browsers, but start at index 1 so we will offset as such
                toStreamerHandlers.get('GamepadAnalog')([controllerId, i + 1, x]); // Horizontal axes, only offset by 1
                toStreamerHandlers.get('GamepadAnalog')([controllerId, i + 2, y]); // Vertical axes, offset by two (1 to match UEs axes convention and then another 1 for the vertical axes)
            }

            const controllerIndex = this.controllers.indexOf(controller);
            this.controllers[controllerIndex].prevState = deepCopyGamepad(currentState);
        }
        // The array keeps empty slots for disconnected pads, so check for a real controller, not its length.
        if (this.controllers.some((controller) => !!controller)) {
            this.startStatusLoop();
        }
    }

    private onBeforeUnload(_: Event) {
        // When a user navigates away from the page, we need to inform UE of all the disconnecting
        // controllers
        for (const controller of this.controllers) {
            if (!controller || controller.id === undefined) {
                continue;
            }
            this.streamMessageController.toStreamerHandlers.get('GamepadDisconnected')([controller.id]);
        }
    }
}

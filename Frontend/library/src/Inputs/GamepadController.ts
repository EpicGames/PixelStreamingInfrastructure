// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '../Logger/Logger';
import { StreamMessageController } from '../UeInstanceMessage/StreamMessageController';
import { Controller } from './GamepadTypes';

/**
 * The class that handles the functionality of gamepads and controllers
 */
export class GamePadController {
    controllers: Controller[];
    requestAnimationFrame: (callback: FrameRequestCallback) => number;
    toStreamerMessagesProvider: StreamMessageController;

    /**
     * @param toStreamerMessagesProvider - Stream message instance
     */
    constructor(toStreamerMessagesProvider: StreamMessageController) {
        this.toStreamerMessagesProvider = toStreamerMessagesProvider;

        this.requestAnimationFrame =
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.requestAnimationFrame;
        const browserWindow = window as Window;
        if ('GamepadEvent' in browserWindow) {
            window.addEventListener('gamepadconnected', (ev: GamepadEvent) =>
                this.gamePadConnectHandler(ev)
            );
            window.addEventListener('gamepaddisconnected', (ev: GamepadEvent) =>
                this.gamePadDisconnectHandler(ev)
            );
        } else if ('WebKitGamepadEvent' in browserWindow) {
            window.addEventListener(
                'webkitgamepadconnected',
                (ev: GamepadEvent) => this.gamePadConnectHandler(ev)
            );
            window.addEventListener(
                'webkitgamepaddisconnected',
                (ev: GamepadEvent) => this.gamePadDisconnectHandler(ev)
            );
        }
        this.controllers = [];
    }

    /**
     * Connects the gamepad handler
     * @param gamePadEvent - the activating gamepad event
     */
    gamePadConnectHandler(gamePadEvent: GamepadEvent) {
        Logger.Log(Logger.GetStackTrace(), 'Gamepad connect handler', 6);
        const gamepad = gamePadEvent.gamepad;

        const temp: Controller = {
            currentState: gamepad,
            prevState: gamepad
        };

        this.controllers.push(temp);
        this.controllers[gamepad.index].currentState = gamepad;
        this.controllers[gamepad.index].prevState = gamepad;
        Logger.Log(
            Logger.GetStackTrace(),
            'gamepad: ' + gamepad.id + ' connected',
            6
        );
        window.requestAnimationFrame(() => this.updateStatus());
    }

    /**
     * Disconnects the gamepad handler
     * @param gamePadEvent - the activating gamepad event
     */
    gamePadDisconnectHandler(gamePadEvent: GamepadEvent) {
        Logger.Log(Logger.GetStackTrace(), 'Gamepad disconnect handler', 6);
        Logger.Log(
            Logger.GetStackTrace(),
            'gamepad: ' + gamePadEvent.gamepad.id + ' disconnected',
            6
        );
        delete this.controllers[gamePadEvent.gamepad.index];
        this.controllers = this.controllers.filter(
            (controller) => controller !== undefined
        );
    }

    /**
     * Scan for connected gamepads
     */
    scanGamePads() {
        const gamepads = navigator.getGamepads
            ? navigator.getGamepads()
            : navigator.webkitGetGamepads
            ? navigator.webkitGetGamepads()
            : [];
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i] && gamepads[i].index in this.controllers) {
                this.controllers[gamepads[i].index].currentState = gamepads[i];
            }
        }
    }

    /**
     * Updates the status of the gamepad and sends the inputs
     */
    updateStatus() {
        this.scanGamePads();
        const toStreamerHandlers =
            this.toStreamerMessagesProvider.toStreamerHandlers;

        // Iterate over multiple controllers in the case the multiple gamepads are connected
        for (const controller of this.controllers) {
            const controllerIndex = this.controllers.indexOf(controller);
            const currentState = controller.currentState;
            for (let i = 0; i < controller.currentState.buttons.length; i++) {
                const currentButton = controller.currentState.buttons[i];
                const previousButton = controller.prevState.buttons[i];
                if (currentButton.pressed) {
                    // press
                    if (i == gamepadLayout.LeftTrigger) {
                        //                       UEs left analog has a button index of 5
                        toStreamerHandlers.get('GamepadAnalog')(
							[controllerIndex, 5, currentButton.value]
                        );
                    } else if (i == gamepadLayout.RightTrigger) {
                        //                       UEs right analog has a button index of 6
                        toStreamerHandlers.get('GamepadAnalog')(
                            [controllerIndex, 6, currentButton.value]
                        );
                    } else {
                        toStreamerHandlers.get('GamepadButtonPressed')(
                            [controllerIndex, i, previousButton.pressed ? 1 : 0]
                        );
                    }
                } else if (!currentButton.pressed && previousButton.pressed) {
                    // release
                    if (i == gamepadLayout.LeftTrigger) {
                        //                       UEs left analog has a button index of 5
                        toStreamerHandlers.get('GamepadAnalog')(
                            [controllerIndex, 5, 0]
                        );
                    } else if (i == gamepadLayout.RightTrigger) {
                        //                       UEs right analog has a button index of 6
                        toStreamerHandlers.get('GamepadAnalog')(
                            [controllerIndex, 6, 0]
                        );
                    } else {
                        toStreamerHandlers.get('GamepadButtonReleased')(
                            [controllerIndex, i]
                        );
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
                toStreamerHandlers.get('GamepadAnalog')([
                    controllerIndex,
                    i + 1,
                    x
                ]); // Horizontal axes, only offset by 1
                toStreamerHandlers.get('GamepadAnalog')([
                    controllerIndex,
                    i + 2,
                    y
                ]); // Vertical axes, offset by two (1 to match UEs axes convention and then another 1 for the vertical axes)
            }
            this.controllers[controllerIndex].prevState = currentState;
        }
        this.requestAnimationFrame(() => this.updateStatus());
    }
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

/**
 * Gamepad layout codes enum
 */
export enum gamepadLayout {
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
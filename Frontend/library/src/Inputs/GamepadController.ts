// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '../Logger/Logger';
import { StreamMessageController } from '../UeInstanceMessage/StreamMessageController';
import { EventListenerTracker } from '../Util/EventListenerTracker';
import { Controller } from './GamepadTypes';

/**
 * The class that handles the functionality of gamepads and controllers
 */
export class GamePadController {
    controllers: Array<Controller>;
    requestAnimationFrame: (callback: FrameRequestCallback) => number;
    toStreamerMessagesProvider: StreamMessageController;

    // Utility for keeping track of event handlers and unregistering them
    private gamePadEventListenerTracker = new EventListenerTracker();

    /**
     * @param toStreamerMessagesProvider - Stream message instance
     */
    constructor(toStreamerMessagesProvider: StreamMessageController) {
        this.toStreamerMessagesProvider = toStreamerMessagesProvider;

        this.requestAnimationFrame = (
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.requestAnimationFrame
        ).bind(window);
        const browserWindow = window as Window;
        if ('GamepadEvent' in browserWindow) {
            const onGamePadConnected = (ev: GamepadEvent) =>
                this.gamePadConnectHandler(ev);
            const onGamePadDisconnected = (ev: GamepadEvent) =>
                this.gamePadDisconnectHandler(ev);
            window.addEventListener('gamepadconnected', onGamePadConnected);
            window.addEventListener('gamepaddisconnected', onGamePadDisconnected);
            this.gamePadEventListenerTracker.addUnregisterCallback(
                () => window.removeEventListener('gamepadconnected', onGamePadConnected)
            );
            this.gamePadEventListenerTracker.addUnregisterCallback(
                () => window.removeEventListener('gamepaddisconnected', onGamePadDisconnected)
            );
        } else if ('WebKitGamepadEvent' in browserWindow) {
            const onWebkitGamePadConnected = (ev: GamepadEvent) => this.gamePadConnectHandler(ev);
            const onWebkitGamePadDisconnected = (ev: GamepadEvent) => this.gamePadDisconnectHandler(ev);
            window.addEventListener('webkitgamepadconnected', onWebkitGamePadConnected);
            window.addEventListener('webkitgamepaddisconnected', onWebkitGamePadDisconnected);
            this.gamePadEventListenerTracker.addUnregisterCallback(
                () => window.removeEventListener('webkitgamepadconnected', onWebkitGamePadConnected)
            );
            this.gamePadEventListenerTracker.addUnregisterCallback(
                () => window.removeEventListener('webkitgamepaddisconnected', onWebkitGamePadDisconnected)
            );
        }
        this.controllers = [];
        if (navigator.getGamepads) {
            for (const gamepad of navigator.getGamepads()) {
                if (gamepad) {
                    this.gamePadConnectHandler(new GamepadEvent('gamepadconnected', { gamepad }));
                }
            }
        }
    }

    /**
     * Unregisters all event handlers
     */
    unregisterGamePadEvents() {
        this.gamePadEventListenerTracker.unregisterAll();
        for(const controller of this.controllers) {
            if(controller.id !== undefined) {
                this.onGamepadDisconnected(controller.id);
            }
        }
        this.controllers = [];
        this.onGamepadConnected = () => { /* */ };
        this.onGamepadDisconnected = () => { /* */ };
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
            prevState: gamepad,
            id: undefined
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
        this.onGamepadConnected();
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
        const deletedController = this.controllers[gamePadEvent.gamepad.index];
        delete this.controllers[gamePadEvent.gamepad.index];
        this.controllers = this.controllers.filter(
            (controller) => controller !== undefined
        );
        this.onGamepadDisconnected(deletedController.id);
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
            // If we haven't received an id (possible if using an older version of UE), return to original functionality
            const controllerIndex = (controller.id === undefined) ? this.controllers.indexOf(controller) : controller.id;
            const currentState = controller.currentState;
            for (let i = 0; i < controller.currentState.buttons.length; i++) {
                const currentButton = controller.currentState.buttons[i];
                const previousButton = controller.prevState.buttons[i];
                if (currentButton.pressed) {
                    // press
                    if (i == gamepadLayout.LeftTrigger) {
                        //                       UEs left analog has a button index of 5
                        toStreamerHandlers.get('GamepadAnalog')([
                            controllerIndex,
                            5,
                            currentButton.value
                        ]);
                    } else if (i == gamepadLayout.RightTrigger) {
                        //                       UEs right analog has a button index of 6
                        toStreamerHandlers.get('GamepadAnalog')([
                            controllerIndex,
                            6,
                            currentButton.value
                        ]);
                    } else {
                        toStreamerHandlers.get('GamepadButtonPressed')([
                            controllerIndex,
                            i,
                            previousButton.pressed ? 1 : 0
                        ]);
                    }
                } else if (!currentButton.pressed && previousButton.pressed) {
                    // release
                    if (i == gamepadLayout.LeftTrigger) {
                        //                       UEs left analog has a button index of 5
                        toStreamerHandlers.get('GamepadAnalog')([
                            controllerIndex,
                            5,
                            0
                        ]);
                    } else if (i == gamepadLayout.RightTrigger) {
                        //                       UEs right analog has a button index of 6
                        toStreamerHandlers.get('GamepadAnalog')([
                            controllerIndex,
                            6,
                            0
                        ]);
                    } else {
                        toStreamerHandlers.get('GamepadButtonReleased')([
                            controllerIndex,
                            i
                        ]);
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
        if (this.controllers.length > 0) {
            this.requestAnimationFrame(() => this.updateStatus());
        }
    }

    onGamepadResponseReceived(gamepadId: number) {
        for(const controller of this.controllers) {
            if(controller.id === undefined) {
                controller.id = gamepadId;
                break;
            }
        }
    }

    /**
     * Event to send the gamepadconnected message to the application
     */
    onGamepadConnected() {
        // Default Functionality: Do Nothing
    }

    /**
     * Event to send the gamepaddisconnected message to the application
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onGamepadDisconnected(controllerIdx: number) {
        // Default Functionality: Do Nothing
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

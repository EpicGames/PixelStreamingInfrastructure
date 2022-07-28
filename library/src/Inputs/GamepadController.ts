import { DataChannelController } from "../DataChannel/DataChannelController";
import { Logger } from "../Logger/Logger";
import { UeInputGamePadMessage } from "../UeInstanceMessage/UeInputGamePadMessage"

/**
 * The class that handles the functionality of gamepads and controllers 
 */
export class GamePadController {
    ueInputGamePadMessage: UeInputGamePadMessage;
    controllers: Controller[];

    /**
     * @param dataChannelController - the data chanel controller  
     */
    constructor(dataChannelController: DataChannelController) {
        this.ueInputGamePadMessage = new UeInputGamePadMessage(dataChannelController);
        if ("GamepadEvent" in window) {
            window.addEventListener("gamepadconnected", (ev: GamepadEvent) => this.gamePadConnectHandler(ev));
            window.addEventListener("gamepaddisconnected", (ev: GamepadEvent) => this.gamePadDisconnectHandler(ev));
        } else if ("WebKitGamepadEvent" in window) {
            window.addEventListener("webkitgamepadconnected", (ev: GamepadEvent) => this.gamePadConnectHandler(ev));
            window.addEventListener("webkitgamepaddisconnected", (ev: GamepadEvent) => this.gamePadDisconnectHandler(ev));
        }
        this.controllers = [];
    }

    /**
     * Connects the gamepad handler 
     * @param gamePadEvent - the activating gamepad event 
     */
    gamePadConnectHandler(gamePadEvent: GamepadEvent) {
        Logger.Log(Logger.GetStackTrace(), "Gamepad connect handler", 6);
        let gamepad = gamePadEvent.gamepad;

        let temp: Controller = {
            currentState: gamepad,
            prevState: gamepad
        };

        this.controllers.push(temp);
        this.controllers[gamepad.index].currentState = gamepad;
        this.controllers[gamepad.index].prevState = gamepad;
        Logger.Log(Logger.GetStackTrace(), "gamepad: " + gamepad.id + " connected", 6);
        window.requestAnimationFrame(() => this.updateStatus());
    }

    /**
     * Disconnects the gamepad handler 
     * @param gamePadEvent - the activating gamepad event 
     */
    gamePadDisconnectHandler(gamePadEvent: GamepadEvent) {
        Logger.Log(Logger.GetStackTrace(), "Gamepad disconnect handler", 6);
        Logger.Log(Logger.GetStackTrace(), "gamepad: " + gamePadEvent.gamepad.id + " disconnected", 6);
        delete this.controllers[gamePadEvent.gamepad.index];
        this.controllers = this.controllers.filter(controller => controller !== undefined);
    }

    /**
     * Scan for connected gamepads 
     */
    scanGamePads() {
        var gamepads = ((navigator.getGamepads) ? navigator.getGamepads() : []);//  : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
        for (var i = 0; i < gamepads.length; i++) {
            if (gamepads[i] && (gamepads[i].index in this.controllers)) {
                this.controllers[gamepads[i].index].currentState = gamepads[i];
            }
        }
    }

    /**
     * Updates the status of the gamepad and sends the inputs  
     */
    updateStatus() {
        this.scanGamePads();
        // Iterate over multiple controllers in the case the multiple gamepads are connected

        for (let controller of this.controllers) {
            try {

                let currentState = controller.currentState;

                for (let i = 0; i < controller.currentState.buttons.length; i++) {
                    let currentButton = controller.currentState.buttons[i];
                    let previousButton = controller.prevState.buttons[i];

                    // Button 6 is actually the left trigger, send it to UE as an analog axis
                    // Button 7 is actually the right trigger, send it to UE as an analog axis
                    // The rest are normal buttons. Treat as such
                    if (currentButton.pressed && !previousButton.pressed) {
                        // New press
                        if (i == 6) {
                            this.ueInputGamePadMessage.sendControllerAxisMove(currentState.index, 5, currentButton.value);
                        } else if (i == 7) {
                            this.ueInputGamePadMessage.sendControllerAxisMove(currentState.index, 6, currentButton.value);
                        } else {
                            this.ueInputGamePadMessage.sendControllerButtonPressed(currentState.index, i, false);
                        }
                    } else if (!currentButton.pressed && previousButton.pressed) {
                        // release
                        if (i == 6) {
                            this.ueInputGamePadMessage.sendControllerAxisMove(currentState.index, 5, 0);
                        } else if (i == 7) {
                            this.ueInputGamePadMessage.sendControllerAxisMove(currentState.index, 6, 0);
                        } else {
                            this.ueInputGamePadMessage.sendControllerButtonReleased(currentState.index, i);
                        }
                    } else if (currentButton.pressed && previousButton.pressed) {
                        // repeat press / hold
                        if (i == 6) {
                            this.ueInputGamePadMessage.sendControllerAxisMove(currentState.index, 5, currentButton.value);
                        } else if (i == 7) {
                            this.ueInputGamePadMessage.sendControllerAxisMove(currentState.index, 6, currentButton.value);
                        } else {
                            this.ueInputGamePadMessage.sendControllerButtonPressed(currentState.index, i, true);
                        }
                    }
                    // Last case is button isn't currently pressed and wasn't pressed before. This doesn't need an else block
                }

                for (let i = 0; i < currentState.axes.length; i += 2) {
                    let x = parseFloat(currentState.axes[i].toFixed(4));
                    // https://w3c.github.io/gamepad/#remapping Gamepad browser side standard mapping has positive down, negative up. This is downright disgusting. So we fix it.
                    let y = -parseFloat(currentState.axes[i + 1].toFixed(4));
                    if (i === 0) {
                        // left stick
                        // axis 1 = left horizontal
                        this.ueInputGamePadMessage.sendControllerAxisMove(currentState.index, 1, x);
                        // axis 2 = left vertical
                        this.ueInputGamePadMessage.sendControllerAxisMove(currentState.index, 2, y);
                    } else if (i === 2) {
                        // right stick
                        // axis 3 = right horizontal
                        this.ueInputGamePadMessage.sendControllerAxisMove(currentState.index, 3, x);
                        // axis 4 = right vertical
                        this.ueInputGamePadMessage.sendControllerAxisMove(currentState.index, 4, y);
                    }
                }
                this.controllers[currentState.index].prevState = currentState;
            }
            catch (error) {
                Logger.Error(Logger.GetStackTrace(), "Oh dear the gamepad poll loop has thrown an error");
            }
        }
        window.requestAnimationFrame(() => this.updateStatus());

    }
}

/**
 * The interface for controllers 
 */
export interface Controller {
    currentState: Gamepad;
    prevState: Gamepad;
}
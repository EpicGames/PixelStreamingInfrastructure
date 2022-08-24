import { InstanceCommand } from "../DataChannel/DataChannelController";
import { Logger } from "../Logger/Logger";

export class CommandController {

    constructor() {

    }

    /**
     * Activate the logic associated with a command from UE
     * @param message 
     */
    onCommand(message: Uint16Array) {
        Logger.Log(Logger.GetStackTrace(), "DataChannelReceiveMessageType.Command", 6);
        let commandAsString = new TextDecoder("utf-16").decode(message.slice(1));
        
        Logger.Log(Logger.GetStackTrace(), "Data Channel Command: " + commandAsString, 6);
        let command: InstanceCommand = JSON.parse(commandAsString);
        if (command.command === "onScreenKeyboard") {
            //show on screen Keyboard;
        }

    }
}
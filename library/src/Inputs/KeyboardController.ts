import { SpecialKeyCodes } from "./SpecialKeyCodes";
import { Logger } from "../Logger/Logger";
import { IStreamMessageController } from "../UeInstanceMessage/IStreamMessageController";

/**
 * Handles the Keyboard Inputs for the document
 */
export class KeyboardController {

    toStreamerMessagesProvider: IStreamMessageController;
    suppressBrowserKeys: boolean;

    /**
     * 
     * @param toStreamerMessagesProvider - streamer messages provider
     * @param suppressBrowserKeys - Suppress Browser Keys
     */
    constructor(toStreamerMessagesProvider: IStreamMessageController, suppressBrowserKeys: boolean) {
        this.toStreamerMessagesProvider = toStreamerMessagesProvider;
        this.suppressBrowserKeys = suppressBrowserKeys;
    }

    /**
     * Registers document keyboard events with the controller
     */
    registerKeyBoardEvents() {
        document.onkeydown = (ev: KeyboardEvent) => this.handleOnKeyDown(ev);
        document.onkeyup = (ev: KeyboardEvent) => this.handleOnKeyUp(ev);

        //This has been deprecated as at Jun 13 2021
        document.onkeypress = (ev: KeyboardEvent) => this.handleOnKeyPress(ev);
    }

    /**
     * Handles When a key is down
     * @param keyboardEvent - Keyboard event 
     */
    handleOnKeyDown(keyboardEvent: KeyboardEvent) {
        Logger.Log(Logger.GetStackTrace(), "handleOnKeyDown", 6);
        let toStreamerHandlers = this.toStreamerMessagesProvider.getToStreamHandlersMap();
        toStreamerHandlers.get("KeyDown")("KeyDown", [this.getKeycode(keyboardEvent), keyboardEvent.repeat]);
        /* this needs to be tested but it is believed that this is not needed*/
        // backSpace is not considered a keypress in JavaScript but we need it
        // to be so characters may be deleted in a UE4 text entry field.
        if (keyboardEvent.keyCode === SpecialKeyCodes.backSpace) {
            //let temp: KeyboardEvent = {charCode: SpecialKeyCodes.backSpace};
            //document.onkeypress({ charCode: SpecialKeyCodes.backSpace });
        }

        if (this.suppressBrowserKeys && this.isKeyCodeBrowserKey(keyboardEvent.keyCode)) {
            keyboardEvent.preventDefault();
        }
    }

    /**
     * handles when a key is up
     * @param keyboardEvent - Keyboard event
     */
    handleOnKeyUp(keyboardEvent: KeyboardEvent) {
        Logger.Log(Logger.GetStackTrace(), "handleOnKeyUp", 6);
        let toStreamerHandlers = this.toStreamerMessagesProvider.getToStreamHandlersMap();
        toStreamerHandlers.get("KeyUp")("KeyUp", [this.getKeycode(keyboardEvent), keyboardEvent.repeat]);

        if (this.suppressBrowserKeys && this.isKeyCodeBrowserKey(keyboardEvent.keyCode)) {
            keyboardEvent.preventDefault();
        }
    }

    /**
     * Handles when a key is press
     * @param keyboard - Keyboard Event
     */
    handleOnKeyPress(keyboard: KeyboardEvent) {
        Logger.Log(Logger.GetStackTrace(), "handleOnkeypress", 6);
        let toStreamerHandlers = this.toStreamerMessagesProvider.getToStreamHandlersMap();
        toStreamerHandlers.get("KeyPress")("KeyPress", [keyboard.charCode]);
    }

    /**
     * Gets the Keycode of the Key pressed
     * @param keyboardEvent - Key board Event
     * @returns the key code of the Key
     */
    getKeycode(keyboardEvent: KeyboardEvent) {
        //Need to move this to a newer version using keyboard event location. as keyboardEvent.keycode is deprecated

        if (keyboardEvent.keyCode === SpecialKeyCodes.shift && keyboardEvent.code === 'ShiftRight') return SpecialKeyCodes.rightShift;
        else if (keyboardEvent.keyCode === SpecialKeyCodes.control && keyboardEvent.code === 'ControlRight') return SpecialKeyCodes.rightControl;
        else if (keyboardEvent.keyCode === SpecialKeyCodes.alt && keyboardEvent.code === 'AltRight') return SpecialKeyCodes.rightAlt;
        else return keyboardEvent.keyCode;
    }

    /**
     * Browser keys do not have a charCode so we only need to test keyCode.
     */
    isKeyCodeBrowserKey(keyCode: number) {
        // Function keys or tab key.
        return keyCode >= 112 && keyCode <= 123 || keyCode === 9;
    }
}
/* 5457524f4d4d */
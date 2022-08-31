import { DataChannelController } from "../DataChannel/DataChannelController";
import { FakeTouchController } from "./FakeTouchController";
import { KeyboardController } from "./KeyboardController";
import { MouseController } from "./MouseController";
import { ITouchController } from "./ITouchController";
import { TouchController } from "./TouchController";
import { GamePadController } from "./GamepadController";
import { ControlSchemeType } from "../Config/Config";
import { VideoPlayerMouseLockedEvents } from "../VideoPlayer/VideoPlayerMouseLockedEvents";
import { VideoPlayerMouseHoverEvents } from "../VideoPlayer/VideoPlayerMouseHoverEvents";
import { GyroController } from "./GyroController";
import { IVideoPlayer } from "../VideoPlayer/IVideoPlayer";
import { IVideoPlayerMouseInterface } from "../VideoPlayer/VideoPlayerMouseInterface";
import { Logger } from "../Logger/Logger";

/**
 * Class for handling inputs for mouse and keyboard   
 */
export class InputClassesFactory {

    dataChannelProvider: DataChannelController;
    

    constructor() { }

    /**
     * registers browser key events  
     * @param suppressBrowserKeys - option to suppress browser keys 
     */
    registerKeyBoard(suppressBrowserKeys: boolean) {
        Logger.Log(Logger.GetStackTrace(), "Register Keyboard Events", 7);
        let keyboardController = new KeyboardController(this.dataChannelController, suppressBrowserKeys);
        keyboardController.registerKeyBoardEvents();
        return keyboardController;
    }

    /**
     * register mouse events based on a control type 
     * @param controlScheme - if the mouse is either hovering or locked 
     */
    registerMouse(controlScheme: ControlSchemeType) {
        Logger.Log(Logger.GetStackTrace(), "Register Mouse Events", 7);

        // casting these as any as they do not have the moz attributes we require
        let videoElement = this.videoElementProvider.getVideoElement() as any;
        let videoInputBindings: IVideoPlayerMouseInterface;

        this.mouseController = new MouseController(this.dataChannelController, this.videoElementProvider);

        switch (controlScheme) {
            case ControlSchemeType.LockedMouse:

                videoInputBindings = new VideoPlayerMouseLockedEvents(this.videoElementProvider, this.mouseController);

                videoElement.onclick = (event: MouseEvent) => this.videoElementProvider.setClickActions(event);

                document.addEventListener('pointerlockchange', () => videoInputBindings.handleLockStateChange(), false);
                document.addEventListener('mozpointerlockchange', () => videoInputBindings.handleLockStateChange(), false);

                break
            case ControlSchemeType.HoveringMouse:
                videoInputBindings = new VideoPlayerMouseHoverEvents(this.mouseController);

                // set the onclick to null if the input bindings were previously set to pointerlock
                videoElement.onclick = null;

                document.onmousemove = (mouseEvent) => videoInputBindings.handleMouseMove(mouseEvent);
                document.onwheel = (mouseEvent) => videoInputBindings.handleMouseWheel(mouseEvent);

                videoElement.onmousedown = (mouseEvent: MouseEvent) => videoInputBindings.handleMouseDown(mouseEvent);
                videoElement.onmouseup = (mouseEvent: MouseEvent) => videoInputBindings.handleMouseUp(mouseEvent);

                break
            default:
                Logger.Info(Logger.GetStackTrace(), "unknown Control Scheme Type Defaulting to Locked Mouse Events");
                break
        }
    }

    /**
     * register touch events 
     * @param fakeMouseTouch - the faked mouse touch event 
     * @param playerElement - the player elements DOM 
     */
    registerTouch(fakeMouseTouch: boolean, playerElement: HTMLVideoElement) {
        Logger.Log(Logger.GetStackTrace(), "Registering Touch", 6);
        if (fakeMouseTouch) {
            this.touchController = new FakeTouchController(this.dataChannelController, (<HTMLVideoElement>playerElement.getElementsByTagName("video")[0]));
        } else {
            this.touchController = new TouchController(this.dataChannelController, playerElement, this.videoElementProvider);
        }
    }

    /**
     * registers a gamepad 
     */
    registerGamePad() {
        Logger.Log(Logger.GetStackTrace(), "Register Game Pad", 7);
        this.gamePadController = new GamePadController(this.dataChannelController);
    }

    /**
     * registers a gyro device 
     */
    registerGyro() {
        this.gyroController = new GyroController(this.dataChannelController);
    }

}
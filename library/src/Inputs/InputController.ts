import { DataChannelController } from "../DataChannel/DataChannelController";
import { FakeTouchController } from "./FakeTouchController";
import { KeyboardController } from "./KeyboardController";
import { MouseController } from "./MouseController";
import { ITouchController } from "./ITouchController";
import { TouchController } from "./TouchController";
import { GamePadController } from "./GamepadController";
import { ControlSchemeType } from "../Config/Config";
import { VideoPlayerController } from "../VideoPlayer/VideoPlayerController";
import { VideoPlayerMouseLockedEvents } from "../VideoPlayer/VideoPlayerMouseLockedEvents";
import { VideoPlayerMouseHoverEvents } from "../VideoPlayer/VideoPlayerMouseHoverEvents";
import { GyroController } from "./GyroController";

/**
 * Class for handling inputs for mouse and keyboard   
 */
export class InputController {

    dataChannelController: DataChannelController;
    keyboardController: KeyboardController;
    mouseController: MouseController;
    touchController: ITouchController
    fakeTouchController: FakeTouchController;
    gamePadController: GamePadController;
    gyroController: GyroController;

    /**
     * 
     * @param dataChannelController - the data channel controller
     */
    constructor(dataChannelController: DataChannelController) {
        this.dataChannelController = dataChannelController;
    }

    /**
     * registers browser key events  
     * @param suppressBrowserKeys - option to suppress browser keys 
     */
    registerKeyBoard(suppressBrowserKeys: boolean) {
        console.debug("Register Keyboard Events");
        this.keyboardController = new KeyboardController(this.dataChannelController, suppressBrowserKeys);
        this.keyboardController.registerKeyBoardEvents();
    }

    /**
     * register mouse events based on a control type 
     * @param controlScheme - if the mouse is either hovering or locked 
     * @param videoPlayerController - the video player controller 
     */
    registerMouse(controlScheme: ControlSchemeType, videoPlayerController: VideoPlayerController) {
        console.debug("Register Mouse Events");
        this.mouseController = new MouseController(this.dataChannelController);

        switch (controlScheme) {
            case ControlSchemeType.LockedMouse:
                videoPlayerController.videoInputBindings = new VideoPlayerMouseLockedEvents(videoPlayerController.videoElement, this.mouseController);

                videoPlayerController.videoElement.onclick = videoPlayerController.handleClick.bind(videoPlayerController);

                document.addEventListener('pointerlockchange', videoPlayerController.handleLockStateChange.bind(videoPlayerController), false);
                document.addEventListener('mozpointerlockchange', videoPlayerController.handleLockStateChange.bind(videoPlayerController), false);

                break
            case ControlSchemeType.HoveringMouse:
                videoPlayerController.videoInputBindings = new VideoPlayerMouseHoverEvents(this.mouseController);

                // set the onclick to null if the input bindings were previously set to pointerlock
                videoPlayerController.videoElement.onclick = null;

                document.onmousemove = videoPlayerController.videoInputBindings.handleMouseMove.bind(videoPlayerController.videoInputBindings);
                document.onwheel = videoPlayerController.videoInputBindings.handleMouseWheel.bind(videoPlayerController.videoInputBindings);

                videoPlayerController.videoElement.onmousedown = videoPlayerController.videoInputBindings.handleMouseDown.bind(videoPlayerController.videoInputBindings);
                videoPlayerController.videoElement.onmouseup = videoPlayerController.videoInputBindings.handleMouseUp.bind(videoPlayerController.videoInputBindings);

                break
            default:
                console.warn("unknown Control Scheme Type Defaulting to Locked Mouse Events");
                break
        }
    }

    /**
     * register touch events 
     * @param fakeMouseTouch - the faked mouse touch event 
     * @param playerElement - the player elements DOM 
     */
    registerTouch(fakeMouseTouch: boolean, playerElement: HTMLDivElement) {
        console.log("Registering Touch");
        if (fakeMouseTouch) {
            this.touchController = new FakeTouchController(this.dataChannelController, (<HTMLVideoElement>playerElement.getElementsByTagName("video")[0]));
        } else {
            this.touchController = new TouchController(this.dataChannelController, playerElement);
        }
    }

    /**
     * registers a gamepad 
     */
    registerGamePad() {
        console.debug("Register Game Pad");
        this.gamePadController = new GamePadController(this.dataChannelController);


    }

    /**
     * registers a gyro device 
     */
    registerGyro() {
        this.gyroController = new GyroController(this.dataChannelController);

    }

}
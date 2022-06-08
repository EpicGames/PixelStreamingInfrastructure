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
import { IVideoPlayer } from "../VideoPlayer/IVideoPlayer";
import { IVideoPlayerMouseInterface } from "../VideoPlayer/VideoPlayerMouseInterface";

/**
 * Class for handling inputs for mouse and keyboard   
 */
export class InputController {

    videoElementProvider: IVideoPlayer;
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
    constructor(dataChannelController: DataChannelController, videoElementProvider: IVideoPlayer) {
        this.dataChannelController = dataChannelController;
        this.videoElementProvider = videoElementProvider;
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

        // casting these as any as they do not have the moz attributes we require
        let videoElement = this.videoElementProvider.getVideoElement() as any;
        let videoInputBindings: IVideoPlayerMouseInterface;

        this.mouseController = new MouseController(this.dataChannelController, this.videoElementProvider);

        switch (controlScheme) {
            case ControlSchemeType.LockedMouse:

                videoInputBindings = new VideoPlayerMouseLockedEvents(this.videoElementProvider, this.mouseController);

                videoElement.onclick = (event: MouseEvent) => videoPlayerController.handleClick(event);

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
            this.touchController = new TouchController(this.dataChannelController, playerElement, this.videoElementProvider);
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
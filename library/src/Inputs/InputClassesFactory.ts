import { FakeTouchController } from "./FakeTouchController";
import { KeyboardController } from "./KeyboardController";
import { MouseController } from "./MouseController";
import { TouchController } from "./TouchController";
import { GamePadController } from "./GamepadController";
import { ControlSchemeType } from "../Config/Config";
import { VideoPlayerMouseLockedEvents } from "../VideoPlayer/VideoPlayerMouseLockedEvents";
import { VideoPlayerMouseHoverEvents } from "../VideoPlayer/VideoPlayerMouseHoverEvents";
import { GyroController } from "./GyroController";
import { IVideoPlayer } from "../VideoPlayer/IVideoPlayer";
import { IVideoPlayerMouseInterface } from "../VideoPlayer/VideoPlayerMouseInterface";
import { Logger } from "../Logger/Logger";
import { IStreamMessageController } from "../UeInstanceMessage/IStreamMessageController";

/**
 * Class for handling inputs for mouse and keyboard   
 */
export class InputClassesFactory {

    toStreamerMessagesProvider: IStreamMessageController;
    videoElementProvider: IVideoPlayer;

    constructor(toStreamerMessagesProvider: IStreamMessageController, videoElementProvider: IVideoPlayer) {
        this.toStreamerMessagesProvider = toStreamerMessagesProvider;
        this.videoElementProvider = videoElementProvider;
    }

    /**
     * registers browser key events  
     * @param suppressBrowserKeys - option to suppress browser keys 
     */
    registerKeyBoard(suppressBrowserKeys: boolean) {
        Logger.Log(Logger.GetStackTrace(), "Register Keyboard Events", 7);
        let keyboardController = new KeyboardController(this.toStreamerMessagesProvider, suppressBrowserKeys);
        keyboardController.registerKeyBoardEvents();
        return keyboardController;
    }

    /**
     * register mouse events based on a control type 
     * @param controlScheme - if the mouse is either hovering or locked 
     */
    registerMouse(controlScheme: ControlSchemeType) {
        Logger.Log(Logger.GetStackTrace(), "Register Mouse Events", 7);

        let videoElement = this.videoElementProvider.getVideoElement() as HTMLVideoElement;
        let videoElementParent = this.videoElementProvider.getVideoParentElement() as HTMLDivElement;
        let videoInputBindings: IVideoPlayerMouseInterface;
        let mouseController = new MouseController(this.toStreamerMessagesProvider, this.videoElementProvider);

        switch (controlScheme) {
            case ControlSchemeType.LockedMouse:

                videoInputBindings = new VideoPlayerMouseLockedEvents(this.videoElementProvider, mouseController);

                videoElement.onclick = (event: MouseEvent) => this.videoElementProvider.setClickActions(event);

                document.addEventListener('pointerlockchange', () => videoInputBindings.handleLockStateChange(), false);
                document.addEventListener('mozpointerlockchange', () => videoInputBindings.handleLockStateChange(), false);

                videoElementParent.onmousedown = (mouseEvent: MouseEvent) => videoInputBindings.handleMouseDown(mouseEvent);

                videoElementParent.onmouseup = (mouseEvent: MouseEvent) => videoInputBindings.handleMouseUp(mouseEvent);

                videoElementParent.onwheel = (wheelEvent: WheelEvent) => videoInputBindings.handleMouseWheel(wheelEvent);

                videoElementParent.ondblclick = (mouseEvent: MouseEvent) => videoInputBindings.handleMouseDouble(mouseEvent);

                videoElementParent.pressMouseButtons = (mouseEvent: MouseEvent) => videoInputBindings.handelPressMouseButtons(mouseEvent);

                videoElementParent.releaseMouseButtons = (mouseEvent: MouseEvent) => videoInputBindings.handelReleaseMouseButtons(mouseEvent);

                break
            case ControlSchemeType.HoveringMouse:
                videoInputBindings = new VideoPlayerMouseHoverEvents(mouseController);

                // set the onclick to null if the input bindings were previously set to pointerlock
                videoElement.onclick = null;

                videoElementParent.onmousemove = (mouseEvent: MouseEvent) => videoInputBindings.handleMouseMove(mouseEvent);

                videoElementParent.onmousedown = (mouseEvent: MouseEvent) => videoInputBindings.handleMouseDown(mouseEvent);

                videoElementParent.onmouseup = (mouseEvent: MouseEvent) => videoInputBindings.handleMouseUp(mouseEvent);

                videoElementParent.oncontextmenu = (mouseEvent: MouseEvent) => videoInputBindings.handleContextMenu(mouseEvent);

                videoElementParent.onwheel = (wheelEvent: WheelEvent) => videoInputBindings.handleMouseWheel(wheelEvent);

                videoElementParent.ondblclick = (mouseEvent: MouseEvent) => videoInputBindings.handleMouseDouble(mouseEvent);

                videoElementParent.pressMouseButtons = (mouseEvent: MouseEvent) => videoInputBindings.handelPressMouseButtons(mouseEvent);

                videoElementParent.releaseMouseButtons = (mouseEvent: MouseEvent) => videoInputBindings.handelReleaseMouseButtons(mouseEvent);

                break
            default:
                Logger.Info(Logger.GetStackTrace(), "unknown Control Scheme Type Defaulting to Locked Mouse Events");
                break
        }

        return mouseController;
    }

    /**
     * register touch events 
     * @param fakeMouseTouch - the faked mouse touch event 
     */
    registerTouch(fakeMouseTouch: boolean) {
        Logger.Log(Logger.GetStackTrace(), "Registering Touch", 6);
        if (fakeMouseTouch) {
            return new FakeTouchController(this.toStreamerMessagesProvider, this.videoElementProvider);
        } else {
            return new TouchController(this.toStreamerMessagesProvider, this.videoElementProvider);
        }
    }

    /**
     * registers a gamepad 
     */
    registerGamePad() {
        Logger.Log(Logger.GetStackTrace(), "Register Game Pad", 7);
        let gamePadController = new GamePadController(this.toStreamerMessagesProvider);
        return gamePadController;
    }

    /**
     * registers a gyro device 
     */
    registerGyro() {
        let gyroController = new GyroController(this.toStreamerMessagesProvider);
        return gyroController;
    }

}
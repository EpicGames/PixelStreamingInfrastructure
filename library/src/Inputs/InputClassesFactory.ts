import { FakeTouchController } from "./FakeTouchController";
import { KeyboardController } from "./KeyboardController";
import { MouseController } from "./MouseController";
import { TouchController } from "./TouchController";
import { GamePadController } from "./GamepadController";
import { ControlSchemeType } from "../Config/Config";
import { LockedMouseEvents } from "./LockedMouseEvents";
import { HoveringMouseEvents } from "./HoveringMouseEvents";
import { GyroController } from "./GyroController";
import { IVideoPlayer } from "../VideoPlayer/IVideoPlayer";
import { IMouseEvents } from "./IMouseEvents";
import { Logger } from "../Logger/Logger";
import { IStreamMessageController } from "../UeInstanceMessage/IStreamMessageController";
import { NormalizeAndQuantize } from "../NormalizeAndQuantize/NormalizeAndQuantize";

/**
 * Class for handling inputs for mouse and keyboard   
 */
export class InputClassesFactory {

    toStreamerMessagesProvider: IStreamMessageController;
    videoElementProvider: IVideoPlayer;
    normalizeAndQuantize: NormalizeAndQuantize;
    activeKeys: IActiveKeys = new ActiveKeys();

    constructor(toStreamerMessagesProvider: IStreamMessageController, videoElementProvider: IVideoPlayer, normalizeAndQuantize: NormalizeAndQuantize) {
        this.toStreamerMessagesProvider = toStreamerMessagesProvider;
        this.videoElementProvider = videoElementProvider;
        this.normalizeAndQuantize = normalizeAndQuantize;
    }

    /**
     * registers browser key events  
     * @param suppressBrowserKeys - option to suppress browser keys 
     */
    registerKeyBoard(suppressBrowserKeys: boolean) {
        Logger.Log(Logger.GetStackTrace(), "Register Keyboard Events", 7);
        let keyboardController = new KeyboardController(this.toStreamerMessagesProvider, suppressBrowserKeys, this.activeKeys);
        keyboardController.registerKeyBoardEvents();
        return keyboardController;
    }

    /**
     * register mouse events based on a control type 
     * @param controlScheme - if the mouse is either hovering or locked 
     */
    registerMouse(controlScheme: ControlSchemeType) {
        Logger.Log(Logger.GetStackTrace(), "Register Mouse Events", 7);
        let mouseController = new MouseController(this.toStreamerMessagesProvider, this.videoElementProvider, this.normalizeAndQuantize);
        mouseController.clearMouseEvents();

        switch (controlScheme) {
            case ControlSchemeType.LockedMouse:
                this.registerLockedMouseEvents(mouseController);
                break
            case ControlSchemeType.HoveringMouse:
                this.registerHoveringMouseEvents(mouseController);
                break
            default:
                Logger.Info(Logger.GetStackTrace(), "unknown Control Scheme Type Defaulting to Locked Mouse Events");
                this.registerLockedMouseEvents(mouseController);
                break
        }

        return mouseController;
    }

    registerLockedMouseEvents(mouseController: MouseController) {
        let videoElement = this.videoElementProvider.getVideoElement() as HTMLVideoElement;
        let videoElementParent = this.videoElementProvider.getVideoParentElement() as HTMLDivElement;
        let lockedMouseEvents: IMouseEvents = new LockedMouseEvents(this.videoElementProvider, mouseController, this.activeKeys);

        videoElementParent.requestPointerLock = videoElementParent.requestPointerLock || videoElementParent.mozRequestPointerLock;
        document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;

        // minor hack to alleviate ios not supporting pointerlock
        if (videoElementParent.requestPointerLock) {
            videoElementParent.onclick = function () {
                videoElementParent.requestPointerLock();
            };
        }

        videoElement.onclick = (event: MouseEvent) => this.videoElementProvider.setClickActions(event);

        document.addEventListener('pointerlockchange', () => lockedMouseEvents.lockStateChange(), false);
        document.addEventListener('mozpointerlockchange', () => lockedMouseEvents.lockStateChange(), false);

        videoElementParent.onmousedown = (mouseEvent: MouseEvent) => lockedMouseEvents.handleMouseDown(mouseEvent);
        videoElementParent.onmouseup = (mouseEvent: MouseEvent) => lockedMouseEvents.handleMouseUp(mouseEvent);
        videoElementParent.onwheel = (wheelEvent: WheelEvent) => lockedMouseEvents.handleMouseWheel(wheelEvent);
        videoElementParent.ondblclick = (mouseEvent: MouseEvent) => lockedMouseEvents.handleMouseDouble(mouseEvent);
        videoElementParent.pressMouseButtons = (mouseEvent: MouseEvent) => lockedMouseEvents.handelPressMouseButtons(mouseEvent);
        videoElementParent.releaseMouseButtons = (mouseEvent: MouseEvent) => lockedMouseEvents.handelReleaseMouseButtons(mouseEvent);

    }

    registerHoveringMouseEvents(mouseController: MouseController) {
        let videoElement = this.videoElementProvider.getVideoElement() as HTMLVideoElement;
        let videoElementParent = this.videoElementProvider.getVideoParentElement() as HTMLDivElement;
        let hoveringMouseEvents = new HoveringMouseEvents(mouseController);

        // set the onclick to null if the input bindings were previously set to pointerlock
        videoElement.onclick = null;
        videoElementParent.onmousemove = (mouseEvent: MouseEvent) => hoveringMouseEvents.updateMouseMovePosition(mouseEvent);
        videoElementParent.onmousedown = (mouseEvent: MouseEvent) => hoveringMouseEvents.handleMouseDown(mouseEvent);
        videoElementParent.onmouseup = (mouseEvent: MouseEvent) => hoveringMouseEvents.handleMouseUp(mouseEvent);
        videoElementParent.oncontextmenu = (mouseEvent: MouseEvent) => hoveringMouseEvents.handleContextMenu(mouseEvent);
        videoElementParent.onwheel = (wheelEvent: WheelEvent) => hoveringMouseEvents.handleMouseWheel(wheelEvent);
        videoElementParent.ondblclick = (mouseEvent: MouseEvent) => hoveringMouseEvents.handleMouseDouble(mouseEvent);
        videoElementParent.pressMouseButtons = (mouseEvent: MouseEvent) => hoveringMouseEvents.handelPressMouseButtons(mouseEvent);
        videoElementParent.releaseMouseButtons = (mouseEvent: MouseEvent) => hoveringMouseEvents.handelReleaseMouseButtons(mouseEvent);
    }

    /**
     * register touch events 
     * @param fakeMouseTouch - the faked mouse touch event 
     */
    registerTouch(fakeMouseTouch: boolean, videoElementParentClientRect: DOMRect) {
        Logger.Log(Logger.GetStackTrace(), "Registering Touch", 6);
        if (fakeMouseTouch) {
            let fakeTouchController = new FakeTouchController(this.toStreamerMessagesProvider, this.videoElementProvider, this.normalizeAndQuantize);
            fakeTouchController.setvideoElementParentClientRect(videoElementParentClientRect);
            return fakeTouchController;
        } else {
            return new TouchController(this.toStreamerMessagesProvider, this.videoElementProvider, this.normalizeAndQuantize);
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

export interface IActiveKeys {
    getActiveKeys(): Array<any>;
}

export class ActiveKeys implements IActiveKeys {
    activeKeys: Array<any> = [];
    constructor() {
        this.activeKeys = new Array();
    }
    getActiveKeys(): any[] {
        return this.activeKeys;
    }
}


// Copyright Epic Games, Inc. All Rights Reserved.

import { FakeTouchController } from './FakeTouchController';
import { KeyboardController } from './KeyboardController';
import { MouseController } from './MouseController';
import { TouchController } from './TouchController';
import { GamePadController } from './GamepadController';
import { Config, ControlSchemeType } from '../Config/Config';
import { Logger } from '../Logger/Logger';
import { CoordinateConverter } from '../Util/CoordinateConverter';
import { StreamMessageController } from '../UeInstanceMessage/StreamMessageController';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';

/**
 * Class for making and setting up input class types
 */
export class InputClassesFactory {
    toStreamerMessagesProvider: StreamMessageController;
    videoElementProvider: VideoPlayer;
    coordinateConverter: CoordinateConverter;
    activeKeys: ActiveKeys = new ActiveKeys();

    /**
     * @param toStreamerMessagesProvider - Stream message instance
     * @param videoElementProvider - Video Player instance
     * @param coordinateConverter - A coordinateConverter instance
     */
    constructor(
        toStreamerMessagesProvider: StreamMessageController,
        videoElementProvider: VideoPlayer,
        coordinateConverter: CoordinateConverter
    ) {
        this.toStreamerMessagesProvider = toStreamerMessagesProvider;
        this.videoElementProvider = videoElementProvider;
        this.coordinateConverter = coordinateConverter;
    }

    /**
     * Registers browser key events.
     */
    registerKeyBoard(config: Config) {
        Logger.Log(Logger.GetStackTrace(), 'Register Keyboard Events', 7);
        const keyboardController = new KeyboardController(
            this.toStreamerMessagesProvider,
            config,
            this.activeKeys
        );
        keyboardController.registerKeyBoardEvents();
        return keyboardController;
    }

    /**
     * register mouse events based on a control type
     * @param controlScheme - if the mouse is either hovering or locked
     */
    registerMouse(controlScheme: ControlSchemeType) {
        Logger.Log(Logger.GetStackTrace(), 'Register Mouse Events', 7);
        const mouseController = new MouseController(
            this.toStreamerMessagesProvider,
            this.videoElementProvider,
            this.coordinateConverter,
            this.activeKeys
        );

        switch (controlScheme) {
            case ControlSchemeType.LockedMouse:
                mouseController.registerLockedMouseEvents(mouseController);
                break;
            case ControlSchemeType.HoveringMouse:
                mouseController.registerHoveringMouseEvents(mouseController);
                break;
            default:
                Logger.Info(
                    Logger.GetStackTrace(),
                    'unknown Control Scheme Type Defaulting to Locked Mouse Events'
                );
                mouseController.registerLockedMouseEvents(mouseController);
                break;
        }

        return mouseController;
    }

    /**
     * register touch events
     * @param fakeMouseTouch - the faked mouse touch event
     */
    registerTouch(
        fakeMouseTouch: boolean,
        videoElementParentClientRect: DOMRect
    ) {
        Logger.Log(Logger.GetStackTrace(), 'Registering Touch', 6);
        if (fakeMouseTouch) {
            const fakeTouchController = new FakeTouchController(
                this.toStreamerMessagesProvider,
                this.videoElementProvider,
                this.coordinateConverter
            );
            fakeTouchController.setVideoElementParentClientRect(
                videoElementParentClientRect
            );
            return fakeTouchController;
        } else {
            return new TouchController(
                this.toStreamerMessagesProvider,
                this.videoElementProvider,
                this.coordinateConverter
            );
        }
    }

    /**
     * registers a gamepad
     */
    registerGamePad() {
        Logger.Log(Logger.GetStackTrace(), 'Register Game Pad', 7);
        const gamePadController = new GamePadController(
            this.toStreamerMessagesProvider
        );
        return gamePadController;
    }
}

/**
 * A class that keeps track of current active keys
 */
export class ActiveKeys {
    activeKeys: Array<number> = [];
    constructor() {
        this.activeKeys = [];
    }

    /**
     * Get the current array of active keys
     * @returns - an array of active keys
     */
    getActiveKeys(): number[] {
        return this.activeKeys;
    }
}

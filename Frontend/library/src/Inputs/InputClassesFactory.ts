// Copyright Epic Games, Inc. All Rights Reserved.

import { KeyboardController } from './KeyboardController';
import { MouseController } from './MouseController';
import { MouseControllerLocked } from './MouseControllerLocked';
import { MouseControllerHovering } from './MouseControllerHovering';
import { TouchController } from './TouchController';
import { TouchControllerFake } from './TouchControllerFake';
import { GamepadController } from './GamepadController';
import { Config, ControlSchemeType } from '../Config/Config';
import { Logger } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.8';
import { InputCoordTranslator } from '../Util/InputCoordTranslator';
import { StreamMessageController } from '../UeInstanceMessage/StreamMessageController';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
import { IInputController } from './IInputController';

/**
 * Class for making and setting up input class types
 */
export class InputClassesFactory {
    toStreamerMessagesProvider: StreamMessageController;
    videoElementProvider: VideoPlayer;
    coordinateConverter: InputCoordTranslator;
    activeKeys: ActiveKeys = new ActiveKeys();

    /**
     * @param toStreamerMessagesProvider - Stream message instance
     * @param videoElementProvider - Video Player instance
     * @param coordinateConverter - A coordinateConverter instance
     */
    constructor(
        toStreamerMessagesProvider: StreamMessageController,
        videoElementProvider: VideoPlayer,
        coordinateConverter: InputCoordTranslator
    ) {
        this.toStreamerMessagesProvider = toStreamerMessagesProvider;
        this.videoElementProvider = videoElementProvider;
        this.coordinateConverter = coordinateConverter;
    }

    /**
     * Registers browser key events.
     */
    registerKeyBoard(config: Config) {
        Logger.Info('Register Keyboard Events');
        const keyboardController = new KeyboardController(
            this.toStreamerMessagesProvider,
            config,
            this.activeKeys
        );
        keyboardController.register();
        return keyboardController;
    }

    /**
     * register mouse events based on a control type
     * @param controlScheme - if the mouse is either hovering or locked
     */
    registerMouse(controlScheme: ControlSchemeType, config: Config) {
        Logger.Info('Register Mouse Events');
        let mouseController: MouseController;
        if (controlScheme == ControlSchemeType.HoveringMouse) {
            mouseController = new MouseControllerHovering(
                this.toStreamerMessagesProvider,
                this.videoElementProvider,
                this.coordinateConverter,
                this.activeKeys,
                config
            );
        } else {
            mouseController = new MouseControllerLocked(
                this.toStreamerMessagesProvider,
                this.videoElementProvider,
                this.coordinateConverter,
                this.activeKeys,
                config
            );
        }

        mouseController.register();
        return mouseController;
    }

    /**
     * register touch events
     * @param fakeMouseTouch - the faked mouse touch event
     */
    registerTouch(fakeMouseTouch: boolean) {
        Logger.Info('Registering Touch');
        let touchController: IInputController;
        if (fakeMouseTouch) {
            touchController = new TouchControllerFake(
                this.toStreamerMessagesProvider,
                this.videoElementProvider,
                this.coordinateConverter
            );
        } else {
            touchController = new TouchController(
                this.toStreamerMessagesProvider,
                this.videoElementProvider,
                this.coordinateConverter
            );
        }
        touchController.register();
        return touchController;
    }

    /**
     * registers a gamepad
     */
    registerGamePad() {
        Logger.Info('Register Game Pad');
        const gamepadController = new GamepadController(this.toStreamerMessagesProvider);
        gamepadController.register();
        return gamepadController;
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

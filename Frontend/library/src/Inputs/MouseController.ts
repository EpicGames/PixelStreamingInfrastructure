// Copyright Epic Games, Inc. All Rights Reserved.
import { MouseButtonsMask, MouseButton } from './MouseButtons';
import { StreamMessageController } from '../UeInstanceMessage/StreamMessageController';
import { InputCoordTranslator } from '../Util/InputCoordTranslator';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
import type { ActiveKeys } from './InputClassesFactory';
import { IInputController } from './IInputController';
import { Config } from '../Config/Config';

/**
 * Extra types for Document and WheelEvent
 */
declare global {
    interface Document {
        mozPointerLockElement: unknown;
        mozExitPointerLock?(): void;
    }

    interface WheelEvent {
        wheelDelta: number;
    }
}

/**
 * The base class for mouse controllers. Since there is a bunch of shared behaviour between locked and
 * hover mouse controllers this is where that shared behaviour lives.
 */
export class MouseController implements IInputController {
    videoPlayer: VideoPlayer;
    streamMessageController: StreamMessageController;
    coordinateConverter: InputCoordTranslator;
    activeKeys: ActiveKeys;
    config: Config;

    // bound listeners
    onEnterListener: (event: MouseEvent) => void;
    onLeaveListener: (event: MouseEvent) => void;

    constructor(
        streamMessageController: StreamMessageController,
        videoPlayer: VideoPlayer,
        coordinateConverter: InputCoordTranslator,
        activeKeys: ActiveKeys,
        config: Config
    ) {
        this.streamMessageController = streamMessageController;
        this.coordinateConverter = coordinateConverter;
        this.videoPlayer = videoPlayer;
        this.activeKeys = activeKeys;
        this.config = config;

        this.onEnterListener = this.onMouseEnter.bind(this);
        this.onLeaveListener = this.onMouseLeave.bind(this);
    }

    register() {
        this.registerMouseEnterAndLeaveEvents();
    }

    unregister() {
        this.unregisterMouseEnterAndLeaveEvents();
    }

    registerMouseEnterAndLeaveEvents() {
        const videoElementParent = this.videoPlayer.getVideoParentElement();
        videoElementParent?.addEventListener('mouseenter', this.onEnterListener);
        videoElementParent?.addEventListener('mouseleave', this.onLeaveListener);
    }

    unregisterMouseEnterAndLeaveEvents() {
        const videoElementParent = this.videoPlayer.getVideoParentElement();
        videoElementParent?.removeEventListener('mouseenter', this.onEnterListener);
        videoElementParent?.removeEventListener('mouseleave', this.onLeaveListener);
    }

    private onMouseEnter(event: MouseEvent) {
        if (!this.videoPlayer.isVideoReady()) {
            return;
        }
        this.streamMessageController.toStreamerHandlers.get('MouseEnter')?.();
        this.pressMouseButtons(event.buttons, event.x, event.y);
    }

    private onMouseLeave(event: MouseEvent) {
        if (!this.videoPlayer.isVideoReady()) {
            return;
        }
        this.streamMessageController.toStreamerHandlers.get('MouseLeave')?.();
        this.releaseMouseButtons(event.buttons, event.x, event.y);
    }

    private releaseMouseButtons(buttons: number, X: number, Y: number) {
        const coord = this.coordinateConverter.translateUnsigned(X, Y);
        if (buttons & MouseButtonsMask.primaryButton) {
            this.sendMouseUp(MouseButton.mainButton, coord.x, coord.y);
        }
        if (buttons & MouseButtonsMask.secondaryButton) {
            this.sendMouseUp(MouseButton.secondaryButton, coord.x, coord.y);
        }
        if (buttons & MouseButtonsMask.auxiliaryButton) {
            this.sendMouseUp(MouseButton.auxiliaryButton, coord.x, coord.y);
        }
        if (buttons & MouseButtonsMask.fourthButton) {
            this.sendMouseUp(MouseButton.fourthButton, coord.x, coord.y);
        }
        if (buttons & MouseButtonsMask.fifthButton) {
            this.sendMouseUp(MouseButton.fifthButton, coord.x, coord.y);
        }
    }

    private pressMouseButtons(buttons: number, X: number, Y: number) {
        if (!this.videoPlayer.isVideoReady()) {
            return;
        }
        const coord = this.coordinateConverter.translateUnsigned(X, Y);
        if (buttons & MouseButtonsMask.primaryButton) {
            this.sendMouseDown(MouseButton.mainButton, coord.x, coord.y);
        }
        if (buttons & MouseButtonsMask.secondaryButton) {
            this.sendMouseDown(MouseButton.secondaryButton, coord.x, coord.y);
        }
        if (buttons & MouseButtonsMask.auxiliaryButton) {
            this.sendMouseDown(MouseButton.auxiliaryButton, coord.x, coord.y);
        }
        if (buttons & MouseButtonsMask.fourthButton) {
            this.sendMouseDown(MouseButton.fourthButton, coord.x, coord.y);
        }
        if (buttons & MouseButtonsMask.fifthButton) {
            this.sendMouseDown(MouseButton.fifthButton, coord.x, coord.y);
        }
    }

    private sendMouseDown(button: number, X: number, Y: number) {
        this.streamMessageController.toStreamerHandlers.get('MouseDown')?.([button, X, Y]);
    }

    // x and y are already translated by the caller; translating them again sends an off-screen point.
    private sendMouseUp(button: number, x: number, y: number) {
        this.streamMessageController.toStreamerHandlers.get('MouseUp')?.([button, x, y]);
    }
}

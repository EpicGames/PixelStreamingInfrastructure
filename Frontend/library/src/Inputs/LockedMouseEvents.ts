// Copyright Epic Games, Inc. All Rights Reserved.

import { MouseController } from './MouseController';
import { Logger } from '../Logger/Logger';
import { IMouseEvents } from './IMouseEvents';
import { NormalizedQuantizedUnsignedCoord } from '../Util/CoordinateConverter';
import { ActiveKeys } from './InputClassesFactory';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
import { EventListenerTracker } from '../Util/EventListenerTracker';

/**
 * Handle the mouse locked events
 */
export class LockedMouseEvents implements IMouseEvents {
    x = 0;
    y = 0;
    coord: NormalizedQuantizedUnsignedCoord;
    videoElementProvider: VideoPlayer;
    mouseController: MouseController;
    activeKeysProvider: ActiveKeys;
    updateMouseMovePositionEvent = (mouseEvent: MouseEvent) => {
        this.updateMouseMovePosition(mouseEvent);
    };

    // Utility for keeping track of event handlers and unregistering them
    private mouseEventListenerTracker = new EventListenerTracker();

    /**
     * @param videoElementProvider - Video Player instance
     * @param mouseController - Mouse controller instance
     * @param activeKeysProvider - Active keys provider instance
     * @param playerStyleAttributesProvider - Player style attributes instance
     */
    constructor(
        videoElementProvider: VideoPlayer,
        mouseController: MouseController,
        activeKeysProvider: ActiveKeys
    ) {
        this.videoElementProvider = videoElementProvider;
        this.mouseController = mouseController;
        this.activeKeysProvider = activeKeysProvider;
        const videoElementParent =
            this.videoElementProvider.getVideoParentElement();
        this.x = videoElementParent.getBoundingClientRect().width / 2;
        this.y = videoElementParent.getBoundingClientRect().height / 2;
        this.coord =
            this.mouseController.coordinateConverter.normalizeAndQuantizeUnsigned(
                this.x,
                this.y
            );
    }

    /**
     * Unregisters all event handlers
     */
    unregisterMouseEvents() {
        this.mouseEventListenerTracker.unregisterAll();
    }

    /**
     * Handle when the locked state Changed
     */
    lockStateChange() {
        const videoElementParent =
            this.videoElementProvider.getVideoParentElement();
        const toStreamerHandlers =
            this.mouseController.toStreamerMessagesProvider.toStreamerHandlers;

        if (
            document.pointerLockElement === videoElementParent ||
            document.mozPointerLockElement === videoElementParent
        ) {
            Logger.Log(Logger.GetStackTrace(), 'Pointer locked', 6);
            document.addEventListener(
                'mousemove',
                this.updateMouseMovePositionEvent,
                false
            );
            this.mouseEventListenerTracker.addUnregisterCallback(
                () => document.removeEventListener(
                    'mousemove',
                    this.updateMouseMovePositionEvent,
                    false
                )
            );
        } else {
            Logger.Log(
                Logger.GetStackTrace(),
                'The pointer lock status is now unlocked',
                6
            );
            // !a new arrow function must not be used here as it will be counted as a new function that cannot be removed
            document.removeEventListener(
                'mousemove',
                this.updateMouseMovePositionEvent,
                false
            );

            // If mouse loses focus, send a key up for all of the currently held-down keys
            // This is necessary as when the mouse loses focus, the windows stops listening for events and as such
            // the keyup listener won't get fired
            let activeKeys = this.activeKeysProvider.getActiveKeys();
            const setKeys = new Set(activeKeys);
            const newKeysIterable: Array<number> = [];

            setKeys.forEach((setKey: number) => {
                newKeysIterable[setKey];
            });

            newKeysIterable.forEach((uniqueKeycode) => {
                toStreamerHandlers.get('KeyUp')([uniqueKeycode]);
            });
            // Reset the active keys back to nothing
            activeKeys = [];
        }
    }

    /**
     * Handle the mouse move event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    updateMouseMovePosition(mouseEvent: MouseEvent) {
        if (!this.videoElementProvider.isVideoReady()) {
            return;
        }
        const toStreamerHandlers =
            this.mouseController.toStreamerMessagesProvider.toStreamerHandlers;
        const styleWidth =
            this.videoElementProvider.getVideoParentElement().clientWidth;
        const styleHeight =
            this.videoElementProvider.getVideoParentElement().clientHeight;

        this.x += mouseEvent.movementX;
        this.y += mouseEvent.movementY;

        if (this.x > styleWidth) {
            this.x -= styleWidth;
        }
        if (this.y > styleHeight) {
            this.y -= styleHeight;
        }
        if (this.x < 0) {
            this.x = styleWidth + this.x;
        }
        if (this.y < 0) {
            this.y = styleHeight - this.y;
        }

        this.coord =
            this.mouseController.coordinateConverter.normalizeAndQuantizeUnsigned(
                this.x,
                this.y
            );
        const delta =
            this.mouseController.coordinateConverter.normalizeAndQuantizeSigned(
                mouseEvent.movementX,
                mouseEvent.movementY
            );
        toStreamerHandlers.get('MouseMove')([
            this.coord.x,
            this.coord.y,
            delta.x,
            delta.y
        ]);
    }

    /**
     * Handle the mouse Down event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handleMouseDown(mouseEvent: MouseEvent) {
        if (!this.videoElementProvider.isVideoReady()) {
            return;
        }

        const toStreamerHandlers =
            this.mouseController.toStreamerMessagesProvider.toStreamerHandlers;
        toStreamerHandlers.get('MouseDown')([
            mouseEvent.button,
            // We use the store value of this.coord as opposed to the mouseEvent.x/y as the mouseEvent location
            // uses the system cursor location which hasn't moved
            this.coord.x,
            this.coord.y
        ]);
    }

    /**
     * Handle the mouse Up event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handleMouseUp(mouseEvent: MouseEvent) {
        if (!this.videoElementProvider.isVideoReady()) {
            return;
        }
        const toStreamerHandlers =
            this.mouseController.toStreamerMessagesProvider.toStreamerHandlers;
        toStreamerHandlers.get('MouseUp')([
            mouseEvent.button,
            // We use the store value of this.coord as opposed to the mouseEvent.x/y as the mouseEvent location
            // uses the system cursor location which hasn't moved
            this.coord.x,
            this.coord.y
        ]);
    }

    /**
     * Handle the mouse wheel event, sends the mouse wheel data to the UE Instance
     * @param wheelEvent - Mouse Event
     */
    handleMouseWheel(wheelEvent: WheelEvent) {
        if (!this.videoElementProvider.isVideoReady()) {
            return;
        }
        const toStreamerHandlers =
            this.mouseController.toStreamerMessagesProvider.toStreamerHandlers;
        toStreamerHandlers.get('MouseWheel')([
            wheelEvent.wheelDelta,
            // We use the store value of this.coord as opposed to the mouseEvent.x/y as the mouseEvent location
            // uses the system cursor location which hasn't moved
            this.coord.x,
            this.coord.y
        ]);
    }

    /**
     * Handle the mouse double click event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handleMouseDouble(mouseEvent: MouseEvent) {
        if (!this.videoElementProvider.isVideoReady()) {
            return;
        }
        const toStreamerHandlers =
            this.mouseController.toStreamerMessagesProvider.toStreamerHandlers;
        toStreamerHandlers.get('MouseDouble')([
            mouseEvent.button,
            // We use the store value of this.coord as opposed to the mouseEvent.x/y as the mouseEvent location
            // uses the system cursor location which hasn't moved
            this.coord.x,
            this.coord.y
        ]);
    }

    /**
     * Handle the press mouse buttons event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handlePressMouseButtons(mouseEvent: MouseEvent) {
        if (!this.videoElementProvider.isVideoReady()) {
            return;
        }
        this.mouseController.pressMouseButtons(
            mouseEvent.buttons,
            this.x,
            this.y
        );
    }

    /**
     * Handle the release mouse buttons event, sends the mouse data to the UE Instance
     * @param mouseEvent - Mouse Event
     */
    handleReleaseMouseButtons(mouseEvent: MouseEvent) {
        if (!this.videoElementProvider.isVideoReady()) {
            return;
        }
        this.mouseController.releaseMouseButtons(
            mouseEvent.buttons,
            this.x,
            this.y
        );
    }
}

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

// Copyright Epic Games, Inc. All Rights Reserved.

import { MouseButtonsMask, MouseButton } from './MouseButtons';
import { Logger } from '../Logger/Logger';
import { StreamMessageController } from '../UeInstanceMessage/StreamMessageController';
import { CoordinateConverter } from '../Util/CoordinateConverter';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
import { IMouseEvents } from './IMouseEvents';
import { LockedMouseEvents } from './LockedMouseEvents';
import { HoveringMouseEvents } from './HoveringMouseEvents';
import type { ActiveKeys } from './InputClassesFactory';
import { EventListenerTracker } from '../Util/EventListenerTracker';

/**
 * Handles the Mouse Inputs for the document
 */
export class MouseController {
    videoElementProvider: VideoPlayer;
    toStreamerMessagesProvider: StreamMessageController;
    coordinateConverter: CoordinateConverter;
    activeKeysProvider: ActiveKeys;

    // Utility for keeping track of event handlers and unregistering them
    private mouseEventListenerTracker = new EventListenerTracker();

    /**
     * @param toStreamerMessagesProvider - Stream message instance
     * @param videoElementProvider - Video Player instance
     * @param normalizeAndQuantize - A normalize and quantize instance
     */
    constructor(
        toStreamerMessagesProvider: StreamMessageController,
        videoElementProvider: VideoPlayer,
        coordinateConverter: CoordinateConverter,
        activeKeysProvider: ActiveKeys
    ) {
        this.toStreamerMessagesProvider = toStreamerMessagesProvider;
        this.coordinateConverter = coordinateConverter;
        this.videoElementProvider = videoElementProvider;
        this.activeKeysProvider = activeKeysProvider;
        this.registerMouseEnterAndLeaveEvents();
    }

    /**
     * Clears all the click events on the current video element parent div
     */
    unregisterMouseEvents() {
        this.mouseEventListenerTracker.unregisterAll();
    }

    /**
     * Register a locked mouse class
     * @param mouseController - a mouse controller instance
     * @param playerStyleAttributesProvider - a player style attributes instance
     */
    registerLockedMouseEvents(mouseController: MouseController) {
        const videoElementParent =
            this.videoElementProvider.getVideoParentElement() as HTMLDivElement;
        const lockedMouseEvents: IMouseEvents = new LockedMouseEvents(
            this.videoElementProvider,
            mouseController,
            this.activeKeysProvider
        );

        videoElementParent.requestPointerLock =
            videoElementParent.requestPointerLock ||
            videoElementParent.mozRequestPointerLock;
        document.exitPointerLock =
            document.exitPointerLock || document.mozExitPointerLock;

        // minor hack to alleviate ios not supporting pointerlock
        if (videoElementParent.requestPointerLock) {
            const onclick = () => {
                videoElementParent.requestPointerLock();
            };
            videoElementParent.addEventListener('click', onclick);
            this.mouseEventListenerTracker.addUnregisterCallback(
                () => videoElementParent.removeEventListener('click', onclick)
            );
        }

        const lockStateChangeListener = () =>
            lockedMouseEvents.lockStateChange();
        document.addEventListener(
            'pointerlockchange',
            lockStateChangeListener,
            false
        );
        document.addEventListener(
            'mozpointerlockchange',
            lockStateChangeListener,
            false
        );
        this.mouseEventListenerTracker.addUnregisterCallback(
            () => document.removeEventListener(
                'pointerlockchange',
                lockStateChangeListener,
                false
            )
        );
        this.mouseEventListenerTracker.addUnregisterCallback(
            () => document.removeEventListener(
                'mozpointerlockchange',
                lockStateChangeListener,
                false
            )
        );

        const onmousedown = (mouseEvent: MouseEvent) =>
            lockedMouseEvents.handleMouseDown(mouseEvent);
        const onmouseup = (mouseEvent: MouseEvent) =>
            lockedMouseEvents.handleMouseUp(mouseEvent);
        const onwheel = (wheelEvent: WheelEvent) =>
            lockedMouseEvents.handleMouseWheel(wheelEvent);
        const ondblclick = (mouseEvent: MouseEvent) =>
            lockedMouseEvents.handleMouseDouble(mouseEvent);
        videoElementParent.addEventListener('mousedown', onmousedown);
        videoElementParent.addEventListener('mouseup', onmouseup);
        videoElementParent.addEventListener('wheel', onwheel);
        videoElementParent.addEventListener('dblclick', ondblclick);

        this.mouseEventListenerTracker.addUnregisterCallback(
            () => videoElementParent.removeEventListener('mousedown', onmousedown)
        );
        this.mouseEventListenerTracker.addUnregisterCallback(
            () => videoElementParent.removeEventListener('mouseup', onmouseup)
        );
        this.mouseEventListenerTracker.addUnregisterCallback(
            () => videoElementParent.removeEventListener('wheel', onwheel)
        );
        this.mouseEventListenerTracker.addUnregisterCallback(
            () => videoElementParent.removeEventListener('dblclick', ondblclick)
        );
        this.mouseEventListenerTracker.addUnregisterCallback(
            () => lockedMouseEvents.unregisterMouseEvents()
        );
        this.mouseEventListenerTracker.addUnregisterCallback(() => {
            if (
                document.exitPointerLock &&
                (document.pointerLockElement === videoElementParent ||
                    document.mozPointerLockElement === videoElementParent)
            ) {
                document.exitPointerLock();
            }
        });
    }

    /**
     * Register a hovering mouse class
     * @param mouseController - A mouse controller object
     */
    registerHoveringMouseEvents(mouseController: MouseController) {
        const videoElementParent =
            this.videoElementProvider.getVideoParentElement() as HTMLDivElement;
        const hoveringMouseEvents = new HoveringMouseEvents(mouseController);

        const onmousemove = (mouseEvent: MouseEvent) =>
            hoveringMouseEvents.updateMouseMovePosition(mouseEvent);
        const onmousedown = (mouseEvent: MouseEvent) =>
            hoveringMouseEvents.handleMouseDown(mouseEvent);
        const onmouseup = (mouseEvent: MouseEvent) =>
            hoveringMouseEvents.handleMouseUp(mouseEvent);
        const oncontextmenu = (mouseEvent: MouseEvent) =>
            hoveringMouseEvents.handleContextMenu(mouseEvent);
        const onwheel = (wheelEvent: WheelEvent) =>
            hoveringMouseEvents.handleMouseWheel(wheelEvent);
        const ondblclick = (mouseEvent: MouseEvent) =>
            hoveringMouseEvents.handleMouseDouble(mouseEvent);
        videoElementParent.addEventListener('mousemove', onmousemove);
        videoElementParent.addEventListener('mousedown', onmousedown);
        videoElementParent.addEventListener('mouseup', onmouseup);
        videoElementParent.addEventListener('contextmenu', oncontextmenu);
        videoElementParent.addEventListener('wheel', onwheel);
        videoElementParent.addEventListener('dblclick', ondblclick);

        this.mouseEventListenerTracker.addUnregisterCallback(
            () => videoElementParent.removeEventListener('mousemove', onmousemove)
        );
        this.mouseEventListenerTracker.addUnregisterCallback(
            () => videoElementParent.removeEventListener('mousedown', onmousedown)
        );
        this.mouseEventListenerTracker.addUnregisterCallback(
            () => videoElementParent.removeEventListener('mouseup', onmouseup)
        );
        this.mouseEventListenerTracker.addUnregisterCallback(
            () => videoElementParent.removeEventListener('contextmenu', oncontextmenu)
        );
        this.mouseEventListenerTracker.addUnregisterCallback(
            () => videoElementParent.removeEventListener('wheel', onwheel)
        );
        this.mouseEventListenerTracker.addUnregisterCallback(
            () => videoElementParent.removeEventListener('dblclick', ondblclick)
        );
        this.mouseEventListenerTracker.addUnregisterCallback(
            () => hoveringMouseEvents.unregisterMouseEvents()
        );
    }

    /**
     * Set the mouse enter and mouse leave events
     */
    registerMouseEnterAndLeaveEvents() {
        const videoElementParent =
            this.videoElementProvider.getVideoParentElement() as HTMLDivElement;

        // Handle when the Mouse has entered the element
        const onmouseenter = (event: MouseEvent) => {
            if (!this.videoElementProvider.isVideoReady()) {
                return;
            }
            Logger.Log(Logger.GetStackTrace(), 'Mouse Entered', 6);
            this.sendMouseEnter();
            this.pressMouseButtons(event.buttons, event.x, event.y);
        };

        // Handles when the mouse has left the element
        const onmouseleave = (event: MouseEvent) => {
            if (!this.videoElementProvider.isVideoReady()) {
                return;
            }
            Logger.Log(Logger.GetStackTrace(), 'Mouse Left', 6);
            this.sendMouseLeave();
            this.releaseMouseButtons(event.buttons, event.x, event.y);
        };
        videoElementParent.addEventListener('mouseenter', onmouseenter);
        videoElementParent.addEventListener('mouseleave', onmouseleave);

        this.mouseEventListenerTracker.addUnregisterCallback(
            () => videoElementParent.removeEventListener('mouseenter', onmouseenter)
        );
        this.mouseEventListenerTracker.addUnregisterCallback(
            () => videoElementParent.removeEventListener('mouseleave', onmouseleave)
        );
    }

    /**
     * Handle when a mouse button is released
     * @param buttons - Mouse Button
     * @param X - Mouse pointer X coordinate
     * @param Y - Mouse pointer Y coordinate
     */
    releaseMouseButtons(buttons: number, X: number, Y: number) {
        const coord = this.coordinateConverter.normalizeAndQuantizeUnsigned(
            X,
            Y
        );
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

    /**
     * Handle when a mouse button is pressed
     * @param buttons - Mouse Button
     * @param X - Mouse pointer X coordinate
     * @param Y - Mouse pointer Y coordinate
     */
    pressMouseButtons(buttons: number, X: number, Y: number) {
        if (!this.videoElementProvider.isVideoReady()) {
            return;
        }
        const coord = this.coordinateConverter.normalizeAndQuantizeUnsigned(
            X,
            Y
        );
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

    /**
     * Handles mouse enter
     */
    sendMouseEnter() {
        if (!this.videoElementProvider.isVideoReady()) {
            return;
        }
        const toStreamerHandlers =
            this.toStreamerMessagesProvider.toStreamerHandlers;
        toStreamerHandlers.get('MouseEnter')();
    }

    /**
     * Handles mouse Leave
     */
    sendMouseLeave() {
        if (!this.videoElementProvider.isVideoReady()) {
            return;
        }
        const toStreamerHandlers =
            this.toStreamerMessagesProvider.toStreamerHandlers;
        toStreamerHandlers.get('MouseLeave')();
    }

    /**
     * Handles when a mouse button is pressed down
     * @param button - Mouse Button Pressed
     * @param X  - Mouse X Coordinate
     * @param Y  - Mouse Y Coordinate
     */
    sendMouseDown(button: number, X: number, Y: number) {
        if (!this.videoElementProvider.isVideoReady()) {
            return;
        }
        Logger.Log(
            Logger.GetStackTrace(),
            `mouse button ${button} down at (${X}, ${Y})`,
            6
        );
        const toStreamerHandlers =
            this.toStreamerMessagesProvider.toStreamerHandlers;
        toStreamerHandlers.get('MouseDown')([button, X, Y]);
    }

    /**
     * Handles when a mouse button is pressed up
     * @param button - Mouse Button Pressed
     * @param X  - Mouse X Coordinate
     * @param Y  - Mouse Y Coordinate
     */
    sendMouseUp(button: number, X: number, Y: number) {
        if (!this.videoElementProvider.isVideoReady()) {
            return;
        }
        Logger.Log(
            Logger.GetStackTrace(),
            `mouse button ${button} up at (${X}, ${Y})`,
            6
        );
        const coord = this.coordinateConverter.normalizeAndQuantizeUnsigned(
            X,
            Y
        );
        const toStreamerHandlers =
            this.toStreamerMessagesProvider.toStreamerHandlers;
        toStreamerHandlers.get('MouseUp')([button, coord.x, coord.y]);
    }
}

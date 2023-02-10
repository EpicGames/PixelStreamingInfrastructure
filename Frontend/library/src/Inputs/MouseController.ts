// Copyright Epic Games, Inc. All Rights Reserved.

import { MouseButtonsMask, MouseButton } from './MouseButtons';
import { Logger } from '../Logger/Logger';
import { StreamMessageController } from '../UeInstanceMessage/StreamMessageController';
import { CoordinateConverter } from '../Util/CoordinateConverter';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';

/**
 * Handles the Mouse Inputs for the document
 */
export class MouseController {
    videoElementProvider: VideoPlayer;
    toStreamerMessagesProvider: StreamMessageController;
    coordinateConverter: CoordinateConverter;

    /**
     * @param toStreamerMessagesProvider - Stream message instance
     * @param videoElementProvider - Video Player instance
     * @param normalizeAndQuantize - A normalize and quantize instance
     */
    constructor(
        toStreamerMessagesProvider: StreamMessageController,
        videoElementProvider: VideoPlayer,
        coordinateConverter: CoordinateConverter
    ) {
        this.toStreamerMessagesProvider = toStreamerMessagesProvider;
        this.coordinateConverter = coordinateConverter;
        this.videoElementProvider = videoElementProvider;
        this.registerMouseEnterAndLeaveEvents();
    }

    /**
     * Clears all the click events on the current video element parent div
     */
    clearMouseEvents() {
        const videoElementParent =
            this.videoElementProvider.getVideoParentElement() as HTMLDivElement;
        videoElementParent.onclick = null;
        videoElementParent.onmousedown = null;
        videoElementParent.onmouseup = null;
        videoElementParent.onwheel = null;
        videoElementParent.onmousemove = null;
        videoElementParent.oncontextmenu = null;
    }

    /**
     * Set the mouse enter and mouse leave events
     */
    registerMouseEnterAndLeaveEvents() {
        const videoElementParent =
            this.videoElementProvider.getVideoParentElement() as HTMLDivElement;

        // Handle when the Mouse has entered the element
        videoElementParent.onmouseenter = (event: MouseEvent) => {
            if (!this.videoElementProvider.isVideoReady()) {
                return;
            }
            Logger.Log(Logger.GetStackTrace(), 'Mouse Entered', 6);
            this.sendMouseEnter();
            this.pressMouseButtons(event.buttons, event.x, event.y);
        };

        // Handles when the mouse has left the element
        videoElementParent.onmouseleave = (event: MouseEvent) => {
            if (!this.videoElementProvider.isVideoReady()) {
                return;
            }
            Logger.Log(Logger.GetStackTrace(), 'Mouse Left', 6);
            this.sendMouseLeave();
            this.releaseMouseButtons(event.buttons, event.x, event.y);
        };
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

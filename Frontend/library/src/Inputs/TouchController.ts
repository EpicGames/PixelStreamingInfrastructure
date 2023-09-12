// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '../Logger/Logger';
import { CoordinateConverter } from '../Util/CoordinateConverter';
import { StreamMessageController } from '../UeInstanceMessage/StreamMessageController';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
import { ITouchController } from './ITouchController';
import { EventListenerTracker } from '../Util/EventListenerTracker';
/**
 * Handles the Touch input Events
 */
export class TouchController implements ITouchController {
    toStreamerMessagesProvider: StreamMessageController;
    videoElementProvider: VideoPlayer;
    coordinateConverter: CoordinateConverter;
    videoElementParent: HTMLVideoElement;
    fingers = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    fingerIds = new Map();
    maxByteValue = 255;

    // Utility for keeping track of event handlers and unregistering them
    private touchEventListenerTracker = new EventListenerTracker();

    /**
     * @param toStreamerMessagesProvider - Stream message instance
     * @param videoElementProvider - Video Player instance
     * @param coordinateConverter - A coordinate converter instance
     */
    constructor(
        toStreamerMessagesProvider: StreamMessageController,
        videoElementProvider: VideoPlayer,
        coordinateConverter: CoordinateConverter
    ) {
        this.toStreamerMessagesProvider = toStreamerMessagesProvider;
        this.videoElementProvider = videoElementProvider;
        this.coordinateConverter = coordinateConverter;
        this.videoElementParent = videoElementProvider.getVideoElement();
        const ontouchstart = (ev: TouchEvent) =>
            this.onTouchStart(ev);
        const ontouchend = (ev: TouchEvent) =>
            this.onTouchEnd(ev);
        const ontouchmove = (ev: TouchEvent) =>
            this.onTouchMove(ev);
        this.videoElementParent.addEventListener('touchstart', ontouchstart);
        this.videoElementParent.addEventListener('touchend', ontouchend);
        this.videoElementParent.addEventListener('touchmove', ontouchmove);
        this.touchEventListenerTracker.addUnregisterCallback(
            () => this.videoElementParent.removeEventListener('touchstart', ontouchstart)
        );
        this.touchEventListenerTracker.addUnregisterCallback(
            () => this.videoElementParent.removeEventListener('touchend', ontouchend)
        );
        this.touchEventListenerTracker.addUnregisterCallback(
            () => this.videoElementParent.removeEventListener('touchmove', ontouchmove)
        );
        Logger.Log(Logger.GetStackTrace(), 'Touch Events Registered', 6);

        // is this strictly necessary?
        const preventOnTouchMove = (event: TouchEvent) => {
            event.preventDefault();
        };
        document.addEventListener('touchmove', preventOnTouchMove);
        this.touchEventListenerTracker.addUnregisterCallback(
            () => document.removeEventListener('touchmove', preventOnTouchMove)
        );
    }

    /**
     * Unregister all touch events
     */
    unregisterTouchEvents() {
        this.touchEventListenerTracker.unregisterAll();
    }

    /**
     * Remember a touch command
     * @param touch - the touch command
     */
    rememberTouch(touch: Touch) {
        const finger = this.fingers.pop();
        if (finger === undefined) {
            Logger.Log(
                Logger.GetStackTrace(),
                'exhausted touch identifiers',
                6
            );
        }
        this.fingerIds.set(touch.identifier, finger);
    }

    /**
     * Forgets a touch command
     * @param touch - the touch command
     */
    forgetTouch(touch: Touch) {
        this.fingers.push(this.fingerIds.get(touch.identifier));
        // Sort array back into descending order. This means if finger '1' were to lift after finger '0', we would ensure that 0 will be the first index to pop
        this.fingers.sort(function (a, b) {
            return b - a;
        });
        this.fingerIds.delete(touch.identifier);
    }

    /**
     * When a touch event starts
     * @param touchEvent - the touch event being intercepted
     */
    onTouchStart(touchEvent: TouchEvent) {
        if (!this.videoElementProvider.isVideoReady()) {
            return;
        }
        for (let t = 0; t < touchEvent.changedTouches.length; t++) {
            this.rememberTouch(touchEvent.changedTouches[t]);
        }
        Logger.Log(Logger.GetStackTrace(), 'touch start', 6);

        this.emitTouchData('TouchStart', touchEvent.changedTouches);
        touchEvent.preventDefault();
    }

    /**
     * When a touch event ends
     * @param touchEvent - the touch event being intercepted
     */
    onTouchEnd(touchEvent: TouchEvent) {
        if (!this.videoElementProvider.isVideoReady()) {
            return;
        }
        Logger.Log(Logger.GetStackTrace(), 'touch end', 6);
        this.emitTouchData('TouchEnd', touchEvent.changedTouches);
        // Re-cycle unique identifiers previously assigned to each touch.
        for (let t = 0; t < touchEvent.changedTouches.length; t++) {
            this.forgetTouch(touchEvent.changedTouches[t]);
        }
        touchEvent.preventDefault();
    }

    /**
     * when a moving touch event occurs
     * @param touchEvent - the touch event being intercepted
     */
    onTouchMove(touchEvent: TouchEvent) {
        if (!this.videoElementProvider.isVideoReady()) {
            return;
        }
        Logger.Log(Logger.GetStackTrace(), 'touch move', 6);
        this.emitTouchData('TouchMove', touchEvent.touches);
        touchEvent.preventDefault();
    }

    emitTouchData(type: string, touches: TouchList) {
        if (!this.videoElementProvider.isVideoReady()) {
            return;
        }
        const offset = this.videoElementProvider.getVideoParentElement().getBoundingClientRect();
        const toStreamerHandlers =
            this.toStreamerMessagesProvider.toStreamerHandlers;

        for (let t = 0; t < touches.length; t++) {
            const numTouches = 1; // the number of touches to be sent this message
            const touch = touches[t];
            const x = touch.clientX - offset.left;
            const y = touch.clientY - offset.top;
            Logger.Log(
                Logger.GetStackTrace(),
                `F${this.fingerIds.get(touch.identifier)}=(${x}, ${y})`,
                6
            );

            const coord = this.coordinateConverter.normalizeAndQuantizeUnsigned(
                x,
                y
            );
            switch (type) {
                case 'TouchStart':
                    toStreamerHandlers.get('TouchStart')([
                        numTouches,
                        coord.x,
                        coord.y,
                        this.fingerIds.get(touch.identifier),
                        this.maxByteValue * touch.force,
                        coord.inRange ? 1 : 0
                    ]);
                    break;
                case 'TouchEnd':
                    toStreamerHandlers.get('TouchEnd')([
                        numTouches,
                        coord.x,
                        coord.y,
                        this.fingerIds.get(touch.identifier),
                        this.maxByteValue * touch.force,
                        coord.inRange ? 1 : 0
                    ]);
                    break;
                case 'TouchMove':
                    toStreamerHandlers.get('TouchMove')([
                        numTouches,
                        coord.x,
                        coord.y,
                        this.fingerIds.get(touch.identifier),
                        this.maxByteValue * touch.force,
                        coord.inRange ? 1 : 0
                    ]);
                    break;
            }
        }
    }
}

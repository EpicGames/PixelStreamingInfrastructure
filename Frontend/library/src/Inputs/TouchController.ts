// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.8';
import { InputCoordTranslator } from '../Util/InputCoordTranslator';
import { StreamMessageController } from '../UeInstanceMessage/StreamMessageController';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
import { IInputController } from './IInputController';

/**
 * The basic touch controller that handles the touch events on the document.
 */
export class TouchController implements IInputController {
    streamMessageController: StreamMessageController;
    videoPlayer: VideoPlayer;
    coordinateConverter: InputCoordTranslator;

    videoElementParent: HTMLVideoElement;
    fingers = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    fingerIds = new Map();
    maxByteValue = 255;

    onTouchStartListener: (event: TouchEvent) => void;
    onTouchEndListener: (event: TouchEvent) => void;
    onTouchMoveListener: (event: TouchEvent) => void;

    constructor(
        streamMessageController: StreamMessageController,
        videoPlayer: VideoPlayer,
        coordinateConverter: InputCoordTranslator
    ) {
        this.streamMessageController = streamMessageController;
        this.videoPlayer = videoPlayer;
        this.coordinateConverter = coordinateConverter;

        this.videoElementParent = videoPlayer.getVideoElement();

        this.onTouchStartListener = this.onTouchStart.bind(this);
        this.onTouchEndListener = this.onTouchEnd.bind(this);
        this.onTouchMoveListener = this.onTouchMove.bind(this);
    }

    register() {
        this.videoElementParent.addEventListener('touchstart', this.onTouchStartListener);
        this.videoElementParent.addEventListener('touchend', this.onTouchEndListener);
        this.videoElementParent.addEventListener('touchmove', this.onTouchMoveListener);
    }

    unregister() {
        this.videoElementParent.removeEventListener('touchstart', this.onTouchStartListener);
        this.videoElementParent.removeEventListener('touchend', this.onTouchEndListener);
        this.videoElementParent.removeEventListener('touchmove', this.onTouchMoveListener);
    }

    private rememberTouch(touch: Touch) {
        const finger = this.fingers.pop();
        if (finger === undefined) {
            Logger.Info('exhausted touch identifiers');
        }
        this.fingerIds.set(touch.identifier, finger);
    }

    private forgetTouch(touch: Touch) {
        this.fingers.push(this.fingerIds.get(touch.identifier));
        // Sort array back into descending order. This means if finger '1' were to lift after finger '0', we would ensure that 0 will be the first index to pop
        this.fingers.sort(function (a, b) {
            return b - a;
        });
        this.fingerIds.delete(touch.identifier);
    }

    private onTouchStart(touchEvent: TouchEvent) {
        if (!this.videoPlayer.isVideoReady()) {
            return;
        }
        for (let t = 0; t < touchEvent.changedTouches.length; t++) {
            this.rememberTouch(touchEvent.changedTouches[t]);
        }

        this.emitTouchData('TouchStart', touchEvent.changedTouches);
        touchEvent.preventDefault();
    }

    private onTouchEnd(touchEvent: TouchEvent) {
        if (!this.videoPlayer.isVideoReady()) {
            return;
        }
        this.emitTouchData('TouchEnd', touchEvent.changedTouches);
        // Re-cycle unique identifiers previously assigned to each touch.
        for (let t = 0; t < touchEvent.changedTouches.length; t++) {
            this.forgetTouch(touchEvent.changedTouches[t]);
        }
        touchEvent.preventDefault();
    }

    private onTouchMove(touchEvent: TouchEvent) {
        if (!this.videoPlayer.isVideoReady()) {
            return;
        }
        this.emitTouchData('TouchMove', touchEvent.touches);
        touchEvent.preventDefault();
    }

    private emitTouchData(type: string, touches: TouchList) {
        if (!this.videoPlayer.isVideoReady()) {
            return;
        }
        const offset = this.videoPlayer.getVideoParentElement().getBoundingClientRect();
        const toStreamerHandlers = this.streamMessageController.toStreamerHandlers;

        for (let t = 0; t < touches.length; t++) {
            const numTouches = 1; // the number of touches to be sent this message
            const touch = touches[t];
            const x = touch.clientX - offset.left;
            const y = touch.clientY - offset.top;
            Logger.Info(`F${this.fingerIds.get(touch.identifier)}=(${x}, ${y})`);

            const coord = this.coordinateConverter.translateUnsigned(x, y);
            switch (type) {
                case 'TouchStart':
                    toStreamerHandlers.get('TouchStart')([
                        numTouches,
                        coord.x,
                        coord.y,
                        this.fingerIds.get(touch.identifier),
                        this.maxByteValue * (touch.force > 0 ? touch.force : 1),
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
                        this.maxByteValue * (touch.force > 0 ? touch.force : 1),
                        coord.inRange ? 1 : 0
                    ]);
                    break;
            }
        }
    }
}

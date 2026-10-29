// Copyright Epic Games, Inc. All Rights Reserved.

import { InputCoordTranslator } from '../Util/InputCoordTranslator';
import { StreamMessageController } from '../UeInstanceMessage/StreamMessageController';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
import { MouseButton } from './MouseButtons';
import { IInputController } from './IInputController';

interface FakeTouchFinger {
    id: number;
    x: number;
    y: number;
}

/**
 * Allows for the usage of fake touch events
 */
export class TouchControllerFake implements IInputController {
    streamMessageController: StreamMessageController;
    videoPlayer: VideoPlayer;
    coordinateConverter: InputCoordTranslator;

    fakeTouchFinger: FakeTouchFinger;
    videoElementParentClientRect: DOMRect;

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

        this.onTouchStartListener = this.onTouchStart.bind(this);
        this.onTouchEndListener = this.onTouchEnd.bind(this);
        this.onTouchMoveListener = this.onTouchMove.bind(this);

        this.videoElementParentClientRect = this.videoPlayer.getVideoParentElement().getBoundingClientRect();
    }

    register() {
        document.addEventListener('touchstart', this.onTouchStartListener);
        document.addEventListener('touchend', this.onTouchEndListener);
        // A cancelled touch never fires touchend; without this the tracked finger would block every later tap.
        document.addEventListener('touchcancel', this.onTouchEndListener);
        document.addEventListener('touchmove', this.onTouchMoveListener);
    }

    unregister() {
        document.removeEventListener('touchstart', this.onTouchStartListener);
        document.removeEventListener('touchend', this.onTouchEndListener);
        document.removeEventListener('touchcancel', this.onTouchEndListener);
        document.removeEventListener('touchmove', this.onTouchMoveListener);
    }

    private onTouchStart(touch: TouchEvent): void {
        if (!this.videoPlayer.isVideoReady() || touch.target !== this.videoPlayer.getVideoElement()) {
            return;
        }
        if (this.fakeTouchFinger == null) {
            const first_touch = touch.changedTouches[0];
            this.fakeTouchFinger = {
                id: first_touch.identifier,
                x: first_touch.clientX - this.videoElementParentClientRect.left,
                y: first_touch.clientY - this.videoElementParentClientRect.top
            };

            const videoElementParent = this.videoPlayer.getVideoParentElement() as HTMLDivElement;
            const mouseEvent = new MouseEvent('mouseenter', first_touch);
            videoElementParent.dispatchEvent(mouseEvent);

            const coord = this.coordinateConverter.translateUnsigned(
                this.fakeTouchFinger.x,
                this.fakeTouchFinger.y
            );
            const toStreamerHandlers = this.streamMessageController.toStreamerHandlers;
            toStreamerHandlers.get('MouseDown')([MouseButton.mainButton, coord.x, coord.y]);
        }
        touch.preventDefault();
    }

    private onTouchEnd(touchEvent: TouchEvent): void {
        if (!this.videoPlayer.isVideoReady() || this.fakeTouchFinger == null) {
            return;
        }
        const videoElementParent = this.videoPlayer.getVideoParentElement();
        const toStreamerHandlers = this.streamMessageController.toStreamerHandlers;

        for (let t = 0; t < touchEvent.changedTouches.length; t++) {
            const touch = touchEvent.changedTouches[t];
            if (touch.identifier === this.fakeTouchFinger.id) {
                const x = touch.clientX - this.videoElementParentClientRect.left;
                const y = touch.clientY - this.videoElementParentClientRect.top;
                const coord = this.coordinateConverter.translateUnsigned(x, y);
                toStreamerHandlers.get('MouseUp')([MouseButton.mainButton, coord.x, coord.y]);

                const mouseEvent = new MouseEvent('mouseleave', touch);
                videoElementParent.dispatchEvent(mouseEvent);
                this.fakeTouchFinger = null;
                break;
            }
        }
        touchEvent.preventDefault();
    }

    private onTouchMove(touchEvent: TouchEvent): void {
        if (!this.videoPlayer.isVideoReady() || this.fakeTouchFinger == null) {
            return;
        }
        const toStreamerHandlers = this.streamMessageController.toStreamerHandlers;

        for (let t = 0; t < touchEvent.touches.length; t++) {
            const touch = touchEvent.touches[t];
            if (touch.identifier === this.fakeTouchFinger.id) {
                const x = touch.clientX - this.videoElementParentClientRect.left;
                const y = touch.clientY - this.videoElementParentClientRect.top;
                const coord = this.coordinateConverter.translateUnsigned(x, y);
                const delta = this.coordinateConverter.translateSigned(
                    x - this.fakeTouchFinger.x,
                    y - this.fakeTouchFinger.y
                );
                toStreamerHandlers.get('MouseMove')([coord.x, coord.y, delta.x, delta.y]);
                this.fakeTouchFinger.x = x;
                this.fakeTouchFinger.y = y;
                break;
            }
        }
        touchEvent.preventDefault();
    }
}

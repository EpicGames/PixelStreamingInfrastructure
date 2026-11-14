// Copyright Epic Games, Inc. All Rights Reserved.
import { StreamMessageController } from '../UeInstanceMessage/StreamMessageController';
import { InputCoordTranslator } from '../Util/InputCoordTranslator';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
import type { ActiveKeys } from './InputClassesFactory';
import { MouseController } from './MouseController';
import { MouseButton, MouseButtonsMask } from './MouseButtons';
import { Config, Flags } from '../Config/Config';

/**
 * Pairs each bit of `PointerEvent.buttons` with the button id the streamer expects.
 */
const trackedButtons: ReadonlyArray<{ mask: number; button: number }> = [
    { mask: MouseButtonsMask.primaryButton, button: MouseButton.mainButton },
    { mask: MouseButtonsMask.secondaryButton, button: MouseButton.secondaryButton },
    { mask: MouseButtonsMask.auxiliaryButton, button: MouseButton.auxiliaryButton },
    { mask: MouseButtonsMask.fourthButton, button: MouseButton.fourthButton },
    { mask: MouseButtonsMask.fifthButton, button: MouseButton.fifthButton }
];

const allTrackedButtonsMask = trackedButtons.reduce((all, { mask }) => all | mask, 0);

/**
 * A mouse controller that allows the mouse to freely float over the video document.
 *
 * While a button is held the pointer is captured by the video element, so move and release events keep
 * arriving even when the cursor leaves the element or the browser window. Touch pointers are ignored,
 * the touch controllers handle those.
 */
export class MouseControllerHovering extends MouseController {
    videoElementParent: HTMLDivElement;

    onPointerUpListener: (event: PointerEvent) => void;
    onPointerDownListener: (event: PointerEvent) => void;
    onPointerMoveListener: (event: PointerEvent) => void;
    onPointerCancelListener: (event: PointerEvent) => void;
    onLostPointerCaptureListener: (event: PointerEvent) => void;
    onMouseDownListener: (event: MouseEvent) => void;
    onMouseDblClickListener: (event: MouseEvent) => void;
    onMouseWheelListener: (event: WheelEvent) => void;
    onContextMenuListener: (event: MouseEvent) => void;

    // Bitmask (same layout as `PointerEvent.buttons`) of the buttons the streamer currently believes are held.
    // UE pairs every MouseDown with a later MouseUp, so this is what we must always release again.
    private pressedButtons = 0;
    private capturedPointerId: number | null = null;

    constructor(
        streamMessageController: StreamMessageController,
        videoPlayer: VideoPlayer,
        coordinateConverter: InputCoordTranslator,
        activeKeys: ActiveKeys,
        config: Config
    ) {
        super(streamMessageController, videoPlayer, coordinateConverter, activeKeys, config);
        this.videoElementParent = videoPlayer.getVideoParentElement() as HTMLDivElement;
        this.onPointerUpListener = this.onPointerUp.bind(this);
        this.onPointerDownListener = this.onPointerDown.bind(this);
        this.onPointerMoveListener = this.onPointerMove.bind(this);
        this.onPointerCancelListener = this.onPointerCancel.bind(this);
        this.onLostPointerCaptureListener = this.onLostPointerCapture.bind(this);
        this.onMouseDownListener = this.onMouseDown.bind(this);
        this.onMouseDblClickListener = this.onMouseDblClick.bind(this);
        this.onMouseWheelListener = this.onMouseWheel.bind(this);
        this.onContextMenuListener = this.onContextMenu.bind(this);
    }

    override register(): void {
        super.register();

        this.videoElementParent.addEventListener('pointerdown', this.onPointerDownListener);
        this.videoElementParent.addEventListener('pointermove', this.onPointerMoveListener);
        this.videoElementParent.addEventListener('pointerup', this.onPointerUpListener);
        this.videoElementParent.addEventListener('pointercancel', this.onPointerCancelListener);
        this.videoElementParent.addEventListener('lostpointercapture', this.onLostPointerCaptureListener);
        this.videoElementParent.addEventListener('mousedown', this.onMouseDownListener);
        this.videoElementParent.addEventListener('contextmenu', this.onContextMenuListener);
        this.videoElementParent.addEventListener('wheel', this.onMouseWheelListener);
        this.videoElementParent.addEventListener('dblclick', this.onMouseDblClickListener);
    }

    override unregister(): void {
        this.videoElementParent.removeEventListener('pointerdown', this.onPointerDownListener);
        this.videoElementParent.removeEventListener('pointermove', this.onPointerMoveListener);
        this.videoElementParent.removeEventListener('pointerup', this.onPointerUpListener);
        this.videoElementParent.removeEventListener('pointercancel', this.onPointerCancelListener);
        this.videoElementParent.removeEventListener('lostpointercapture', this.onLostPointerCaptureListener);
        this.videoElementParent.removeEventListener('mousedown', this.onMouseDownListener);
        this.videoElementParent.removeEventListener('contextmenu', this.onContextMenuListener);
        this.videoElementParent.removeEventListener('wheel', this.onMouseWheelListener);
        this.videoElementParent.removeEventListener('dblclick', this.onMouseDblClickListener);
        // The listeners are gone, so a button held right now can no longer be released through them.
        this.releaseCapture();
        this.pressedButtons = 0;

        super.unregister();
    }

    private shouldIgnore(event: PointerEvent): boolean {
        return event.pointerType === 'touch' || !this.videoPlayer.isVideoReady();
    }

    /**
     * Coordinates relative to the video element parent. Not `offsetX/Y`: that is relative to the event
     * target, which is not always the parent.
     */
    private translateCoordinates(clientX: number, clientY: number) {
        const rect = this.videoElementParent.getBoundingClientRect();
        return this.coordinateConverter.translateUnsigned(clientX - rect.left, clientY - rect.top);
    }

    private captureOnce(pointerId: number) {
        if (this.capturedPointerId !== null) {
            return;
        }
        this.videoElementParent.setPointerCapture(pointerId);
        this.capturedPointerId = pointerId;
    }

    private releaseCapture() {
        if (this.capturedPointerId === null) {
            return;
        }
        const pointerId = this.capturedPointerId;
        this.capturedPointerId = null;
        if (this.videoElementParent.hasPointerCapture(pointerId)) {
            this.videoElementParent.releasePointerCapture(pointerId);
        }
    }

    /**
     * Sends the MouseUp and MouseDown messages needed to make the streamer's idea of the held buttons match
     * `buttons`. A mouse only fires `pointerdown` for the first button of a chord and `pointerup` for the
     * last one, the changes in between arrive as `pointermove` with a changed `buttons` bitmask, so the
     * difference with the buttons we sent earlier is what tells us which presses and releases to send.
     * Releases go first so a swap of buttons never shows two buttons held.
     */
    private syncButtons(heldButtons: number, clientX: number, clientY: number) {
        const buttons = heldButtons & allTrackedButtonsMask;
        const coord = this.translateCoordinates(clientX, clientY);
        const released = this.pressedButtons & ~buttons;
        const pressed = buttons & ~this.pressedButtons;
        this.pressedButtons = buttons;

        for (const { mask, button } of trackedButtons) {
            if (released & mask) {
                this.streamMessageController.toStreamerHandlers.get('MouseUp')?.([button, coord.x, coord.y]);
            }
        }
        for (const { mask, button } of trackedButtons) {
            if (pressed & mask) {
                this.streamMessageController.toStreamerHandlers.get('MouseDown')?.([
                    button,
                    coord.x,
                    coord.y
                ]);
            }
        }
    }

    /**
     * Releases every held button no matter what the event says, so the engine can never be left thinking a
     * button is still down when the pointer is cancelled or its capture is lost mid-press.
     */
    private releaseAllButtons(event: PointerEvent) {
        if (this.pressedButtons === 0) {
            return;
        }
        if (event.pointerType === 'touch' || !this.videoPlayer.isVideoReady()) {
            this.pressedButtons = 0;
            return;
        }
        this.syncButtons(0, event.clientX, event.clientY);
    }

    /**
     * The base class presses the buttons held on enter itself, which this controller would not know about
     * and so never release. Going through `syncButtons` keeps `pressedButtons` accurate and uses coordinates
     * relative to the video element.
     */
    protected override onMouseEnter(event: MouseEvent) {
        if (!this.videoPlayer.isVideoReady()) {
            return;
        }
        this.streamMessageController.toStreamerHandlers.get('MouseEnter')?.();
        this.syncButtons(event.buttons, event.clientX, event.clientY);
    }

    /**
     * While the pointer is captured the release still reaches us, so only release here when there is no
     * capture.
     */
    protected override onMouseLeave(event: MouseEvent) {
        if (!this.videoPlayer.isVideoReady()) {
            return;
        }
        this.streamMessageController.toStreamerHandlers.get('MouseLeave')?.();
        if (this.capturedPointerId === null) {
            this.syncButtons(0, event.clientX, event.clientY);
        }
    }

    private onPointerDown(event: PointerEvent) {
        if (this.shouldIgnore(event)) {
            return;
        }
        this.captureOnce(event.pointerId);
        this.syncButtons(event.buttons, event.clientX, event.clientY);
    }

    private onPointerUp(event: PointerEvent) {
        if (this.shouldIgnore(event)) {
            return;
        }
        this.syncButtons(event.buttons, event.clientX, event.clientY);
    }

    private onPointerCancel(event: PointerEvent) {
        this.releaseAllButtons(event);
        this.releaseCapture();
    }

    private onLostPointerCapture(event: PointerEvent) {
        if (event.pointerId === this.capturedPointerId) {
            this.capturedPointerId = null;
        }
        this.releaseAllButtons(event);
    }

    private onPointerMove(event: PointerEvent) {
        if (this.shouldIgnore(event)) {
            return;
        }
        if (this.pressedButtons !== 0) {
            this.syncButtons(event.buttons, event.clientX, event.clientY);
        }
        const coord = this.translateCoordinates(event.clientX, event.clientY);
        const delta = this.coordinateConverter.translateSigned(event.movementX, event.movementY);
        this.streamMessageController.toStreamerHandlers.get('MouseMove')?.([
            coord.x,
            coord.y,
            delta.x,
            delta.y
        ]);
    }

    /**
     * Pointer events carry the button messages, but the compatibility `mousedown` still has default actions
     * (focus change, text selection, image dragging) that must not happen while interacting with the stream.
     */
    private onMouseDown(event: MouseEvent) {
        if (!this.videoPlayer.isVideoReady()) {
            return;
        }
        event.preventDefault();
    }

    private onContextMenu(event: MouseEvent) {
        if (!this.videoPlayer.isVideoReady()) {
            return;
        }
        event.preventDefault();
    }

    private onMouseWheel(event: WheelEvent) {
        if (!this.videoPlayer.isVideoReady()) {
            return;
        }
        const coord = this.coordinateConverter.translateUnsigned(event.offsetX, event.offsetY);
        this.streamMessageController.toStreamerHandlers.get('MouseWheel')([
            event.wheelDelta,
            coord.x,
            coord.y
        ]);
        event.preventDefault();
    }

    private onMouseDblClick(event: MouseEvent) {
        if (!this.videoPlayer.isVideoReady()) {
            return;
        }
        const coord = this.coordinateConverter.translateUnsigned(event.offsetX, event.offsetY);
        this.streamMessageController.toStreamerHandlers.get('MouseDouble')([event.button, coord.x, coord.y]);

        // The streamer plugin treats `MouseDouble` as a press-class event (it routes to
        // Slate's RoutePointerDoubleClickEvent / IGenericApplicationMessageHandler::OnMouseDoubleClick)
        // but never synthesizes the matching release. The browser's preceding `mouseup` was
        // already consumed by the prior `MouseUp` message, so without this UE is left thinking
        // the button is still held — manifesting as e.g. camera pans that latch on after a
        // double-click. See issue #10.
        // Disable Flags.MouseDoubleClickAutoRelease to restore the pre-fix behaviour.
        if (this.config.isFlagEnabled(Flags.MouseDoubleClickAutoRelease)) {
            this.streamMessageController.toStreamerHandlers.get('MouseUp')([event.button, coord.x, coord.y]);
        }
    }
}

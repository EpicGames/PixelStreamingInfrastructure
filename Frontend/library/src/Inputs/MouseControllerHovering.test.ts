// Copyright Epic Games, Inc. All Rights Reserved.
import { Config } from '../Config/Config';
import { StreamMessageController } from '../UeInstanceMessage/StreamMessageController';
import { InputCoordTranslator } from '../Util/InputCoordTranslator';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
import type { ActiveKeys } from './InputClassesFactory';
import { MouseButton, MouseButtonsMask } from './MouseButtons';
import { MouseControllerHovering } from './MouseControllerHovering';

type HandlerName =
    | 'MouseDown'
    | 'MouseUp'
    | 'MouseMove'
    | 'MouseWheel'
    | 'MouseDouble'
    | 'MouseEnter'
    | 'MouseLeave';

const playerSize = 100;
const unitsPerPixel = 65536 / playerSize;

describe('MouseControllerHovering', () => {
    let parent: HTMLDivElement;
    let videoReady: boolean;
    let handlers: Record<HandlerName, jest.Mock>;
    let capturedPointers: Set<number>;
    let controller: MouseControllerHovering;

    interface PointerInit {
        button?: number;
        buttons?: number;
        clientX?: number;
        clientY?: number;
        pointerId?: number;
        pointerType?: string;
        movementX?: number;
        movementY?: number;
    }

    // jsdom has no PointerEvent, so a MouseEvent carries the pointer-only fields.
    function fire(type: string, init: PointerInit = {}) {
        const { pointerId = 1, pointerType = 'mouse', movementX = 0, movementY = 0, ...mouseInit } = init;
        const event = new MouseEvent(type, { bubbles: true, cancelable: true, ...mouseInit });
        Object.defineProperties(event, {
            pointerId: { value: pointerId },
            pointerType: { value: pointerType },
            movementX: { value: movementX },
            movementY: { value: movementY }
        });
        parent.dispatchEvent(event);
        return event;
    }

    function callsOf(name: HandlerName) {
        return handlers[name].mock.calls.map(([args]) => args as number[]);
    }

    function buttonsOf(name: 'MouseDown' | 'MouseUp') {
        return callsOf(name).map(([button]) => button);
    }

    beforeEach(() => {
        parent = document.createElement('div');
        document.body.appendChild(parent);
        parent.getBoundingClientRect = () => new DOMRect(0, 0, playerSize, playerSize);

        capturedPointers = new Set();
        parent.setPointerCapture = jest.fn((id: number) => {
            capturedPointers.add(id);
        });
        parent.hasPointerCapture = jest.fn((id: number) => capturedPointers.has(id));
        parent.releasePointerCapture = jest.fn((id: number) => {
            capturedPointers.delete(id);
        });

        videoReady = true;
        const videoPlayer = {
            getVideoParentElement: () => parent,
            isVideoReady: () => videoReady
        } as unknown as VideoPlayer;

        handlers = {
            MouseDown: jest.fn(),
            MouseUp: jest.fn(),
            MouseMove: jest.fn(),
            MouseWheel: jest.fn(),
            MouseDouble: jest.fn(),
            MouseEnter: jest.fn(),
            MouseLeave: jest.fn()
        };
        const streamMessageController = {
            toStreamerHandlers: new Map(Object.entries(handlers))
        } as unknown as StreamMessageController;

        const coordinateConverter = new InputCoordTranslator();
        coordinateConverter.reconfigure(
            { width: playerSize, height: playerSize },
            { width: playerSize, height: playerSize }
        );

        const config = { isFlagEnabled: jest.fn(() => false) } as unknown as Config;

        controller = new MouseControllerHovering(
            streamMessageController,
            videoPlayer,
            coordinateConverter,
            {} as ActiveKeys,
            config
        );
        controller.register();
    });

    afterEach(() => {
        controller.unregister();
        parent.remove();
    });

    it('sends MouseDown with coordinates relative to the video element and captures the pointer', () => {
        fire('pointerdown', { button: 0, buttons: MouseButtonsMask.primaryButton, clientX: 50, clientY: 25 });

        expect(callsOf('MouseDown')).toEqual([
            [MouseButton.mainButton, 50 * unitsPerPixel, 25 * unitsPerPixel]
        ]);
        expect(parent.setPointerCapture).toHaveBeenCalledWith(1);
    });

    it('sends MouseUp when the button is released', () => {
        fire('pointerdown', { button: 0, buttons: MouseButtonsMask.primaryButton, clientX: 10, clientY: 10 });
        fire('pointerup', { button: 0, buttons: 0, clientX: 10, clientY: 10 });

        expect(buttonsOf('MouseUp')).toEqual([MouseButton.mainButton]);
    });

    it('keeps sending moves and the release while the pointer is outside the element', () => {
        fire('pointerdown', { button: 0, buttons: MouseButtonsMask.primaryButton, clientX: 90, clientY: 50 });
        fire('pointermove', {
            buttons: MouseButtonsMask.primaryButton,
            clientX: 400,
            clientY: 50,
            movementX: 5
        });
        fire('pointerup', { button: 0, buttons: 0, clientX: 400, clientY: 50 });

        expect(handlers.MouseMove).toHaveBeenCalledTimes(1);
        expect(buttonsOf('MouseUp')).toEqual([MouseButton.mainButton]);
        expect(buttonsOf('MouseDown')).toEqual([MouseButton.mainButton]);
    });

    it('sends a MouseDown for a second button pressed while the first is held', () => {
        fire('pointerdown', { button: 0, buttons: MouseButtonsMask.primaryButton });
        fire('pointermove', {
            buttons: MouseButtonsMask.primaryButton | MouseButtonsMask.secondaryButton
        });

        expect(buttonsOf('MouseDown')).toEqual([MouseButton.mainButton, MouseButton.secondaryButton]);
        expect(buttonsOf('MouseUp')).toEqual([]);
    });

    it('sends a MouseUp for one of two held buttons released through a move', () => {
        fire('pointerdown', { button: 0, buttons: MouseButtonsMask.primaryButton });
        fire('pointermove', {
            buttons: MouseButtonsMask.primaryButton | MouseButtonsMask.secondaryButton
        });
        fire('pointermove', { buttons: MouseButtonsMask.secondaryButton });
        fire('pointerup', { button: 2, buttons: 0 });

        expect(buttonsOf('MouseUp')).toEqual([MouseButton.mainButton, MouseButton.secondaryButton]);
        expect(buttonsOf('MouseDown')).toEqual([MouseButton.mainButton, MouseButton.secondaryButton]);
    });

    it('pairs every MouseDown with exactly one MouseUp across a chord', () => {
        const primary = MouseButtonsMask.primaryButton;
        const auxiliary = MouseButtonsMask.auxiliaryButton;
        fire('pointerdown', { button: 0, buttons: primary });
        fire('pointermove', { buttons: primary | auxiliary });
        fire('pointermove', { buttons: auxiliary });
        fire('pointermove', { buttons: auxiliary | primary });
        fire('pointerup', { buttons: 0 });

        const sortedDowns = buttonsOf('MouseDown').sort();
        expect(sortedDowns).toEqual([
            MouseButton.mainButton,
            MouseButton.mainButton,
            MouseButton.auxiliaryButton
        ]);
        expect(buttonsOf('MouseUp').sort()).toEqual(sortedDowns);
    });

    it('releases held buttons when the pointer is cancelled', () => {
        fire('pointerdown', { button: 0, buttons: MouseButtonsMask.primaryButton });
        fire('pointercancel', { buttons: 0 });

        expect(buttonsOf('MouseUp')).toEqual([MouseButton.mainButton]);
    });

    it('releases held buttons when pointer capture is lost mid-press', () => {
        fire('pointerdown', { button: 0, buttons: MouseButtonsMask.primaryButton });
        fire('lostpointercapture', { buttons: MouseButtonsMask.primaryButton });

        expect(buttonsOf('MouseUp')).toEqual([MouseButton.mainButton]);
    });

    it('does not send a second MouseUp when capture is lost after a normal release', () => {
        fire('pointerdown', { button: 0, buttons: MouseButtonsMask.primaryButton });
        fire('pointerup', { button: 0, buttons: 0 });
        fire('lostpointercapture', { buttons: 0 });

        expect(buttonsOf('MouseUp')).toEqual([MouseButton.mainButton]);
    });

    it('does not press again on moves after the buttons were force released', () => {
        fire('pointerdown', { button: 0, buttons: MouseButtonsMask.primaryButton });
        fire('pointercancel', { buttons: 0 });
        fire('pointermove', { buttons: MouseButtonsMask.primaryButton });

        expect(buttonsOf('MouseDown')).toEqual([MouseButton.mainButton]);
    });

    describe('a press that starts outside the video', () => {
        function fireMouse(type: string, init: MouseEventInit = {}) {
            parent.dispatchEvent(new MouseEvent(type, { bubbles: false, cancelable: true, ...init }));
        }

        it('sends one MouseDown on enter with element relative coordinates and one MouseUp on release', () => {
            fireMouse('mouseenter', { buttons: MouseButtonsMask.primaryButton, clientX: 50, clientY: 25 });
            fire('pointerup', { button: 0, buttons: 0, clientX: 50, clientY: 25 });

            expect(callsOf('MouseDown')).toEqual([
                [MouseButton.mainButton, 50 * unitsPerPixel, 25 * unitsPerPixel]
            ]);
            expect(buttonsOf('MouseUp')).toEqual([MouseButton.mainButton]);
            expect(handlers.MouseEnter).toHaveBeenCalledTimes(1);
        });

        it('sends a MouseDown for a second button pressed after dragging in and releases both', () => {
            fireMouse('mouseenter', { buttons: MouseButtonsMask.primaryButton });
            fire('pointermove', {
                buttons: MouseButtonsMask.primaryButton | MouseButtonsMask.secondaryButton
            });
            fire('pointerup', { buttons: 0 });

            expect(buttonsOf('MouseDown')).toEqual([MouseButton.mainButton, MouseButton.secondaryButton]);
            expect(buttonsOf('MouseUp').sort()).toEqual(buttonsOf('MouseDown').sort());
        });

        it('releases held buttons when the pointer leaves without a capture', () => {
            fireMouse('mouseenter', { buttons: MouseButtonsMask.primaryButton });
            fireMouse('mouseleave', { buttons: MouseButtonsMask.primaryButton });

            expect(buttonsOf('MouseUp')).toEqual([MouseButton.mainButton]);
            expect(handlers.MouseLeave).toHaveBeenCalledTimes(1);
        });

        it('leaves the release to the capture when the pointer leaves a captured press', () => {
            fire('pointerdown', { button: 0, buttons: MouseButtonsMask.primaryButton });
            fireMouse('mouseleave', { buttons: MouseButtonsMask.primaryButton });
            expect(handlers.MouseUp).not.toHaveBeenCalled();

            fire('pointerup', { button: 0, buttons: 0 });
            expect(buttonsOf('MouseUp')).toEqual([MouseButton.mainButton]);
        });

        it('sends nothing but MouseEnter when no button is held', () => {
            fireMouse('mouseenter', { buttons: 0 });

            expect(handlers.MouseEnter).toHaveBeenCalledTimes(1);
            expect(handlers.MouseDown).not.toHaveBeenCalled();
        });
    });

    it('ignores touch pointers', () => {
        fire('pointerdown', { pointerType: 'touch', button: 0, buttons: MouseButtonsMask.primaryButton });
        fire('pointermove', { pointerType: 'touch', buttons: MouseButtonsMask.primaryButton });
        fire('pointerup', { pointerType: 'touch', button: 0, buttons: 0 });

        expect(handlers.MouseDown).not.toHaveBeenCalled();
        expect(handlers.MouseMove).not.toHaveBeenCalled();
        expect(handlers.MouseUp).not.toHaveBeenCalled();
        expect(parent.setPointerCapture).not.toHaveBeenCalled();
    });

    it('ignores pointers until the video is ready', () => {
        videoReady = false;
        fire('pointerdown', { button: 0, buttons: MouseButtonsMask.primaryButton });
        fire('pointermove', {});

        expect(handlers.MouseDown).not.toHaveBeenCalled();
        expect(handlers.MouseMove).not.toHaveBeenCalled();
    });

    it('sends moves while hovering without any button held', () => {
        fire('pointermove', { buttons: 0, clientX: 20, clientY: 40 });

        expect(callsOf('MouseMove')).toHaveLength(1);
        expect(callsOf('MouseMove')[0].slice(0, 2)).toEqual([20 * unitsPerPixel, 40 * unitsPerPixel]);
        expect(handlers.MouseDown).not.toHaveBeenCalled();
    });

    it('prevents the default of mousedown so focus and text selection stay untouched', () => {
        const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
        parent.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);
    });

    it('does not register passive listeners that preventDefault would conflict with', () => {
        const addEventListener = jest.spyOn(parent, 'addEventListener');
        controller.unregister();
        controller.register();

        for (const [, , options] of addEventListener.mock.calls) {
            expect(options).toBeUndefined();
        }
    });

    it('stops listening and releases pointer capture on unregister', () => {
        fire('pointerdown', { button: 0, buttons: MouseButtonsMask.primaryButton });
        controller.unregister();

        expect(parent.releasePointerCapture).toHaveBeenCalledWith(1);

        fire('pointermove', { buttons: MouseButtonsMask.primaryButton });
        expect(handlers.MouseMove).not.toHaveBeenCalled();
    });
});

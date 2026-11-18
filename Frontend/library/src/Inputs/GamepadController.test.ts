import { StreamMessageController } from '../UeInstanceMessage/StreamMessageController';
import { GamepadController } from './GamepadController';

const pad = (index: number): Gamepad =>
    ({
        index,
        id: `pad-${index}`,
        buttons: [{ pressed: false, touched: false, value: 0 }],
        axes: [0, 0]
    }) as unknown as Gamepad;

describe('GamepadController with several pads', () => {
    let requestAnimationFrame: jest.Mock;
    let originalRequestAnimationFrame: typeof window.requestAnimationFrame;
    let controller: GamepadController;

    // Private handlers are driven directly, so the test does not depend on the browser's gamepad events.
    const connect = (gamepad: Gamepad) =>
        (controller as unknown as { onGamepadConnected(event: GamepadEvent): void }).onGamepadConnected({
            gamepad
        } as GamepadEvent);
    const disconnect = (gamepad: Gamepad) =>
        (controller as unknown as { onGamepadDisconnected(event: GamepadEvent): void }).onGamepadDisconnected(
            { gamepad } as GamepadEvent
        );

    beforeEach(() => {
        originalRequestAnimationFrame = window.requestAnimationFrame;
        requestAnimationFrame = jest.fn(() => 1);
        window.requestAnimationFrame =
            requestAnimationFrame as unknown as typeof window.requestAnimationFrame;
        const streamMessageController = new StreamMessageController();
        streamMessageController.toStreamerHandlers.set('GamepadConnected', jest.fn());
        streamMessageController.toStreamerHandlers.set('GamepadDisconnected', jest.fn());
        controller = new GamepadController(streamMessageController);
        // register() is what allocates the controllers array; navigator.getGamepads is absent in jsdom.
        controller.register();
    });

    afterEach(() => {
        window.requestAnimationFrame = originalRequestAnimationFrame;
        delete (navigator as unknown as { getGamepads?: unknown }).getGamepads;
    });

    it('runs one status loop no matter how many pads connect', () => {
        connect(pad(0));
        connect(pad(1));

        expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    });

    it('keeps the surviving pad addressable after another pad disconnects', () => {
        connect(pad(0));
        connect(pad(1));
        disconnect(pad(0));

        const survivingState = pad(1);
        Object.defineProperty(navigator, 'getGamepads', {
            configurable: true,
            value: () => [undefined, survivingState]
        });
        (controller as unknown as { scanGamepads(): void }).scanGamepads();

        expect(controller.controllers[0]).toBeUndefined();
        expect(controller.controllers[1].currentState).toBe(survivingState);
    });
});

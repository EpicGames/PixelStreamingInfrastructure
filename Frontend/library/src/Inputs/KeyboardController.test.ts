import { Config } from '../Config/Config';
import { StreamMessageController } from '../UeInstanceMessage/StreamMessageController';
import { ActiveKeys } from './InputClassesFactory';
import { KeyboardController } from './KeyboardController';

describe('KeyboardController held-key tracking', () => {
    let activeKeys: ActiveKeys;
    let keyUp: jest.Mock;
    let controller: KeyboardController;

    // getKeycode falls back to keyCode when the event carries one, so only keyCode and repeat matter here.
    const keyEvent = (keyCode: number, repeat = false): KeyboardEvent =>
        ({ keyCode, code: '', repeat, preventDefault: jest.fn() }) as unknown as KeyboardEvent;

    beforeEach(() => {
        const streamMessageController = new StreamMessageController();
        keyUp = jest.fn();
        streamMessageController.toStreamerHandlers.set('KeyDown', jest.fn());
        streamMessageController.toStreamerHandlers.set('KeyUp', keyUp);
        activeKeys = new ActiveKeys();
        const config = { isFlagEnabled: () => false } as unknown as Config;
        controller = new KeyboardController(streamMessageController, config, activeKeys);
    });

    it('keeps one entry per held key, however many auto-repeat events arrive', () => {
        controller.onKeyDownListener(keyEvent(65));
        controller.onKeyDownListener(keyEvent(65, true));
        controller.onKeyDownListener(keyEvent(65, true));

        expect(activeKeys.getActiveKeys()).toEqual([65]);
    });

    it('removes a key on keyup and keeps the other held keys', () => {
        controller.onKeyDownListener(keyEvent(65));
        controller.onKeyDownListener(keyEvent(66));

        controller.onKeyUpListener(keyEvent(65));

        expect(activeKeys.getActiveKeys()).toEqual([66]);
        expect(keyUp).toHaveBeenCalledWith([65]);
    });

    it('does not grow when keys are pressed and released repeatedly', () => {
        for (let i = 0; i < 100; i++) {
            controller.onKeyDownListener(keyEvent(65));
            controller.onKeyUpListener(keyEvent(65));
        }

        expect(activeKeys.getActiveKeys()).toEqual([]);
    });
});

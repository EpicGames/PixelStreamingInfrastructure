import { StreamMessageController } from '../UeInstanceMessage/StreamMessageController';
import { InputCoordTranslator } from '../Util/InputCoordTranslator';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
import { TouchControllerFake } from './TouchControllerFake';

describe('TouchControllerFake', () => {
    let parent: HTMLDivElement;
    let mouseUp: jest.Mock;
    let converter: InputCoordTranslator;
    let controller: TouchControllerFake;

    beforeEach(() => {
        parent = document.createElement('div');
        const videoPlayer = {
            isVideoReady: () => true,
            getVideoElement: () => parent,
            getVideoParentElement: () => parent
        } as unknown as VideoPlayer;
        const streamMessageController = new StreamMessageController();
        mouseUp = jest.fn();
        streamMessageController.toStreamerHandlers.set('MouseUp', mouseUp);
        converter = new InputCoordTranslator();
        converter.reconfigure({ width: 100, height: 100 }, { width: 100, height: 100 });
        controller = new TouchControllerFake(streamMessageController, videoPlayer, converter);
    });

    it('listens for touchcancel on the document and removes it on unregister', () => {
        const add = jest.spyOn(document, 'addEventListener');
        const remove = jest.spyOn(document, 'removeEventListener');

        controller.register();
        expect(add).toHaveBeenCalledWith('touchcancel', controller.onTouchEndListener);

        controller.unregister();
        expect(remove).toHaveBeenCalledWith('touchcancel', controller.onTouchEndListener);
        add.mockRestore();
        remove.mockRestore();
    });

    it('releases the tracked finger when its touch is cancelled', () => {
        controller.fakeTouchFinger = { id: 3, x: 0, y: 0 };

        controller.onTouchEndListener({
            changedTouches: [{ identifier: 3, clientX: 5, clientY: 5 }],
            preventDefault: jest.fn()
        } as unknown as TouchEvent);

        const expected = converter.translateUnsigned(5, 5);
        expect(mouseUp).toHaveBeenCalledWith([0, expected.x, expected.y]);
        expect(controller.fakeTouchFinger).toBeNull();
    });
});

import { StreamMessageController } from '../UeInstanceMessage/StreamMessageController';
import { InputCoordTranslator } from '../Util/InputCoordTranslator';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
import { TouchController } from './TouchController';

describe('TouchController', () => {
    let video: HTMLVideoElement;
    let touchEnd: jest.Mock;
    let controller: TouchController;

    beforeEach(() => {
        video = document.createElement('video');
        const videoPlayer = {
            isVideoReady: () => true,
            getVideoElement: () => video,
            getVideoParentElement: () => video
        } as unknown as VideoPlayer;
        const streamMessageController = new StreamMessageController();
        touchEnd = jest.fn();
        streamMessageController.toStreamerHandlers.set('TouchStart', jest.fn());
        streamMessageController.toStreamerHandlers.set('TouchEnd', touchEnd);
        const converter = new InputCoordTranslator();
        converter.reconfigure({ width: 100, height: 100 }, { width: 100, height: 100 });
        controller = new TouchController(streamMessageController, videoPlayer, converter);
    });

    it('listens for touchcancel alongside touchend and removes it on unregister', () => {
        const add = jest.spyOn(video, 'addEventListener');
        const remove = jest.spyOn(video, 'removeEventListener');

        controller.register();
        expect(add).toHaveBeenCalledWith('touchcancel', controller.onTouchEndListener);

        controller.unregister();
        expect(remove).toHaveBeenCalledWith('touchcancel', controller.onTouchEndListener);
    });

    it('releases the finger of a cancelled touch', () => {
        const touch = { identifier: 7, clientX: 10, clientY: 10, force: 0 };
        controller.onTouchStartListener({
            changedTouches: [touch],
            touches: [touch],
            preventDefault: jest.fn()
        } as unknown as TouchEvent);
        expect(controller.fingerIds.has(7)).toBe(true);

        controller.onTouchEndListener({
            changedTouches: [touch],
            touches: [],
            preventDefault: jest.fn()
        } as unknown as TouchEvent);

        expect(touchEnd).toHaveBeenCalledTimes(1);
        expect(controller.fingerIds.has(7)).toBe(false);
    });
});

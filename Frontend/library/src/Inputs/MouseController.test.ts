import { Config } from '../Config/Config';
import { StreamMessageController } from '../UeInstanceMessage/StreamMessageController';
import { InputCoordTranslator } from '../Util/InputCoordTranslator';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
import { ActiveKeys } from './InputClassesFactory';
import { MouseController } from './MouseController';

describe('MouseController leaving the video with a button held', () => {
    it('sends MouseUp at the coordinate translated once', () => {
        const parent = document.createElement('div');
        const videoPlayer = {
            isVideoReady: () => true,
            getVideoParentElement: () => parent
        } as unknown as VideoPlayer;
        const streamMessageController = new StreamMessageController();
        const mouseUp = jest.fn();
        streamMessageController.toStreamerHandlers.set('MouseUp', mouseUp);
        const converter = new InputCoordTranslator();
        converter.reconfigure({ width: 100, height: 50 }, { width: 100, height: 50 });
        const controller = new MouseController(
            streamMessageController,
            videoPlayer,
            converter,
            new ActiveKeys(),
            {} as Config
        );

        (controller as unknown as { onMouseLeave(event: MouseEvent): void }).onMouseLeave({
            buttons: 1,
            x: 40,
            y: 20
        } as MouseEvent);

        // Translating twice would send an off-screen point instead, so compare with a single translation.
        const expected = converter.translateUnsigned(40, 20);
        expect(mouseUp).toHaveBeenCalledWith([0, expected.x, expected.y]);
    });
});

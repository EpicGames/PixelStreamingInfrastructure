import { Config } from '../Config/Config';
import { StreamMessageController } from '../UeInstanceMessage/StreamMessageController';
import { InputCoordTranslator } from '../Util/InputCoordTranslator';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
import { ActiveKeys } from './InputClassesFactory';
import { MouseControllerLocked } from './MouseControllerLocked';

describe('MouseControllerLocked pointer movement', () => {
    let parent: HTMLDivElement;
    let mouseMove: jest.Mock;
    let controller: MouseControllerLocked;

    const setParentSize = (width: number, height: number) => {
        Object.defineProperty(parent, 'clientWidth', { configurable: true, value: width });
        Object.defineProperty(parent, 'clientHeight', { configurable: true, value: height });
    };

    const move = (movementX: number, movementY: number) =>
        (controller as unknown as { onMouseMove(event: MouseEvent): void }).onMouseMove({
            movementX,
            movementY
        } as MouseEvent);

    beforeEach(() => {
        parent = document.createElement('div');
        const videoPlayer = {
            isVideoReady: () => true,
            getVideoParentElement: () => parent
        } as unknown as VideoPlayer;
        const streamMessageController = new StreamMessageController();
        mouseMove = jest.fn();
        streamMessageController.toStreamerHandlers.set('MouseMove', mouseMove);
        const converter = new InputCoordTranslator();
        converter.reconfigure({ width: 100, height: 100 }, { width: 100, height: 100 });
        controller = new MouseControllerLocked(
            streamMessageController,
            videoPlayer,
            converter,
            new ActiveKeys(),
            {} as Config
        );
    });

    it('returns instead of spinning when the parent has no size', () => {
        setParentSize(0, 0);
        controller.x = 50;

        move(5, 0);

        expect(controller.x).toBe(55);
        expect(mouseMove).toHaveBeenCalledTimes(1);
    });

    it('wraps the coordinate back inside a sized parent', () => {
        setParentSize(100, 100);
        controller.x = 98;

        move(5, 0);

        expect(controller.x).toBe(3);
        expect(mouseMove).toHaveBeenCalledTimes(1);
    });
});

import { Config, Flags } from '../Config/Config';
import { InputClassesFactory } from '../Inputs/InputClassesFactory';
import { PixelStreaming } from '../PixelStreaming/PixelStreaming';
import { mockRTCRtpReceiver, unmockRTCRtpReceiver } from '../__test__/mockRTCRtpReceiver';
import { WebRtcPlayerController } from './WebRtcPlayerController';

beforeEach(() => {
    mockRTCRtpReceiver();
});

afterEach(() => {
    unmockRTCRtpReceiver();
});

describe('WebRtcPlayerController', () => {
    it('constructs without accessing the video container or creating media resources', () => {
        const config = new Config({ initialSettings: { [Flags.DataChannelOnly]: true } });
        const getVideoContainer = jest.fn(() => document.createElement('div'));
        const stream = Object.create(PixelStreaming.prototype) as PixelStreaming;
        stream._onVideoEncoderAvgQP = jest.fn();
        Object.defineProperty(stream, 'videoElementParent', { get: getVideoContainer });

        const controller = new WebRtcPlayerController(config, stream);

        expect(getVideoContainer).not.toHaveBeenCalled();
        expect(controller.videoPlayer).toBeUndefined();
        expect(controller.streamController).toBeUndefined();
        expect(controller.freezeFrameController).toBeUndefined();
        expect(controller.coordinateConverter).toBeUndefined();

        expect(() => controller.onFreezeFrameMessage(new ArrayBuffer(0))).not.toThrow();
        expect(() => controller.invalidateFreezeFrameAndEnableVideo()).not.toThrow();
        expect(() => controller.resizePlayerStyle()).not.toThrow();
        expect(() => controller.destroyVideoPlayer()).not.toThrow();
        expect(getVideoContainer).not.toHaveBeenCalled();
    });

    it('does not attempt playback in data-channel-only mode', () => {
        const controller = Object.create(
            WebRtcPlayerController.prototype
        ) as WebRtcPlayerController;
        const dispatchEvent = jest.fn();
        controller.config = new Config({ initialSettings: { [Flags.DataChannelOnly]: true } });
        controller.pixelStreaming = { dispatchEvent } as unknown as PixelStreaming;
        controller.closeSignalingServer = jest.fn();

        controller.playStream();

        expect(dispatchEvent).not.toHaveBeenCalled();
        expect(controller.closeSignalingServer).not.toHaveBeenCalled();
    });

    it('reports a missing video player outside data-channel-only mode', () => {
        const controller = Object.create(
            WebRtcPlayerController.prototype
        ) as WebRtcPlayerController;
        const dispatchEvent = jest.fn();
        controller.config = new Config();
        controller.pixelStreaming = { dispatchEvent } as unknown as PixelStreaming;
        controller.closeSignalingServer = jest.fn();

        expect(() => controller.playStream()).not.toThrow();
        expect(dispatchEvent).toHaveBeenCalledTimes(1);
        expect(controller.closeSignalingServer).toHaveBeenCalledWith(
            'Stream not initialized correctly',
            false
        );
    });

    describe('setUpMouseAndFreezeFrame', () => {
        let controller: WebRtcPlayerController;
        let reconfigure: jest.Mock;
        let resize: jest.Mock;

        beforeEach(() => {
            controller = Object.create(WebRtcPlayerController.prototype) as WebRtcPlayerController;
            controller.config = new Config();
            controller.videoPlayer = {
                getVideoParentElement: () => ({ clientWidth: 800, clientHeight: 600 }),
                getVideoElement: () => ({ videoWidth: 1920, videoHeight: 1080 })
            } as unknown as NonNullable<WebRtcPlayerController['videoPlayer']>;
            reconfigure = jest.fn();
            resize = jest.fn();
            controller.coordinateConverter = {
                reconfigure
            } as unknown as NonNullable<WebRtcPlayerController['coordinateConverter']>;
            controller.freezeFrameController = {
                freezeFrame: { resize }
            } as unknown as NonNullable<WebRtcPlayerController['freezeFrameController']>;
        });

        it('updates coordinates and resizes the freeze frame in normal mode', () => {
            controller.setUpMouseAndFreezeFrame();

            expect(reconfigure).toHaveBeenCalledWith(
                { width: 800, height: 600 },
                { width: 1920, height: 1080 }
            );
            expect(resize).toHaveBeenCalledTimes(1);
        });

        it('skips media setup in data-channel-only mode', () => {
            controller.config = new Config({ initialSettings: { [Flags.DataChannelOnly]: true } });
            controller.videoPlayer = undefined;
            controller.coordinateConverter = undefined;
            controller.freezeFrameController = undefined;

            expect(() => controller.setUpMouseAndFreezeFrame()).not.toThrow();
        });

        it.each(['videoPlayer', 'coordinateConverter', 'freezeFrameController'] as const)(
            'fails when %s is missing in normal mode',
            (resource) => {
                controller[resource] = undefined;

                expect(() => controller.setUpMouseAndFreezeFrame()).toThrow();
            }
        );

        it.each(['getVideoParentElement', 'getVideoElement'] as const)(
            'fails when %s returns no element in normal mode',
            (getter) => {
                jest.spyOn(controller.videoPlayer, getter).mockReturnValue(null);

                expect(() => controller.setUpMouseAndFreezeFrame()).toThrow();
            }
        );
    });

    it('does not register pointer input handlers when the video player is absent', () => {
        const controller = Object.create(
            WebRtcPlayerController.prototype
        ) as WebRtcPlayerController;
        const registerMouse = jest.fn();
        const registerTouch = jest.fn();

        controller.config = new Config();
        controller.inputClassesFactory = {
            registerMouse,
            registerTouch
        } as unknown as InputClassesFactory;

        controller.setMouseInputEnabled(true);
        controller.setTouchInputEnabled(true);

        expect(registerMouse).not.toHaveBeenCalled();
        expect(registerTouch).not.toHaveBeenCalled();
    });
});
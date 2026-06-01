import { Logger } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.8';
import { Config, Flags, NumericParameters } from '../Config/Config';
import { mockRTCRtpReceiver, unmockRTCRtpReceiver } from '../__test__/mockRTCRtpReceiver';
import { VideoPlayer } from './VideoPlayer';

/**
 * Tests for the ViewportResScale numeric parameter added to VideoPlayer.
 *
 * The callback onMatchViewportResolutionCallback is invoked with the scaled
 * viewport dimensions when MatchViewportResolution is enabled. We validate:
 *   - default scale (1.0) leaves dimensions unchanged
 *   - explicit scale multiplies both dimensions
 *   - non-integer products are rounded to integers
 *   - dimensions > 4096 emit a warning via Logger
 *   - a Config missing the setting falls back to 1.0 instead of throwing
 */
describe('VideoPlayer.updateVideoStreamSize — ViewportResScale', () => {
    let parent: HTMLDivElement;
    let config: Config;
    let player: VideoPlayer;
    let callback: jest.Mock;

    const setViewportSize = (w: number, h: number) => {
        Object.defineProperty(parent, 'clientWidth', { configurable: true, value: w });
        Object.defineProperty(parent, 'clientHeight', { configurable: true, value: h });
    };

    beforeEach(() => {
        mockRTCRtpReceiver();
        parent = document.createElement('div');
        document.body.appendChild(parent);

        config = new Config({ initialSettings: { [Flags.MatchViewportResolution]: true } });

        player = new VideoPlayer(parent, config);
        callback = jest.fn();
        player.onMatchViewportResolutionCallback = callback;

        // Bypass the 300ms throttle in updateVideoStreamSize.
        (player as unknown as { lastTimeResized: number }).lastTimeResized = 0;
    });

    afterEach(() => {
        player.destroy();
        parent.remove();
        unmockRTCRtpReceiver();
        jest.restoreAllMocks();
    });

    it('passes viewport dimensions through unchanged when scale is 1.0 (default)', () => {
        setViewportSize(375, 667);
        player.updateVideoStreamSize();
        expect(callback).toHaveBeenCalledWith(375, 667);
    });

    it('multiplies both dimensions by the configured scale', () => {
        config.setNumericSetting(NumericParameters.ViewportResScale, 2.0);
        setViewportSize(375, 667);

        // lastTimeResized was updated on construction, reset again.
        (player as unknown as { lastTimeResized: number }).lastTimeResized = 0;
        player.updateVideoStreamSize();

        expect(callback).toHaveBeenCalledWith(750, 1334);
    });

    it('rounds non-integer products to integers', () => {
        config.setNumericSetting(NumericParameters.ViewportResScale, 1.5);
        setViewportSize(375, 667);

        (player as unknown as { lastTimeResized: number }).lastTimeResized = 0;
        player.updateVideoStreamSize();

        // 375 * 1.5 = 562.5 → 563, 667 * 1.5 = 1000.5 → 1001
        expect(callback).toHaveBeenCalledWith(563, 1001);
        const [w, h] = callback.mock.calls[0] as [number, number];
        expect(Number.isInteger(w)).toBe(true);
        expect(Number.isInteger(h)).toBe(true);
    });

    it('logs a warning when scaled width or height exceeds 4096', () => {
        const warnSpy = jest.spyOn(Logger, 'Warning').mockImplementation(() => {});

        config.setNumericSetting(NumericParameters.ViewportResScale, 3.0);
        setViewportSize(2000, 1000); // 2000*3 = 6000 > 4096

        (player as unknown as { lastTimeResized: number }).lastTimeResized = 0;
        player.updateVideoStreamSize();

        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy.mock.calls[0][0]).toContain('4096');
        expect(warnSpy.mock.calls[0][0]).toContain('6000');
        expect(callback).toHaveBeenCalledWith(6000, 3000);
    });

    it('does not warn when scaled dimensions stay within the encoder limit', () => {
        const warnSpy = jest.spyOn(Logger, 'Warning').mockImplementation(() => {});

        config.setNumericSetting(NumericParameters.ViewportResScale, 2.0);
        setViewportSize(1920, 1080); // 3840 x 2160, under 4096

        (player as unknown as { lastTimeResized: number }).lastTimeResized = 0;
        player.updateVideoStreamSize();

        expect(warnSpy).not.toHaveBeenCalled();
    });

    it('falls back to scale 1.0 when the setting is not registered on the Config', () => {
        const strippedConfig = new Config({ initialSettings: { [Flags.MatchViewportResolution]: true } });
        // Remove the registration to simulate a custom Config subclass that omits it.
        const params = (strippedConfig as unknown as { numericParameters: Map<string, unknown> })
            .numericParameters;
        params.delete(NumericParameters.ViewportResScale);

        const strippedParent = document.createElement('div');
        document.body.appendChild(strippedParent);
        const strippedPlayer = new VideoPlayer(strippedParent, strippedConfig);
        const strippedCallback = jest.fn();
        strippedPlayer.onMatchViewportResolutionCallback = strippedCallback;

        Object.defineProperty(strippedParent, 'clientWidth', { configurable: true, value: 500 });
        Object.defineProperty(strippedParent, 'clientHeight', { configurable: true, value: 400 });

        (strippedPlayer as unknown as { lastTimeResized: number }).lastTimeResized = 0;
        expect(() => strippedPlayer.updateVideoStreamSize()).not.toThrow();
        expect(strippedCallback).toHaveBeenCalledWith(500, 400);

        strippedPlayer.destroy();
        strippedParent.remove();
    });

    it('does not invoke the callback when MatchViewportResolution is disabled', () => {
        config.setFlagEnabled(Flags.MatchViewportResolution, false);
        setViewportSize(375, 667);

        (player as unknown as { lastTimeResized: number }).lastTimeResized = 0;
        player.updateVideoStreamSize();

        expect(callback).not.toHaveBeenCalled();
    });
});

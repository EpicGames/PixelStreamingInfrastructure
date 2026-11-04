import { Config } from '../Config/Config';
import { mockRTCRtpReceiver, unmockRTCRtpReceiver } from '../__test__/mockRTCRtpReceiver';
import { VideoPlayer } from './VideoPlayer';

describe('VideoPlayer.setVideoEnabled', () => {
    // Config reads RTCRtpReceiver while it is built, and jsdom does not provide it.
    beforeEach(() => {
        mockRTCRtpReceiver();
    });

    afterEach(() => {
        unmockRTCRtpReceiver();
    });

    it('does nothing before a stream is attached', () => {
        const parent = document.createElement('div');
        const player = new VideoPlayer(parent, new Config());

        expect(() => player.setVideoEnabled(true)).not.toThrow();
        expect(() => player.setVideoEnabled(false)).not.toThrow();

        player.destroy();
    });

    it('toggles the tracks of the attached stream', () => {
        const parent = document.createElement('div');
        const player = new VideoPlayer(parent, new Config());
        const track = { enabled: true } as MediaStreamTrack;
        const stream = { getTracks: () => [track] } as unknown as MediaStream;
        player.getVideoElement().srcObject = stream;

        player.setVideoEnabled(false);
        expect(track.enabled).toBe(false);

        player.setVideoEnabled(true);
        expect(track.enabled).toBe(true);

        player.destroy();
    });
});

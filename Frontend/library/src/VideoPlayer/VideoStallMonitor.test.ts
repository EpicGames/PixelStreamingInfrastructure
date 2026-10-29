import { VideoStallMonitor } from './VideoStallMonitor';

// A video receiver's stats: the inbound video counters, and the selected candidate pair when a round trip is given
const receiverStats = (bytesReceived: number, framesDecoded: number, roundTripTimeSeconds?: number) => {
    const stats = new Map<string, RTCStats>();
    stats.set('inbound', {
        id: 'inbound',
        type: 'inbound-rtp',
        timestamp: 0,
        kind: 'video',
        bytesReceived,
        framesDecoded
    } as RTCStats);
    if (roundTripTimeSeconds !== undefined) {
        stats.set('pair', {
            id: 'pair',
            type: 'candidate-pair',
            timestamp: 0,
            nominated: true,
            currentRoundTripTime: roundTripTimeSeconds
        } as RTCStats);
    }
    return stats as unknown as RTCStatsReport;
};

describe('VideoStallMonitor', () => {
    let time: number;
    let requestKeyframe: jest.Mock;
    let monitor: VideoStallMonitor;
    let bytesReceived: number;

    // One stats read at the given time, with more data arrived since the last one
    const readAt = (at: number, framesDecoded: number, roundTripTimeSeconds?: number) => {
        time = at;
        bytesReceived += 1000;
        monitor.processStats(receiverStats(bytesReceived, framesDecoded, roundTripTimeSeconds));
    };

    beforeEach(() => {
        time = 0;
        bytesReceived = 0;
        requestKeyframe = jest.fn();
        monitor = new VideoStallMonitor(
            () => undefined,
            requestKeyframe,
            () => time
        );
    });

    it('should request a keyframe when data arrives but no frame is decoded for the minimum wait', () => {
        readAt(0, 10);
        readAt(250, 10); // the stall starts
        readAt(500, 10);
        expect(requestKeyframe).not.toHaveBeenCalled();

        readAt(650, 10);
        expect(requestKeyframe).toHaveBeenCalledTimes(1);
    });

    it('should not request a keyframe while frames are decoded', () => {
        for (let at = 0; at <= 3000; at += 250) {
            readAt(at, at / 25);
        }
        expect(requestKeyframe).not.toHaveBeenCalled();
    });

    it('should not request a keyframe when no data arrives', () => {
        monitor.processStats(receiverStats(1000, 10));
        for (let at = 250; at <= 3000; at += 250) {
            time = at;
            monitor.processStats(receiverStats(1000, 10));
        }
        expect(requestKeyframe).not.toHaveBeenCalled();
    });

    it('should not request a keyframe before the first frame is decoded', () => {
        for (let at = 0; at <= 3000; at += 250) {
            readAt(at, 0);
        }
        expect(requestKeyframe).not.toHaveBeenCalled();
    });

    it('should wait three round trips on a slow link, up to the maximum wait', () => {
        // 300 ms round trip: wait 900 ms
        readAt(0, 10, 0.3);
        readAt(100, 10, 0.3); // the stall starts
        readAt(950, 10, 0.3);
        expect(requestKeyframe).not.toHaveBeenCalled();
        readAt(1000, 10, 0.3);
        expect(requestKeyframe).toHaveBeenCalledTimes(1);

        // 2 s round trip: the wait is capped
        monitor.stop();
        requestKeyframe.mockClear();
        readAt(10000, 10, 2);
        readAt(10100, 10, 2); // the stall starts
        readAt(11550, 10, 2);
        expect(requestKeyframe).not.toHaveBeenCalled();
        readAt(11600, 10, 2);
        expect(requestKeyframe).toHaveBeenCalledTimes(1);
    });

    it('should space requests while the stall goes on', () => {
        readAt(0, 10);
        readAt(250, 10); // the stall starts
        readAt(650, 10);
        expect(requestKeyframe).toHaveBeenCalledTimes(1);

        readAt(2000, 10);
        expect(requestKeyframe).toHaveBeenCalledTimes(1);
        readAt(2150, 10);
        expect(requestKeyframe).toHaveBeenCalledTimes(2);
    });

    it('should start over after a frame is decoded', () => {
        readAt(0, 10);
        readAt(250, 10); // the stall starts
        readAt(500, 11); // a frame was decoded
        readAt(750, 11); // a new stall starts
        readAt(1000, 11);
        expect(requestKeyframe).not.toHaveBeenCalled();
        readAt(1150, 11);
        expect(requestKeyframe).toHaveBeenCalledTimes(1);
    });

    it('should read the stats on an interval between start and stop', async () => {
        jest.useFakeTimers();
        try {
            const getStats = jest.fn(() => Promise.resolve(receiverStats(1000, 10)));
            monitor = new VideoStallMonitor(getStats, requestKeyframe, () => time);

            monitor.start();
            await jest.advanceTimersByTimeAsync(VideoStallMonitor.pollIntervalMs * 2);
            expect(getStats).toHaveBeenCalledTimes(2);

            monitor.stop();
            await jest.advanceTimersByTimeAsync(VideoStallMonitor.pollIntervalMs * 2);
            expect(getStats).toHaveBeenCalledTimes(2);
        } finally {
            jest.useRealTimers();
        }
    });
});

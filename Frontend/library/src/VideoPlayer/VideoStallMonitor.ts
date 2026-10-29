// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.8';

/**
 * Asks the streamer for a keyframe when video data keeps arriving but no frame can be decoded.
 *
 * That is what a lost packet that was not recovered looks like: every later frame depends on it, so nothing decodes
 * until the next keyframe. The browser asks for one itself, but only after about three seconds without a decodable
 * frame. This asks once the stall has lasted a few round trips, so a retransmission that is still on its way gets its
 * chance first. A stall with no data arriving is left alone, because then the streamer is not sending and a keyframe
 * request would not help.
 */
export class VideoStallMonitor {
    /** How often the video receiver's stats are read, in milliseconds. */
    static readonly pollIntervalMs = 250;
    /** The shortest stall that is acted on, in milliseconds. */
    static readonly minWaitMs = 400;
    /** The wait is this many round trips, so a retransmission on its way can still arrive. */
    static readonly roundTripsToWait = 3;
    /** The longest wait, in milliseconds, however long the round trip. */
    static readonly maxWaitMs = 1500;
    /** The least time between two requests, in milliseconds, so a lossy link cannot cause a keyframe storm. */
    static readonly requestSpacingMs = 1500;

    private getStats: () => Promise<RTCStatsReport> | undefined;
    private requestKeyframe: () => void;
    private now: () => number;
    private intervalHandle: ReturnType<typeof setInterval> | undefined;
    private polling = false;
    private lastBytesReceived: number | undefined;
    private lastFramesDecoded: number | undefined;
    private stallStartTime: number | undefined;
    private lastRequestTime: number | undefined;

    /**
     * @param getStats - Returns the stats of the video receiver, or undefined when there is none
     * @param requestKeyframe - Asks the streamer for a keyframe
     * @param now - Returns the current time in milliseconds
     */
    constructor(
        getStats: () => Promise<RTCStatsReport> | undefined,
        requestKeyframe: () => void,
        now: () => number = () => performance.now()
    ) {
        this.getStats = getStats;
        this.requestKeyframe = requestKeyframe;
        this.now = now;
    }

    /**
     * Starts watching the video receiver, forgetting anything seen before.
     */
    start() {
        this.stop();
        this.intervalHandle = setInterval(() => void this.poll(), VideoStallMonitor.pollIntervalMs);
    }

    /**
     * Stops watching the video receiver.
     */
    stop() {
        if (this.intervalHandle !== undefined) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = undefined;
        }
        this.lastBytesReceived = undefined;
        this.lastFramesDecoded = undefined;
        this.stallStartTime = undefined;
        this.lastRequestTime = undefined;
    }

    /**
     * Reads the video receiver's stats once and acts on them.
     */
    async poll() {
        // getStats can take longer than the interval on a busy page, and two reads in flight would compare out of order
        if (this.polling) {
            return;
        }
        this.polling = true;
        try {
            const report = await this.getStats();
            if (report && this.intervalHandle !== undefined) {
                this.processStats(report);
            }
        } catch (error) {
            Logger.Warning(`Could not read the video receiver's stats - ${error}`);
        } finally {
            this.polling = false;
        }
    }

    /**
     * Updates the stall state from one stats report and asks for a keyframe when the stall has lasted long enough.
     * @param report - The stats of the video receiver
     */
    processStats(report: RTCStatsReport) {
        let inboundVideo: RTCInboundRtpStreamStats | undefined;
        let roundTripTimeMs = 0;
        report.forEach((stat: RTCStats) => {
            if (stat.type === 'inbound-rtp' && (stat as RTCInboundRtpStreamStats).kind === 'video') {
                inboundVideo = stat as RTCInboundRtpStreamStats;
            } else if (stat.type === 'candidate-pair') {
                const candidatePair = stat as RTCIceCandidatePairStats;
                if (candidatePair.nominated && candidatePair.currentRoundTripTime !== undefined) {
                    roundTripTimeMs = candidatePair.currentRoundTripTime * 1000;
                }
            }
        });
        if (!inboundVideo) {
            return;
        }

        const bytesReceived = inboundVideo.bytesReceived ?? 0;
        const framesDecoded = inboundVideo.framesDecoded ?? 0;
        const bytesArrived = this.lastBytesReceived !== undefined && bytesReceived > this.lastBytesReceived;
        const frameDecoded = this.lastFramesDecoded !== undefined && framesDecoded > this.lastFramesDecoded;
        this.lastBytesReceived = bytesReceived;
        this.lastFramesDecoded = framesDecoded;

        // Before the first frame the streamer is still sending its first keyframe, so there is nothing to recover
        if (framesDecoded === 0 || frameDecoded || !bytesArrived) {
            this.stallStartTime = undefined;
            return;
        }

        const now = this.now();
        if (this.stallStartTime === undefined) {
            this.stallStartTime = now;
            return;
        }

        const waitMs = Math.min(
            VideoStallMonitor.maxWaitMs,
            Math.max(VideoStallMonitor.minWaitMs, VideoStallMonitor.roundTripsToWait * roundTripTimeMs)
        );
        const stalledForMs = now - this.stallStartTime;
        if (stalledForMs < waitMs) {
            return;
        }
        if (
            this.lastRequestTime !== undefined &&
            now - this.lastRequestTime < VideoStallMonitor.requestSpacingMs
        ) {
            return;
        }

        this.lastRequestTime = now;
        Logger.Info(
            `No video frame decoded for ${Math.round(stalledForMs)} ms while video data arrives, requesting a keyframe`
        );
        this.requestKeyframe();
    }
}

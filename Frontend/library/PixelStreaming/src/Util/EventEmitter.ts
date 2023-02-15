import { LatencyTestResults } from '../DataChannel/LatencyTestResults';
import { AggregatedStats } from '../PeerConnectionController/AggregatedStats';
import { InitialSettings } from '../pixelstreamingfrontend';

export type EventAfkWarningActivate = {
    readonly type: 'afkWarningActivate';
    readonly data: {
        countDown: number;
        dismissAfk: () => void;
    };
};
export type EventAfkWarningUpdate = {
    readonly type: 'afkWarningUpdate';
    readonly data: { countDown: number };
};
export type EventAfkWarningDeactivate = {
    readonly type: 'afkWarningDeactivate';
};
export type EventAfkTimedOut = {
    readonly type: 'afkTimedOut';
};
export type EventVideoEncoderAvgQP = {
    readonly type: 'videoEncoderAvgQP';
    readonly data: { avgQP: number };
};
export type EventWebRtcSdp = {
    readonly type: 'webRtcSdp';
};
export type EventWebRtcAutoConnect = {
    readonly type: 'webRtcAutoConnect';
};
export type EventWebRtcConnecting = {
    readonly type: 'webRtcConnecting';
};
export type EventWebRtcConnected = {
    readonly type: 'webRtcConnected';
};
export type EventWebRtcFailed = {
    readonly type: 'webRtcFailed';
};
export type EventWebRtcDisconnected = {
    readonly type: 'webRtcDisconnected';
    readonly data: {
        eventString: string;
        showActionOrErrorOnDisconnect: boolean;
    };
};
export type EventDataChannelOpen = {
    readonly type: 'dataChannelOpen';
    readonly data: { label: string; event: Event };
};
export type EventDataChannelClose = {
    readonly type: 'dataChannelClose';
    readonly data: { label: string; event: Event };
};
export type EventDataChannelError = {
    readonly type: 'dataChannelError';
    readonly data: { label: string; event: Event };
};
export type EventVideoInitialized = {
    readonly type: 'videoInitialized';
};
export type EventStreamLoading = {
    readonly type: 'streamLoading';
};
export type EventPlayStreamError = {
    readonly type: 'playStreamError';
    readonly data: { message: string };
};
export type EventPlayStream = {
    readonly type: 'playStream';
};
export type EventPlayStreamRejected = {
    readonly type: 'playStreamRejected';
    readonly data: { reason: unknown };
};
export type EventLoadFreezeFrame = {
    readonly type: 'loadFreezeFrame';
    readonly data: {
        shouldShowPlayOverlay: boolean;
        isValid: boolean;
        jpegData?: Uint8Array;
    };
};
export type EventHideFreezeFrame = {
    readonly type: 'hideFreezeFrame';
};
export type EventStatsReceived = {
    readonly type: 'statsReceived';
    readonly data: { aggregatedStats: AggregatedStats };
};
export type EventLatencyTestResult = {
    readonly type: 'latencyTestResult';
    readonly data: { latencyTimings: LatencyTestResults };
};
export type EventInitialSettings = {
    readonly type: 'initialSettings';
    readonly data: { settings: InitialSettings };
};

export type PixelStreamingEvent =
    | EventAfkWarningActivate
    | EventAfkWarningUpdate
    | EventAfkWarningDeactivate
    | EventAfkTimedOut
    | EventVideoEncoderAvgQP
    | EventWebRtcSdp
    | EventWebRtcAutoConnect
    | EventWebRtcConnecting
    | EventWebRtcConnected
    | EventWebRtcFailed
    | EventWebRtcDisconnected
    | EventDataChannelOpen
    | EventDataChannelClose
    | EventDataChannelError
    | EventVideoInitialized
    | EventStreamLoading
    | EventPlayStreamError
    | EventPlayStream
    | EventPlayStreamRejected
    | EventLoadFreezeFrame
    | EventHideFreezeFrame
    | EventStatsReceived
    | EventLatencyTestResult
    | EventInitialSettings;

export class EventEmitter extends EventTarget {
    public dispatchEvent(e: Event & PixelStreamingEvent): boolean {
        return super.dispatchEvent(e);
    }

    public emit(event: PixelStreamingEvent): boolean {
        return this.dispatchEvent(Object.assign(new Event(event.type), event));
    }

    public addEventListener<
        T extends PixelStreamingEvent['type'],
        E extends PixelStreamingEvent & { type: T }
    >(type: T, listener: (e: Event & E) => void) {
        super.addEventListener(type, listener);
    }

    public removeEventListener<
        T extends PixelStreamingEvent['type'],
        E extends PixelStreamingEvent & { type: T }
    >(type: T, listener: (e: Event & E) => void) {
        super.removeEventListener(type, listener);
    }
}

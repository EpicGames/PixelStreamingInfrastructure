import { LatencyTestResults } from '../DataChannel/LatencyTestResults';
import { AggregatedStats } from "../PeerConnectionController/AggregatedStats";
import { InitialSettings } from '../pixelstreamingfrontend';

export type EventType =
    | 'afkWarningActivate'
    | 'afkWarningUpdate'
    | 'afkWarningDeactivate'
    | 'afkTimedOut'
    | 'videoEncoderAvgQP'
    | 'webRtcSdp'
    | 'webRtcAutoConnect'
    | 'webRtcConnecting'
    | 'webRtcConnected'
    | 'webRtcFailed'
    | 'videoInitialized'
    | 'streamLoading'
    | 'disconnect'
    | 'playStreamError'
    | 'playStream'
    | 'playStreamRejected'
    | 'loadFreezeFrame'
    | 'hideFreezeFrame'
    | 'statsReceived' 
    | 'latencyTestResult'
    | 'initialSettings';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventCallback<T extends any[] = any[]> = (...args: T) => void;

export type EventEmitterUnregisterCallback = () => void;

export type EventArgsAfkWarningActivate = [countDown: number, dismissAfk: () => void];
export type EventArgsAfkWarningUpdate = [countDown: number];
export type EventArgsVideoEncoderAvgQP = [avgQP: number];
export type EventArgsDisconnect = [eventString: string, showActionOrErrorOnDisconnect: boolean];
export type EventArgsPlayStreamError = [message: string];
export type EventArgsPlayStreamRejected = [reason: unknown];
export type EventArgsLoadFreezeFrame = [shouldShowPlayOverlay: boolean, isValid: boolean, jpegData?: Uint8Array];
export type EventArgsStatsReceived = [aggregatedStats: AggregatedStats];
export type EventArgsLatencyTestResult = [latencyTimings: LatencyTestResults];
export type EventArgsInitialSettings = [settings: InitialSettings];

export class EventEmitter {
    private callbacks: Record<EventType, EventCallback[]> = {
        afkWarningActivate: [],
        afkWarningUpdate: [],
        afkWarningDeactivate: [],
        afkTimedOut: [],
        videoEncoderAvgQP: [],
        webRtcSdp: [],
        webRtcAutoConnect: [],
        webRtcConnecting: [],
        webRtcConnected: [],
        webRtcFailed: [],
        videoInitialized: [],
        streamLoading: [],
        disconnect: [],
        playStreamError: [],
        playStream: [],
        playStreamRejected: [],
        loadFreezeFrame: [],
        hideFreezeFrame: [],
        statsReceived: [],
        latencyTestResult: [],
        initialSettings: []
    };

    on(event: "afkWarningActivate", callback: EventCallback<EventArgsAfkWarningActivate>): EventEmitterUnregisterCallback;
    on(event: "afkWarningUpdate", callback: EventCallback<EventArgsAfkWarningUpdate>): EventEmitterUnregisterCallback;
    on(event: "afkWarningDeactivate", callback: EventCallback<[]>): EventEmitterUnregisterCallback;
    on(event: "afkTimedOut", callback: EventCallback<[]>): EventEmitterUnregisterCallback;
    on(event: "videoEncoderAvgQP", callback: EventCallback<EventArgsVideoEncoderAvgQP>): EventEmitterUnregisterCallback;
    on(event: "webRtcSdp", callback: EventCallback<[]>): EventEmitterUnregisterCallback;
    on(event: "webRtcAutoConnect", callback: EventCallback<[]>): EventEmitterUnregisterCallback;
    on(event: "webRtcConnecting", callback: EventCallback<[]>): EventEmitterUnregisterCallback;
    on(event: "webRtcConnected", callback: EventCallback<[]>): EventEmitterUnregisterCallback;
    on(event: "webRtcFailed", callback: EventCallback<[]>): EventEmitterUnregisterCallback;
    on(event: "videoInitialized", callback: EventCallback<[]>): EventEmitterUnregisterCallback;
    on(event: "streamLoading", callback: EventCallback<[]>): EventEmitterUnregisterCallback;
    on(event: "disconnect", callback: EventCallback<EventArgsDisconnect>): EventEmitterUnregisterCallback;
    on(event: "playStreamError", callback: EventCallback<EventArgsPlayStreamError>): EventEmitterUnregisterCallback;
    on(event: "playStream", callback: EventCallback<[]>): EventEmitterUnregisterCallback;
    on(event: "playStreamRejected", callback: EventCallback<EventArgsPlayStreamRejected>): EventEmitterUnregisterCallback;
    on(event: "loadFreezeFrame", callback: EventCallback<EventArgsLoadFreezeFrame>): EventEmitterUnregisterCallback;
    on(event: "hideFreezeFrame", callback: EventCallback<[]>): EventEmitterUnregisterCallback;
    on(event: "statsReceived", callback: EventCallback<EventArgsStatsReceived>): EventEmitterUnregisterCallback;
    on(event: "latencyTestResult", callback: EventCallback<EventArgsLatencyTestResult>): EventEmitterUnregisterCallback;
    on(event: "initialSettings", callback: EventCallback<EventArgsInitialSettings>): EventEmitterUnregisterCallback;
    on(event: EventType, callback: EventCallback): EventEmitterUnregisterCallback {
        this.callbacks[event].push(callback);
        return () => this.off(event, callback);
    }

    off(event: EventType, callback: EventCallback) {
        const idx = this.callbacks[event].indexOf(callback);
        if (idx >= 0) {
            this.callbacks[event].splice(idx, 1);
        }
    }

    emit(event: "afkWarningActivate", args: EventArgsAfkWarningActivate): void;
    emit(event: "afkWarningUpdate", args: EventArgsAfkWarningUpdate): void;
    emit(event: "afkWarningDeactivate"): void;
    emit(event: "afkTimedOut"): void;
    emit(event: "videoEncoderAvgQP", args: EventArgsVideoEncoderAvgQP): void;
    emit(event: "webRtcSdp"): void;
    emit(event: "webRtcAutoConnect"): void;
    emit(event: "webRtcConnecting"): void;
    emit(event: "webRtcConnected"): void;
    emit(event: "webRtcFailed"): void;
    emit(event: "videoInitialized"): void;
    emit(event: "streamLoading"): void;
    emit(event: "disconnect", args: EventArgsDisconnect): void;
    emit(event: "playStreamError", args: EventArgsPlayStreamError): void;
    emit(event: "playStream"): void;
    emit(event: "playStreamRejected", args: EventArgsPlayStreamRejected): void;
    emit(event: "loadFreezeFrame", args: EventArgsLoadFreezeFrame): void;
    emit(event: "hideFreezeFrame"): void;
    emit(event: "statsReceived", args: EventArgsStatsReceived): void;
    emit(event: "latencyTestResult", args: EventArgsLatencyTestResult): void;
    emit(event: "initialSettings", args: EventArgsInitialSettings): void;
    emit(event: EventType, args?: unknown[]): void {
        this.callbacks[event].forEach((callback) => callback(...(args || [])));
    }
}

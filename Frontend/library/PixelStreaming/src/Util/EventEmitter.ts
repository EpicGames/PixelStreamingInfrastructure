import { AggregatedStats } from "../PeerConnectionController/AggregatedStats";

export type EventType =
    | 'afkWarningActivate'
    | 'afkWarningUpdate'
    | 'afkWarningDeactivate'
    | 'afkTimedOut'
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
    | 'statsReceived';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventCallback = (...args: any[]) => void;

export type EventEmitterUnregisterCallback = () => void;

export class EventEmitter {
    private callbacks: Record<EventType, EventCallback[]> = {
        afkWarningActivate: [],
        afkWarningUpdate: [],
        afkWarningDeactivate: [],
        afkTimedOut: [],
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
        statsReceived: []
    };

    on(event: "afkWarningActivate", callback: (countDown: number, dismissAfk: () => void) => void): EventEmitterUnregisterCallback;
    on(event: "afkWarningUpdate", callback: (countDown: number) => void): EventEmitterUnregisterCallback;
    on(event: "afkWarningDeactivate", callback: () => void): EventEmitterUnregisterCallback;
    on(event: "afkTimedOut", callback: () => void): EventEmitterUnregisterCallback;
    on(event: "webRtcSdp", callback: () => void): EventEmitterUnregisterCallback;
    on(event: "webRtcAutoConnect", callback: () => void): EventEmitterUnregisterCallback;
    on(event: "webRtcConnecting", callback: () => void): EventEmitterUnregisterCallback;
    on(event: "webRtcConnected", callback: () => void): EventEmitterUnregisterCallback;
    on(event: "webRtcFailed", callback: () => void): EventEmitterUnregisterCallback;
    on(event: "videoInitialized", callback: () => void): EventEmitterUnregisterCallback;
    on(event: "streamLoading", callback: () => void): EventEmitterUnregisterCallback;
    on(event: "disconnect", callback: (eventString: string, showActionOrErrorOnDisconnect: boolean) => void): EventEmitterUnregisterCallback;
    on(event: "playStreamError", callback: (message: string) => void): EventEmitterUnregisterCallback;
    on(event: "playStream", callback: () => void): EventEmitterUnregisterCallback;
    on(event: "playStreamRejected", callback: (reason: unknown) => void): EventEmitterUnregisterCallback;
    on(event: "loadFreezeFrame", callback: (shouldShowPlayOverlay: boolean) => void): EventEmitterUnregisterCallback;
    on(event: "statsReceived", callback: (aggregatedStats: AggregatedStats) => void): EventEmitterUnregisterCallback;
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

    emit(event: "afkWarningActivate", args: [countDown: number, dismissAfk: () => void]): void;
    emit(event: "afkWarningUpdate", args: [countDown: number]): void;
    emit(event: "afkWarningDeactivate"): void;
    emit(event: "afkTimedOut"): void;
    emit(event: "webRtcSdp"): void;
    emit(event: "webRtcAutoConnect"): void;
    emit(event: "webRtcConnecting"): void;
    emit(event: "webRtcConnected"): void;
    emit(event: "webRtcFailed"): void;
    emit(event: "videoInitialized"): void;
    emit(event: "streamLoading"): void;
    emit(event: "disconnect", args: [eventString: string, showActionOrErrorOnDisconnect: boolean]): void;
    emit(event: "playStreamError", args: [message: string]): void;
    emit(event: "playStream"): void;
    emit(event: "playStreamRejected", args: [reason: unknown]): void;
    emit(event: "loadFreezeFrame", args: [shouldShowPlayOverlay: boolean]): void;
    emit(event: "statsReceived", args: [aggregatedStats: AggregatedStats]): void;
    emit(event: EventType, args?: unknown[]): void {
        this.callbacks[event].forEach((callback) => callback(...(args || [])));
    }
}

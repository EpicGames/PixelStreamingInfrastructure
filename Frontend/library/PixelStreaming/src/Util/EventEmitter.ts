import {
    FlagsIds,
    NumericParametersIds,
    OptionParametersIds,
    TextParametersIds
} from '../Config/Config';
import { LatencyTestResults } from '../DataChannel/LatencyTestResults';
import { AggregatedStats } from '../PeerConnectionController/AggregatedStats';
import { InitialSettings } from '../pixelstreamingfrontend';
import { MessageStreamerList } from '../WebSockets/MessageReceive';
import { SettingFlag } from '../Config/SettingFlag';
import { SettingNumber } from '../Config/SettingNumber';
import { SettingText } from '../Config/SettingText';
import { SettingOption } from '../Config/SettingOption';

export class AfkWarningActivateEvent extends Event {
    readonly type: 'afkWarningActivate';
    readonly data: {
        countDown: number;
        dismissAfk: () => void;
    };
    constructor(data: AfkWarningActivateEvent['data']) {
        super('afkWarningActivate');
        this.data = data;
    }
}
export class AfkWarningUpdateEvent extends Event {
    readonly type: 'afkWarningUpdate';
    readonly data: { countDown: number };
    constructor(data: AfkWarningUpdateEvent['data']) {
        super('afkWarningUpdate');
        this.data = data;
    }
}
export class AfkWarningDeactivateEvent extends Event {
    readonly type: 'afkWarningDeactivate';
    constructor() {
        super('afkWarningDeactivate');
    }
}
export class AfkTimedOutEvent extends Event {
    readonly type: 'afkTimedOut';
    constructor() {
        super('afkTimedOut');
    }
}
export class VideoEncoderAvgQPEvent extends Event {
    readonly type: 'videoEncoderAvgQP';
    readonly data: { avgQP: number };
    constructor(data: VideoEncoderAvgQPEvent['data']) {
        super('videoEncoderAvgQP');
        this.data = data;
    }
}
export class WebRtcSdpEvent extends Event {
    readonly type: 'webRtcSdp';
    constructor() {
        super('webRtcSdp');
    }
}
export class WebRtcAutoConnectEvent extends Event {
    readonly type: 'webRtcAutoConnect';
    constructor() {
        super('webRtcAutoConnect');
    }
}
export class WebRtcConnectingEvent extends Event {
    readonly type: 'webRtcConnecting';
    constructor() {
        super('webRtcConnecting');
    }
}
export class WebRtcConnectedEvent extends Event {
    readonly type: 'webRtcConnected';
    constructor() {
        super('webRtcConnected');
    }
}
export class WebRtcFailedEvent extends Event {
    readonly type: 'webRtcFailed';
    constructor() {
        super('webRtcFailed');
    }
}
export class WebRtcDisconnectedEvent extends Event {
    readonly type: 'webRtcDisconnected';
    readonly data: {
        eventString: string;
        showActionOrErrorOnDisconnect: boolean;
    };
    constructor(data: WebRtcDisconnectedEvent['data']) {
        super('webRtcDisconnected');
        this.data = data;
    }
}
export class DataChannelOpenEvent extends Event {
    readonly type: 'dataChannelOpen';
    readonly data: { label: string; event: Event };
    constructor(data: DataChannelOpenEvent['data']) {
        super('dataChannelOpen');
        this.data = data;
    }
}
export class DataChannelCloseEvent extends Event {
    readonly type: 'dataChannelClose';
    readonly data: { label: string; event: Event };
    constructor(data: DataChannelCloseEvent['data']) {
        super('dataChannelClose');
        this.data = data;
    }
}
export class DataChannelErrorEvent extends Event {
    readonly type: 'dataChannelError';
    readonly data: { label: string; event: Event };
    constructor(data: DataChannelErrorEvent['data']) {
        super('dataChannelError');
        this.data = data;
    }
}
export class VideoInitializedEvent extends Event {
    readonly type: 'videoInitialized';
    constructor() {
        super('videoInitialized');
    }
}
export class StreamLoadingEvent extends Event {
    readonly type: 'streamLoading';
    constructor() {
        super('streamLoading');
    }
}
export class PlayStreamErrorEvent extends Event {
    readonly type: 'playStreamError';
    readonly data: { message: string };
    constructor(data: PlayStreamErrorEvent['data']) {
        super('playStreamError');
        this.data = data;
    }
}
export class PlayStreamEvent extends Event {
    readonly type: 'playStream';
    constructor() {
        super('playStream');
    }
}
export class PlayStreamRejectedEvent extends Event {
    readonly type: 'playStreamRejected';
    readonly data: { reason: unknown };
    constructor(data: PlayStreamRejectedEvent['data']) {
        super('playStreamRejected');
        this.data = data;
    }
}
export class LoadFreezeFrameEvent extends Event {
    readonly type: 'loadFreezeFrame';
    readonly data: {
        shouldShowPlayOverlay: boolean;
        isValid: boolean;
        jpegData?: Uint8Array;
    };
    constructor(data: LoadFreezeFrameEvent['data']) {
        super('loadFreezeFrame');
        this.data = data;
    }
}
export class HideFreezeFrameEvent extends Event {
    readonly type: 'hideFreezeFrame';
    constructor() {
        super('hideFreezeFrame');
    }
}
export class StatsReceivedEvent extends Event {
    readonly type: 'statsReceived';
    readonly data: { aggregatedStats: AggregatedStats };
    constructor(data: StatsReceivedEvent['data']) {
        super('statsReceived');
        this.data = data;
    }
}
export class StreamerListMessageEvent extends Event {
    readonly type: 'streamerListMessage';
    readonly data: {
        messageStreamerList: MessageStreamerList;
        autoSelectedStreamerId: string | null;
    };
    constructor(data: StreamerListMessageEvent['data']) {
        super('streamerListMessage');
        this.data = data;
    }
}
export class LatencyTestResultEvent extends Event {
    readonly type: 'latencyTestResult';
    readonly data: { latencyTimings: LatencyTestResults };
    constructor(data: LatencyTestResultEvent['data']) {
        super('latencyTestResult');
        this.data = data;
    }
}
export class InitialSettingsEvent extends Event {
    readonly type: 'initialSettings';
    readonly data: { settings: InitialSettings };
    constructor(data: InitialSettingsEvent['data']) {
        super('initialSettings');
        this.data = data;
    }
}

export type SettingsData =
    | {
          id: FlagsIds;
          type: 'flag';
          value: boolean;
          target: SettingFlag;
      }
    | {
          id: NumericParametersIds;
          type: 'number';
          value: number;
          target: SettingNumber;
      }
    | {
          id: TextParametersIds;
          type: 'text';
          value: string;
          target: SettingText;
      }
    | {
          id: OptionParametersIds;
          type: 'option';
          value: string;
          target: SettingOption;
      };

export class SettingsChangedEvent extends Event {
    readonly type: 'settingsChanged';
    readonly data: SettingsData;
    constructor(data: SettingsChangedEvent['data']) {
        super('settingsChanged');
        this.data = data;
    }
}

export type PixelStreamingEvent =
    | AfkWarningActivateEvent
    | AfkWarningUpdateEvent
    | AfkWarningDeactivateEvent
    | AfkTimedOutEvent
    | VideoEncoderAvgQPEvent
    | WebRtcSdpEvent
    | WebRtcAutoConnectEvent
    | WebRtcConnectingEvent
    | WebRtcConnectedEvent
    | WebRtcFailedEvent
    | WebRtcDisconnectedEvent
    | DataChannelOpenEvent
    | DataChannelCloseEvent
    | DataChannelErrorEvent
    | VideoInitializedEvent
    | StreamLoadingEvent
    | PlayStreamErrorEvent
    | PlayStreamEvent
    | PlayStreamRejectedEvent
    | LoadFreezeFrameEvent
    | HideFreezeFrameEvent
    | StatsReceivedEvent
    | StreamerListMessageEvent
    | LatencyTestResultEvent
    | InitialSettingsEvent
    | SettingsChangedEvent;

export class EventEmitter extends EventTarget {
    public dispatchEvent(e: PixelStreamingEvent): boolean {
        return super.dispatchEvent(e);
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

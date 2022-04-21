import { webRtcPlayerController } from "./WebRtcPlayer/WebRtcPlayerController"
import { Config, ControlSchemeType } from "./Config/Config"
import { IDelegate } from "./Delegate/IDelegate"
import { DelegateBase } from "./Delegate/DelegateBase"
import { IWebRtcPlayerController } from "./WebRtcPlayer/IWebRtcPlayerController"

import { OverlayController } from './Overlay/OverlayController';
import { AfkOverlayController } from './Overlay/AfkOverlayController';
import { LatencyTestResults } from "./DataChannel/LatencyTestResults";
import { Encoder, InitialSettings, WebRTC } from './DataChannel/InitialSettings';
import { AggregatedStats } from './PeerConnectionController/AggregatedStats';
import { IAfkOverlayController } from './Overlay/IAfkOverlayController';
import { MessageInstanceState, InstanceState, MessageAuthResponse, MessageAuthResponseOutcomeType } from './WebSockets/MessageReceive';
import { Logger } from './Logger/Logger';

export { Config, ControlSchemeType, webRtcPlayerController, IDelegate, DelegateBase, IWebRtcPlayerController }
export { LatencyTestResults, OverlayController, AfkOverlayController, Encoder, InitialSettings, WebRTC, AggregatedStats, IAfkOverlayController, MessageInstanceState, InstanceState, MessageAuthResponse, MessageAuthResponseOutcomeType, Logger }

declare var LIBRARY_VERSION : string;
export const version = LIBRARY_VERSION;

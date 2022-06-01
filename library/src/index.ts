import { webRtcPlayerController } from "./WebRtcPlayer/WebRtcPlayerController"
import { Config, ControlSchemeType } from "./Config/Config"
import { IDelegate } from "./Delegate/IDelegate"
import { DelegateBase } from "./Delegate/DelegateBase"
import { IWebRtcPlayerController } from "./WebRtcPlayer/IWebRtcPlayerController"

import { IOverlay } from './Overlay/IOverlay';
import { ITextOverlay } from './Overlay/ITextOverlay';
import { IActionOverlay } from "./Overlay/IActionOverlay"
import { IAfkOverlay } from './Overlay/IAfkOverlay';
import { AfkLogic } from './Afk/AfkLogic';

import { LatencyTestResults } from "./DataChannel/LatencyTestResults";
import { Encoder, InitialSettings, WebRTC } from './DataChannel/InitialSettings';
import { AggregatedStats } from './PeerConnectionController/AggregatedStats';
import { MessageInstanceState, InstanceState, MessageAuthResponse, MessageAuthResponseOutcomeType } from './WebSockets/MessageReceive';
import { Logger } from './Logger/Logger';

export { Config, ControlSchemeType, webRtcPlayerController, IDelegate, DelegateBase, IWebRtcPlayerController }
export { LatencyTestResults, IOverlay, IActionOverlay, ITextOverlay, IAfkOverlay, AfkLogic, Encoder, InitialSettings, WebRTC, AggregatedStats, MessageInstanceState, InstanceState, MessageAuthResponse, MessageAuthResponseOutcomeType, Logger }

declare var LIBRARY_VERSION: string;
export const version = LIBRARY_VERSION;

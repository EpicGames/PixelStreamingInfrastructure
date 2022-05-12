import { webRtcPlayerController } from "./WebRtcPlayer/WebRtcPlayerController"
import { Config, ControlSchemeType } from "./Config/Config"
import { IDelegate } from "./Delegate/IDelegate"
import { DelegateBase } from "./Delegate/DelegateBase"
import { IWebRtcPlayerController } from "./WebRtcPlayer/IWebRtcPlayerController"

import { Overlay } from './Overlay/Overlay';
import { IOverlay } from './Overlay/IOverlay';
import { AfkLogic } from './Overlay/AfkLogic';
import { IAfkLogic } from './Overlay/IAfkLogic';
import { FreezeFrameLogic } from './Overlay/FreezeFrameLogic';
import { LatencyTestResults } from "./DataChannel/LatencyTestResults";
import { Encoder, InitialSettings, WebRTC } from './DataChannel/InitialSettings';
import { AggregatedStats } from './PeerConnectionController/AggregatedStats';
import { MessageInstanceState, InstanceState, MessageAuthResponse, MessageAuthResponseOutcomeType } from './WebSockets/MessageReceive';
import { Logger } from './Logger/Logger';

export { Config, ControlSchemeType, webRtcPlayerController, IDelegate, DelegateBase, IWebRtcPlayerController }
export { LatencyTestResults, Overlay, IOverlay, AfkLogic, IAfkLogic, FreezeFrameLogic, Encoder, InitialSettings, WebRTC, AggregatedStats, MessageInstanceState, InstanceState, MessageAuthResponse, MessageAuthResponseOutcomeType, Logger }

declare var LIBRARY_VERSION: string;
export const version = LIBRARY_VERSION;

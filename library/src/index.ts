import { webRtcPlayerController } from "./WebRtcPlayer/WebRtcPlayerController"
import { Config, ControlSchemeType } from "./Config/Config"
import { IDelegate } from "./Delegate/IDelegate"
import { DelegateBase } from "./Delegate/DelegateBase"
import { IWebRtcPlayerController } from "./WebRtcPlayer/IWebRtcPlayerController"

import { OverlayController } from './Overlay/OverlayController';
import { IOverlayController } from './Overlay/IOverlayController';
import { AfkOverlayController } from './Overlay/AfkOverlayController';
import { IAfkOverlayController } from './Overlay/IAfkOverlayController';
import { FreezeFrameController } from './Overlay/FreezeFrameController';
import { IFreezeFrameController } from './Overlay/IFreezeFrameController';
import { LatencyTestResults } from "./DataChannel/LatencyTestResults";
import { Encoder, InitialSettings, WebRTC } from './DataChannel/InitialSettings';
import { AggregatedStats } from './PeerConnectionController/AggregatedStats';
import { MessageInstanceState, InstanceState, MessageAuthResponse, MessageAuthResponseOutcomeType } from './WebSockets/MessageReceive';
import { Logger } from './Logger/Logger';

export { Config, ControlSchemeType, webRtcPlayerController, IDelegate, DelegateBase, IWebRtcPlayerController }
export { LatencyTestResults, OverlayController, IOverlayController, AfkOverlayController, IAfkOverlayController, FreezeFrameController, IFreezeFrameController, Encoder, InitialSettings, WebRTC, AggregatedStats, MessageInstanceState, InstanceState, MessageAuthResponse, MessageAuthResponseOutcomeType, Logger }

declare var LIBRARY_VERSION: string;
export const version = LIBRARY_VERSION;

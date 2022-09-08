export { webRtcPlayerController } from "./WebRtcPlayer/WebRtcPlayerController"
export { Config, ControlSchemeType } from "./Config/Config"
export { IDelegate } from "./Delegate/IDelegate"
export { DelegateBase } from "./Delegate/DelegateBase"
export { IWebRtcPlayerController } from "./WebRtcPlayer/IWebRtcPlayerController"

export { IOverlay } from './Overlay/IOverlay';
export { ITextOverlay } from './Overlay/ITextOverlay';
export { IActionOverlay } from "./Overlay/IActionOverlay"
export { IAfkOverlay } from './Overlay/IAfkOverlay';
export { AfkLogic } from './Afk/AfkLogic';

export { LatencyTestResults } from "./DataChannel/LatencyTestResults";
export { Encoder, InitialSettings, WebRTC } from './DataChannel/InitialSettings';
export { AggregatedStats } from './PeerConnectionController/AggregatedStats';
export { MessageInstanceState, InstanceState, MessageAuthResponse, MessageAuthResponseOutcomeType } from './WebSockets/MessageReceive';
export { Logger } from './Logger/Logger';

declare var LIBRARY_VERSION: string;
export const version = LIBRARY_VERSION;

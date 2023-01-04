export { webRtcPlayerController } from "./WebRtcPlayer/WebRtcPlayerController"
export { Config, ControlSchemeType, Flags, NumericParameters } from "./Config/Config"
export { SettingBase } from "./Config/SettingBase"
export { SettingFlag } from "./Config/SettingFlag"
export { SettingPanel } from "./Config/SettingPanel"
export { StatsPanel } from "./Ui/StatsPanel"
export { SettingNumber } from "./Config/SettingNumber"
export { LabelledButton } from "./Ui/LabelledButton"
export { IDelegate } from "./Delegate/IDelegate"
export { DelegateBase } from "./Delegate/DelegateBase"
export { IWebRtcPlayerController } from "./WebRtcPlayer/IWebRtcPlayerController"

export { IOverlay } from './Overlay/IOverlay';
export { ITextOverlay } from './Overlay/ITextOverlay';
export { IActionOverlay } from "./Overlay/IActionOverlay"
export { IAfkOverlay } from './Overlay/IAfkOverlay';
export { AfkLogic } from './Afk/AfkLogic';

export { LatencyTestResults } from "./DataChannel/LatencyTestResults";
export { EncoderSettings, InitialSettings, WebRTCSettings } from './DataChannel/InitialSettings';
export { AggregatedStats } from './PeerConnectionController/AggregatedStats';
export { MessageAuthResponse, MessageAuthResponseOutcomeType } from './WebSockets/MessageReceive';
export { Logger } from './Logger/Logger';
export { UnquantisedAndDenormaliseUnsigned } from './NormalizeAndQuantize/NormalizeAndQuantize';
export { MessageSend } from "./WebSockets/MessageSend"
export { MessageRecv } from "./WebSockets/MessageReceive"

declare var LIBRARY_VERSION: string;
export const version = LIBRARY_VERSION;

export { WebRtcPlayerController } from "./WebRtcPlayer/WebRtcPlayerController"
export { Config, ControlSchemeType, Flags, NumericParameters, TextParameters } from "./Config/Config"
export { SettingBase } from "./Config/SettingBase"
export { SettingFlag } from "./Config/SettingFlag"
export { SettingsPanel } from "./Ui/SettingsPanel"
export { StatsPanel } from "./Ui/StatsPanel"
export { SettingNumber } from "./Config/SettingNumber"
export { LabelledButton } from "./Ui/LabelledButton"
export { Application } from "./Application/Application"

export { AfkLogic } from './Afk/AfkLogic';

export { LatencyTestResults } from "./DataChannel/LatencyTestResults";
export { EncoderSettings, InitialSettings, WebRTCSettings } from './DataChannel/InitialSettings';
export { AggregatedStats } from './PeerConnectionController/AggregatedStats';
export { Logger } from './Logger/Logger';
export { UnquantisedAndDenormaliseUnsigned } from './NormalizeAndQuantize/NormalizeAndQuantize';
export { MessageSend } from "./WebSockets/MessageSend"
export { MessageRecv } from "./WebSockets/MessageReceive"
export { WebSocketController } from "./WebSockets/WebSocketController"
export { SignallingProtocol } from "./WebSockets/SignallingProtocol"

declare let LIBRARY_VERSION: string;
export const version = LIBRARY_VERSION;

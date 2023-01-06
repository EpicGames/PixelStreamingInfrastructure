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

export { ActionOverlay } from "./Overlay/ActionOverlay";
export { AfkOverlay } from "./Overlay/AfkOverlay";
export { OverlayBase } from "./Overlay/BaseOverlay";
export { ConnectOverlay } from "./Overlay/ConnectOverlay";
export { DisconnectOverlay } from "./Overlay/DisconnectOverlay";
export { ErrorOverlay } from "./Overlay/ErrorOverlay";
export { InfoOverlay } from "./Overlay/InfoOverlay";
export { PlayOverlay } from "./Overlay/PlayOverlay";
export { TextOverlay } from "./Overlay/TextOverlay";

declare let LIBRARY_VERSION: string;
export const version = LIBRARY_VERSION;

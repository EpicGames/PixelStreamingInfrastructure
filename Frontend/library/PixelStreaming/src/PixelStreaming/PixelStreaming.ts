// Copyright Epic Games, Inc. All Rights Reserved.

import { Config, OptionParameters } from '../Config/Config';
import { LatencyTestResults } from '../DataChannel/LatencyTestResults';
import { AggregatedStats } from '../PeerConnectionController/AggregatedStats';
import { WebRtcPlayerController } from '../WebRtcPlayer/WebRtcPlayerController';
import { Flags, NumericParameters } from '../Config/Config';
import { Logger } from '../Logger/Logger';
import {
    InitialSettings,
    EncoderSettings,
    WebRTCSettings
} from '../DataChannel/InitialSettings';
import { OnScreenKeyboard } from '../UI/OnScreenKeyboard';
import { EventEmitter } from '../Util/EventEmitter';
import { MessageOnScreenKeyboard } from '../WebSockets/MessageReceive';
import { WebXRController } from '../WebXR/WebXRController';

export interface PixelStreamingOverrides {
    videoElementParent?: HTMLElement;
}

/**
 * Provides common base functionality for applications that extend this application
 */
export class PixelStreaming {
    public webRtcController: WebRtcPlayerController;
    public webXrController: WebXRController;
    public config: Config;

    _videoElementParent: HTMLElement;

    showActionOrErrorOnDisconnect = true;

    onScreenKeyboardHelper: OnScreenKeyboard;

    videoStartTime: number;
    inputController: boolean;

    eventEmitter: EventEmitter

    /**
     * @param config - A newly instantiated config object
     * @param overrides - Parameters to override default behaviour
     * returns the base delegate object with the config inside it along with a new instance of the Overlay controller class
     */
    constructor(config: Config, overrides?: PixelStreamingOverrides) {
        this.config = config;

        if (overrides?.videoElementParent) {
            this._videoElementParent = overrides.videoElementParent;
        }

        this.eventEmitter = new EventEmitter();

        this.configureSettings();

        // setup WebRTC
        this.setWebRtcPlayerController(
            new WebRtcPlayerController(this.config, this)
        );

        // Onscreen keyboard
        this.onScreenKeyboardHelper = new OnScreenKeyboard(
            this.videoElementParent
        );
        this.onScreenKeyboardHelper.unquantizeAndDenormalizeUnsigned = (
            x: number,
            y: number
        ) =>
            this.webRtcController.requestUnquantizedAndDenormalizeUnsigned(
                x,
                y
            );
        this.activateOnScreenKeyboard = (command: MessageOnScreenKeyboard) =>
            this.onScreenKeyboardHelper.showOnScreenKeyboard(command);

        this.updateColors(this.config.isFlagEnabled(Flags.LightMode));

        this.webXrController = new WebXRController(this.webRtcController);
    }

    /**
     * Gets the element that contains the video stream element.
     */
    public get videoElementParent(): HTMLElement {
        if (!this._videoElementParent) {
            this._videoElementParent = document.createElement('div');
            this._videoElementParent.id = 'videoElementParent';
        }
        return this._videoElementParent;
    }

    /**
     * Configure the settings with on change listeners and any additional per experience settings.
     */
    configureSettings(): void {
        this.config.addOnSettingChangedListener(
            Flags.IsQualityController,
            (wantsQualityController: boolean) => {
                // If the setting has been set to true (either programatically or the user has flicked the toggle)
                // and we aren't currently quality controller, send the request
                if (
                    wantsQualityController === true &&
                    !this.webRtcController.isQualityController
                ) {
                    this.webRtcController.sendRequestQualityControlOwnership();
                }
            }
        );

        this.config.addOnSettingChangedListener(
            Flags.AFKDetection,
            (isAFKEnabled: boolean) => {
                this.webRtcController.setAfkEnabled(isAFKEnabled);
            }
        );

        this.config.addOnSettingChangedListener(
            Flags.MatchViewportResolution,
            () => {
                this.webRtcController.videoPlayer.updateVideoStreamSize();
            }
        );

        this.config.addOnSettingChangedListener(
            Flags.HoveringMouseMode,
            (isHoveringMouse: boolean) => {
                this.config.setFlagLabel(
                    Flags.HoveringMouseMode,
                    `Control Scheme: ${
                        isHoveringMouse ? 'Hovering' : 'Locked'
                    } Mouse`
                );
                this.webRtcController.activateRegisterMouse();
            }
        );

        this.config.addOnSettingChangedListener(
            Flags.LightMode,
            (isLightMode: boolean) => {
                this.config.setFlagLabel(
                    Flags.LightMode,
                    `Color Scheme: ${isLightMode ? 'Light' : 'Dark'} Mode`
                );
                this.updateColors(isLightMode);
            }
        );

        // encoder settings
        this.config.addOnNumericSettingChangedListener(
            NumericParameters.MinQP,
            (newValue: number) => {
                Logger.Log(
                    Logger.GetStackTrace(),
                    '--------  Sending encoder settings  --------',
                    7
                );
                const encode: EncoderSettings = {
                    MinQP: newValue,
                    MaxQP: this.config.getNumericSettingValue(
                        NumericParameters.MaxQP
                    )
                };
                this.webRtcController.sendEncoderSettings(encode);
                Logger.Log(
                    Logger.GetStackTrace(),
                    '-------------------------------------------',
                    7
                );
            }
        );

        this.config.addOnNumericSettingChangedListener(
            NumericParameters.MaxQP,
            (newValue: number) => {
                Logger.Log(
                    Logger.GetStackTrace(),
                    '--------  Sending encoder settings  --------',
                    7
                );
                const encode: EncoderSettings = {
                    MinQP: this.config.getNumericSettingValue(
                        NumericParameters.MinQP
                    ),
                    MaxQP: newValue
                };
                this.webRtcController.sendEncoderSettings(encode);
                Logger.Log(
                    Logger.GetStackTrace(),
                    '-------------------------------------------',
                    7
                );
            }
        );

        // WebRTC settings
        this.config.addOnNumericSettingChangedListener(
            NumericParameters.WebRTCMinBitrate,
            (newValue: number) => {
                Logger.Log(
                    Logger.GetStackTrace(),
                    '--------  Sending web rtc settings  --------',
                    7
                );
                const webRtcSettings: WebRTCSettings = {
                    FPS: this.config.getNumericSettingValue(
                        NumericParameters.WebRTCFPS
                    ),
                    MinBitrate: newValue * 1000,
                    MaxBitrate:
                        this.config.getNumericSettingValue(
                            NumericParameters.WebRTCMaxBitrate
                        ) * 1000
                };
                this.webRtcController.sendWebRtcSettings(webRtcSettings);
                Logger.Log(
                    Logger.GetStackTrace(),
                    '-------------------------------------------',
                    7
                );
            }
        );

        this.config.addOnNumericSettingChangedListener(
            NumericParameters.WebRTCMaxBitrate,
            (newValue: number) => {
                Logger.Log(
                    Logger.GetStackTrace(),
                    '--------  Sending web rtc settings  --------',
                    7
                );
                const webRtcSettings: WebRTCSettings = {
                    FPS: this.config.getNumericSettingValue(
                        NumericParameters.WebRTCFPS
                    ),
                    MinBitrate:
                        this.config.getNumericSettingValue(
                            NumericParameters.WebRTCMinBitrate
                        ) * 1000,
                    MaxBitrate: newValue * 1000
                };
                this.webRtcController.sendWebRtcSettings(webRtcSettings);
                Logger.Log(
                    Logger.GetStackTrace(),
                    '-------------------------------------------',
                    7
                );
            }
        );

        this.config.addOnNumericSettingChangedListener(
            NumericParameters.WebRTCFPS,
            (newValue: number) => {
                Logger.Log(
                    Logger.GetStackTrace(),
                    '--------  Sending web rtc settings  --------',
                    7
                );
                const webRtcSettings: WebRTCSettings = {
                    FPS: newValue,
                    MinBitrate:
                        this.config.getNumericSettingValue(
                            NumericParameters.WebRTCMinBitrate
                        ) * 1000,
                    MaxBitrate:
                        this.config.getNumericSettingValue(
                            NumericParameters.WebRTCMaxBitrate
                        ) * 1000
                };
                this.webRtcController.sendWebRtcSettings(webRtcSettings);
                Logger.Log(
                    Logger.GetStackTrace(),
                    '-------------------------------------------',
                    7
                );
            }
        );

        this.config.addOnOptionSettingChangedListener(
            OptionParameters.PreferredCodec,
            (newValue: string) => {
                if (this.webRtcController) {
                    this.webRtcController.setPreferredCodec(newValue);
                }
            }
        );
    }

    /**
     * Activate the on screen keyboard when receiving the command from the streamer
     * @param command - the keyboard command
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    activateOnScreenKeyboard(command: MessageOnScreenKeyboard): void {
        throw new Error('Method not implemented.');
    }

    /**
     * Set the input control ownership
     * @param inputControlOwnership - does the user have input control ownership
     */
    onInputControlOwnership(inputControlOwnership: boolean): void {
        this.inputController = inputControlOwnership;
    }

    /**
     * Instantiate the WebRTCPlayerController interface to provide WebRTCPlayerController functionality within this class and set up anything that requires it
     * @param webRtcPlayerController - a WebRtcPlayerController controller instance
     */
    setWebRtcPlayerController(webRtcPlayerController: WebRtcPlayerController) {
        this.webRtcController = webRtcPlayerController;

        this.webRtcController.setPreferredCodec(
            this.config.getSettingOption(OptionParameters.PreferredCodec)
                .selected
        );
        this.webRtcController.resizePlayerStyle();

        // set up the connect overlays action
        this.showConnectOrAutoConnectOverlays();
    }

    connect() {
        this.webRtcController.connectToSignallingServer();
    }

    reconnect() {
        this.onWebRtcAutoConnect();
        this.connect();
    }

    disconnect() {
        this.webRtcController.close();
    }

    play() {
        this.onStreamLoading();
        this.webRtcController.playStream();
    }

    restartStream() {
        this.webRtcController.restartStreamAutomatically();
    }

    /**
     * Show the Connect Overlay or auto connect
     */
    showConnectOrAutoConnectOverlays() {
        // set up if the auto play will be used or regular click to start
        if (this.config.isFlagEnabled(Flags.AutoConnect)) {
            // if autoplaying show an info overlay while while waiting for the connection to begin
            this.onWebRtcAutoConnect();
            this.webRtcController.connectToSignallingServer();
        }
    }

    /**
     * Show the webRtcAutoConnect Overlay and connect
     */
    onWebRtcAutoConnect() {
        this.eventEmitter.emit({ type: "webRtcAutoConnect" });
        this.showActionOrErrorOnDisconnect = true;
    }

    /**
     * Set up functionality to happen when receiving a webRTC answer
     */
    onWebRtcSdp() {
        this.eventEmitter.emit({ type: "webRtcSdp" });
    }

    /**
     * Shows a text overlay to alert the user the stream is currently loading
     */
    onStreamLoading() {
        this.eventEmitter.emit({ type: "streamLoading" });
    }

    /**
     * Event fired when the video is disconnected - displays the error overlay and resets the buttons stream tools upon disconnect
     * @param eventString - the event text that will be shown in the overlay
     */
    onDisconnect(eventString: string) {
        // if we have overridden the default disconnection message, assign the new value here
        if (
            this.webRtcController.getDisconnectMessageOverride() != '' &&
            this.webRtcController.getDisconnectMessageOverride() !==
                undefined &&
            this.webRtcController.getDisconnectMessageOverride() != null
        ) {
            eventString = this.webRtcController.getDisconnectMessageOverride();
            this.webRtcController.setDisconnectMessageOverride('');
        }

        this.eventEmitter.emit({ type: "webRtcDisconnected", data: { eventString, showActionOrErrorOnDisconnect: this.showActionOrErrorOnDisconnect }})
        if (this.showActionOrErrorOnDisconnect == false) {
            this.showActionOrErrorOnDisconnect = true;
        }
    }

    /**
     * Handles when Web Rtc is connecting
     */
    onWebRtcConnecting() {
        this.eventEmitter.emit({ type: "webRtcConnecting" });
    }

    /**
     * Handles when Web Rtc has connected
     */
    onWebRtcConnected() {
        this.eventEmitter.emit({ type: "webRtcConnected" });
    }

    /**
     * Handles when Web Rtc fails to connect
     */
    onWebRtcFailed() {
        this.eventEmitter.emit({ type: "webRtcFailed" });
    }

    /**
     * Handle when the Video has been Initialized
     */
    onVideoInitialized() {
        this.eventEmitter.emit({ type: "videoInitialized" });
        this.videoStartTime = Date.now();
    }

    /**
     * Set up functionality to happen when receiving latency test results
     * @param latency - latency test results object
     */
    onLatencyTestResult(latencyTimings: LatencyTestResults) {
        this.eventEmitter.emit({ type: "latencyTestResult", data: { latencyTimings }});
    }

    /**
     * Set up functionality to happen when receiving video statistics
     * @param videoStats - video statistics as a aggregate stats object
     */
    onVideoStats(videoStats: AggregatedStats) {
        // Duration
        if (!this.videoStartTime || this.videoStartTime === undefined) {
            this.videoStartTime = Date.now();
        }
        videoStats.handleSessionStatistics(this.videoStartTime, this.inputController, this.webRtcController.videoAvgQp);

        this.eventEmitter.emit({ type: "statsReceived", data: { aggregatedStats: videoStats }});
    }

    /**
     * Set up functionality to happen when calculating the average video encoder qp
     * @param QP - the quality number of the stream
     */
    onVideoEncoderAvgQP(QP: number) {
        this.eventEmitter.emit({ type: "videoEncoderAvgQP", data: { avgQP: QP }});
    }

    /**
     * Set up functionality to happen when receiving and handling initial settings for the UE app
     * @param settings - initial UE app settings
     */
    onInitialSettings(settings: InitialSettings) {
        this.eventEmitter.emit({ type: "initialSettings", data: { settings }});
        if (settings.PixelStreamingSettings) {
            const allowConsoleCommands =
                settings.PixelStreamingSettings.AllowPixelStreamingCommands;
            if (allowConsoleCommands === false) {
                Logger.Info(
                    Logger.GetStackTrace(),
                    '-AllowPixelStreamingCommands=false, sending arbitrary console commands from browser to UE is disabled.'
                );
            }
        }
        if (settings.EncoderSettings) {
            this.config.setNumericSetting(
                NumericParameters.MinQP,
                settings.EncoderSettings.MinQP
            );
            this.config.setNumericSetting(
                NumericParameters.MaxQP,
                settings.EncoderSettings.MaxQP
            );
        }
        if (settings.WebRTCSettings) {
            this.config.setNumericSetting(
                NumericParameters.WebRTCMinBitrate,
                settings.WebRTCSettings.MinBitrate
            );
            this.config.setNumericSetting(
                NumericParameters.WebRTCMinBitrate,
                settings.WebRTCSettings.MaxBitrate
            );
            this.config.setNumericSetting(
                NumericParameters.WebRTCFPS,
                settings.WebRTCSettings.FPS
            );
        }
    }

    /**
     * Set up functionality to happen when setting quality control ownership of a stream
     * @param hasQualityOwnership - does this user have quality ownership of the stream true / false
     */
    onQualityControlOwnership(hasQualityOwnership: boolean) {
        this.config.setFlagEnabled(
            Flags.IsQualityController,
            hasQualityOwnership
        );
    }

    requestLatencyTest() {
        if (!this.webRtcController.videoPlayer.isVideoReady()) {
            return false;
        }
        this.webRtcController.sendLatencyTest();
        return true;
    }

    requestShowFps() {
        if (!this.webRtcController.videoPlayer.isVideoReady()) {
            return false;
        }
        this.webRtcController.sendShowFps();
        return true;
    }

    requestIframe() {
        if (!this.webRtcController.videoPlayer.isVideoReady()) {
            return false;
        }
        this.webRtcController.sendIframeRequest();
        return true;
    }

    /**
     * Update the players color variables
     * @param isLightMode - should we use a light or dark color scheme
     */
    updateColors(isLightMode: boolean) {
        const rootElement = document.querySelector(':root') as HTMLElement;
        if (isLightMode) {
            rootElement.style.setProperty('--color0', '#e2e0dd80');
            rootElement.style.setProperty('--color1', '#FFFFFF');
            rootElement.style.setProperty('--color2', '#000000');
            rootElement.style.setProperty('--color3', '#0585fe');
            rootElement.style.setProperty('--color4', '#35b350');
            rootElement.style.setProperty('--color5', '#ffab00');
            rootElement.style.setProperty('--color6', '#e1e2dd');
            rootElement.style.setProperty('--color7', '#c3c4bf');
        } else {
            rootElement.style.setProperty('--color0', '#1D1F2280');
            rootElement.style.setProperty('--color1', '#000000');
            rootElement.style.setProperty('--color2', '#FFFFFF');
            rootElement.style.setProperty('--color3', '#0585fe');
            rootElement.style.setProperty('--color4', '#35b350');
            rootElement.style.setProperty('--color5', '#ffab00');
            rootElement.style.setProperty('--color6', '#1e1d22');
            rootElement.style.setProperty('--color7', '#3c3b40');
        }
    }

    public get events() {
        return this.eventEmitter;
    }
}

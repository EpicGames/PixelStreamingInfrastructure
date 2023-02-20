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
import {
    EventEmitter,
    InitialSettingsEvent,
    LatencyTestResultEvent,
    StatsReceivedEvent,
    StreamLoadingEvent,
    VideoEncoderAvgQPEvent,
    VideoInitializedEvent,
    WebRtcAutoConnectEvent,
    WebRtcConnectedEvent,
    WebRtcConnectingEvent,
    WebRtcDisconnectedEvent,
    WebRtcFailedEvent,
    WebRtcSdpEvent
} from '../Util/EventEmitter';
import { MessageOnScreenKeyboard } from '../WebSockets/MessageReceive';
import { WebXRController } from '../WebXR/WebXRController';

export interface PixelStreamingOverrides {
    videoElementParent?: HTMLElement;
}

/**
 * Provides common base functionality for applications that extend this application
 */
export class PixelStreaming {
    private webRtcController: WebRtcPlayerController;
    private webXrController: WebXRController;
    public config: Config;

    private _videoElementParent: HTMLElement;

    _showActionOrErrorOnDisconnect = true;

    private onScreenKeyboardHelper: OnScreenKeyboard;

    private _videoStartTime: number;
    private _inputController: boolean;

    private _eventEmitter: EventEmitter;

    /**
     * @param config - A newly instantiated config object
     * @param overrides - Parameters to override default behaviour
     * returns the base Pixel streaming object
     */
    constructor(config: Config, overrides?: PixelStreamingOverrides) {
        this.config = config;

        if (overrides?.videoElementParent) {
            this._videoElementParent = overrides.videoElementParent;
        }

        this._eventEmitter = new EventEmitter();

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
        this._activateOnScreenKeyboard = (command: MessageOnScreenKeyboard) =>
            this.onScreenKeyboardHelper.showOnScreenKeyboard(command);

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
    private configureSettings(): void {
        this.config._addOnSettingChangedListener(
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

        this.config._addOnSettingChangedListener(
            Flags.AFKDetection,
            (isAFKEnabled: boolean) => {
                this.webRtcController.setAfkEnabled(isAFKEnabled);
            }
        );

        this.config._addOnSettingChangedListener(
            Flags.MatchViewportResolution,
            () => {
                this.webRtcController.videoPlayer.updateVideoStreamSize();
            }
        );

        this.config._addOnSettingChangedListener(
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

        // encoder settings
        this.config._addOnNumericSettingChangedListener(
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

        this.config._addOnNumericSettingChangedListener(
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
        this.config._addOnNumericSettingChangedListener(
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

        this.config._addOnNumericSettingChangedListener(
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

        this.config._addOnNumericSettingChangedListener(
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

        this.config._addOnOptionSettingChangedListener(
            OptionParameters.PreferredCodec,
            (newValue: string) => {
                if (this.webRtcController) {
                    this.webRtcController.setPreferredCodec(newValue);
                }
            }
        );

        this.config._registerOnChangeEvents(this._eventEmitter);
    }

    /**
     * Activate the on screen keyboard when receiving the command from the streamer
     * @param command - the keyboard command
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _activateOnScreenKeyboard(command: MessageOnScreenKeyboard): void {
        throw new Error('Method not implemented.');
    }

    /**
     * Set the input control ownership
     * @param inputControlOwnership - does the user have input control ownership
     */
    _onInputControlOwnership(inputControlOwnership: boolean): void {
        this._inputController = inputControlOwnership;
    }

    /**
     * Instantiate the WebRTCPlayerController interface to provide WebRTCPlayerController functionality within this class and set up anything that requires it
     * @param webRtcPlayerController - a WebRtcPlayerController controller instance
     */
    private setWebRtcPlayerController(
        webRtcPlayerController: WebRtcPlayerController
    ) {
        this.webRtcController = webRtcPlayerController;

        this.webRtcController.setPreferredCodec(
            this.config.getSettingOption(OptionParameters.PreferredCodec)
                .selected
        );
        this.webRtcController.resizePlayerStyle();

        // set up the connect overlays action
        this.checkForAutoConnect();
    }

    /**
     * Connect to signaling server.
     */
    public connect() {
        this.webRtcController.connectToSignallingServer();
    }

    /**
     * Reconnects to the signaling server. If connection is up, disconnects first
     * before establishing a new connection
     */
    public reconnect() {
        this.webRtcController.restartStreamAutomatically();
    }

    /**
     * Disconnect from the signaling server and close open peer connections.
     */
    public disconnect() {
        this.webRtcController.close();
    }

    /**
     * Play the stream. Can be called only after a peer connection has been established.
     */
    public play() {
        this._onStreamLoading();
        this.webRtcController.playStream();
    }

    /**
     * Auto connect
     */
    private checkForAutoConnect() {
        // set up if the auto play will be used or regular click to start
        if (this.config.isFlagEnabled(Flags.AutoConnect)) {
            // if autoplaying show an info overlay while while waiting for the connection to begin
            this._onWebRtcAutoConnect();
            this.webRtcController.connectToSignallingServer();
        }
    }

    /**
     * Emit an event on auto connecting
     */
    _onWebRtcAutoConnect() {
        this._eventEmitter.dispatchEvent(new WebRtcAutoConnectEvent());
        this._showActionOrErrorOnDisconnect = true;
    }

    /**
     * Set up functionality to happen when receiving a webRTC answer
     */
    _onWebRtcSdp() {
        this._eventEmitter.dispatchEvent(new WebRtcSdpEvent());
    }

    /**
     * Emits a StreamLoading event
     */
    _onStreamLoading() {
        this._eventEmitter.dispatchEvent(new StreamLoadingEvent());
    }

    /**
     * Event fired when the video is disconnected - displays the error overlay and resets the buttons stream tools upon disconnect
     * @param eventString - the event text that will be shown in the overlay
     */
    _onDisconnect(eventString: string) {
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

        this._eventEmitter.dispatchEvent(
            new WebRtcDisconnectedEvent({
                eventString,
                showActionOrErrorOnDisconnect:
                    this._showActionOrErrorOnDisconnect
            })
        );
        if (this._showActionOrErrorOnDisconnect == false) {
            this._showActionOrErrorOnDisconnect = true;
        }
    }

    /**
     * Handles when Web Rtc is connecting
     */
    _onWebRtcConnecting() {
        this._eventEmitter.dispatchEvent(new WebRtcConnectingEvent());
    }

    /**
     * Handles when Web Rtc has connected
     */
    _onWebRtcConnected() {
        this._eventEmitter.dispatchEvent(new WebRtcConnectedEvent());
    }

    /**
     * Handles when Web Rtc fails to connect
     */
    _onWebRtcFailed() {
        this._eventEmitter.dispatchEvent(new WebRtcFailedEvent());
    }

    /**
     * Handle when the Video has been Initialized
     */
    _onVideoInitialized() {
        this._eventEmitter.dispatchEvent(new VideoInitializedEvent());
        this._videoStartTime = Date.now();
    }

    /**
     * Set up functionality to happen when receiving latency test results
     * @param latency - latency test results object
     */
    _onLatencyTestResult(latencyTimings: LatencyTestResults) {
        this._eventEmitter.dispatchEvent(
            new LatencyTestResultEvent({ latencyTimings })
        );
    }

    /**
     * Set up functionality to happen when receiving video statistics
     * @param videoStats - video statistics as a aggregate stats object
     */
    _onVideoStats(videoStats: AggregatedStats) {
        // Duration
        if (!this._videoStartTime || this._videoStartTime === undefined) {
            this._videoStartTime = Date.now();
        }
        videoStats.handleSessionStatistics(
            this._videoStartTime,
            this._inputController,
            this.webRtcController.videoAvgQp
        );

        this._eventEmitter.dispatchEvent(
            new StatsReceivedEvent({ aggregatedStats: videoStats })
        );
    }

    /**
     * Set up functionality to happen when calculating the average video encoder qp
     * @param QP - the quality number of the stream
     */
    _onVideoEncoderAvgQP(QP: number) {
        this._eventEmitter.dispatchEvent(
            new VideoEncoderAvgQPEvent({ avgQP: QP })
        );
    }

    /**
     * Set up functionality to happen when receiving and handling initial settings for the UE app
     * @param settings - initial UE app settings
     */
    _onInitialSettings(settings: InitialSettings) {
        this._eventEmitter.dispatchEvent(
            new InitialSettingsEvent({ settings })
        );
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
    _onQualityControlOwnership(hasQualityOwnership: boolean) {
        this.config.setFlagEnabled(
            Flags.IsQualityController,
            hasQualityOwnership
        );
    }

    /**
     * Request a connection latency test.
     * @returns
     */
    public requestLatencyTest() {
        if (!this.webRtcController.videoPlayer.isVideoReady()) {
            return false;
        }
        this.webRtcController.sendLatencyTest();
        return true;
    }

    /**
     * Request for the UE application to show FPS counter.
     * @returns
     */
    public requestShowFps() {
        if (!this.webRtcController.videoPlayer.isVideoReady()) {
            return false;
        }
        this.webRtcController.sendShowFps();
        return true;
    }

    /**
     * Request for a new IFrame from the UE application.
     * @returns
     */
    public requestIframe() {
        if (!this.webRtcController.videoPlayer.isVideoReady()) {
            return false;
        }
        this.webRtcController.sendIframeRequest();
        return true;
    }

    /**
     * Event emitter. Use to register event handlers.
     */
    public get events() {
        return this._eventEmitter;
    }

    /**
     * Enable/disable XR mode.
     */
    public toggleXR() {
        this.webXrController.xrClicked();
    }
}

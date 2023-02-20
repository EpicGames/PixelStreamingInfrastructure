// Copyright Epic Games, Inc. All Rights Reserved.

import { Config, OptionParameters } from '../Config/Config';
import { StatsPanel } from '../UI/StatsPanel';
import { LatencyTestResults } from '../DataChannel/LatencyTestResults';
import { AggregatedStats } from '../PeerConnectionController/AggregatedStats';
import { VideoQpIndicator } from '../UI/VideoQpIndicator';
import { SettingsPanel } from '../UI/SettingsPanel';
import { WebRtcPlayerController } from '../WebRtcPlayer/WebRtcPlayerController';
import { Flags, NumericParameters } from '../Config/Config';
import { Logger } from '../Logger/Logger';
import {
    InitialSettings,
    EncoderSettings,
    WebRTCSettings
} from '../DataChannel/InitialSettings';
import { OnScreenKeyboard } from '../UI/OnScreenKeyboard';
import { Controls } from '../UI/Controls';
import { LabelledButton } from '../UI/LabelledButton';
import { MessageOnScreenKeyboard } from '../WebSockets/MessageReceive';
import { WebXRController } from '../WebXR/WebXRController';

/**
 * Provides common base functionality for applications that extend this application
 */
export class PixelStreaming {
    public webRtcController: WebRtcPlayerController;
    public webXrController: WebXRController;
    public config: Config;

    _rootElement: HTMLElement;
    _uiFeatureElement: HTMLElement;
    _videoElementParent: HTMLElement;

    showActionOrErrorOnDisconnect = true;

    settingsPanel: SettingsPanel;
    statsPanel: StatsPanel;
    videoQpIndicator: VideoQpIndicator;
    onScreenKeyboardHelper: OnScreenKeyboard;

    videoStartTime: number;
    inputController: boolean;

    /**
     * @param config - A newly instantiated config object
     * returns the base delegate object with the config inside it along with a new instance of the Overlay controller class
     */
    constructor(config: Config) {
        this.config = config;

        // Add the video stream QP indicator
        this.videoQpIndicator = new VideoQpIndicator();
        this.uiFeaturesElement.appendChild(this.videoQpIndicator.rootElement);

        // Add settings panel
        this.settingsPanel = new SettingsPanel();
        this.uiFeaturesElement.appendChild(this.settingsPanel.rootElement);
        this.configureSettings();

        // Add stats panel
        this.statsPanel = new StatsPanel();
        this.uiFeaturesElement.appendChild(this.statsPanel.rootElement);

        this.createButtons();

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
     * Set up button click functions and button functionality
     */
    public createButtons() {
        // Setup controls
        const controls = new Controls();

        // When we fullscreen we want this element to be the root
        controls.fullscreenIcon.fullscreenElement = this.rootElement;
        this.uiFeaturesElement.appendChild(controls.rootElement);

        // Add settings button to controls
        controls.settingsIcon.rootElement.onclick = () =>
            this.settingsClicked();
        this.settingsPanel.settingsCloseButton.onclick = () =>
            this.settingsClicked();

        // Add WebXR button to controls
        controls.xrIcon.rootElement.onclick = () =>
            this.webXrController.xrClicked();

        // setup the stats/info button
        controls.statsIcon.rootElement.onclick = () => this.statsClicked();

        this.statsPanel.statsCloseButton.onclick = () => this.statsClicked();

        // Add button for toggle fps
        const showFPSButton = new LabelledButton('Show FPS', 'Toggle');
        showFPSButton.addOnClickListener(() => {
            this.webRtcController.sendShowFps();
        });

        // Add button for restart stream
        const restartStreamButton = new LabelledButton(
            'Restart Stream',
            'Restart'
        );
        restartStreamButton.addOnClickListener(() => {
            this.webRtcController.restartStreamAutomatically();
        });

        // Add button for request keyframe
        const requestKeyframeButton = new LabelledButton(
            'Request keyframe',
            'Request'
        );
        requestKeyframeButton.addOnClickListener(() => {
            this.webRtcController.sendIframeRequest();
        });

        const commandsSectionElem = this.config.buildSectionWithHeading(
            this.settingsPanel.settingsContentElement,
            'Commands'
        );
        commandsSectionElem.appendChild(showFPSButton.rootElement);
        commandsSectionElem.appendChild(requestKeyframeButton.rootElement);
        commandsSectionElem.appendChild(restartStreamButton.rootElement);
    }

    /**
     * Gets the rootElement of the application, video stream and all UI are children of this element.
     */
    public get rootElement(): HTMLElement {
        if (!this._rootElement) {
            this._rootElement = document.createElement('div');
            this._rootElement.id = 'playerUI';
            this._rootElement.classList.add('noselect');
            this._rootElement.appendChild(this.videoElementParent);
            this._rootElement.appendChild(this.uiFeaturesElement);
        }
        return this._rootElement;
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
     * Gets the element that contains all the UI features, like the stats and settings panels.
     */
    public get uiFeaturesElement(): HTMLElement {
        if (!this._uiFeatureElement) {
            this._uiFeatureElement = document.createElement('div');
            this._uiFeatureElement.id = 'uiFeatures';
        }
        return this._uiFeatureElement;
    }

    /**
     * Configure the settings with on change listeners and any additional per experience settings.
     */
    configureSettings(): void {
        // This builds all the settings sections and flags under this `settingsContent` element.
        this.config.populateSettingsElement(
            this.settingsPanel.settingsContentElement
        );

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
     * Shows or hides the settings panel if clicked
     */
    settingsClicked() {
        this.statsPanel.hide();
        this.settingsPanel.toggleVisibility();
    }

    /**
     * Shows or hides the stats panel if clicked
     */
    statsClicked() {
        this.settingsPanel.hide();
        this.statsPanel.toggleVisibility();
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

    play() {
        this.onStreamLoading();
        this.webRtcController.playStream();
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
        this.config.options.onWebRtcAutoConnect?.();
        this.showActionOrErrorOnDisconnect = true;
    }

    /**
     * Set up functionality to happen when receiving a webRTC answer
     */
    onWebRtcSdp() {
        this.config.options.onWebRtcSdp?.();
    }

    /**
     * Shows a text overlay to alert the user the stream is currently loading
     */
    onStreamLoading() {
        this.config.options.onStreamLoading?.();
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

        this.config.options.onDisconnect?.(eventString, this.showActionOrErrorOnDisconnect);
        if (this.showActionOrErrorOnDisconnect == false) {
            this.showActionOrErrorOnDisconnect = true;
        }

        // update all of the tools upon disconnect
        this.onVideoEncoderAvgQP(0);

        // disable starting a latency check
        this.statsPanel.latencyTest.latencyTestButton.onclick = () => {
            // do nothing
        };
    }

    /**
     * Handles when Web Rtc is connecting
     */
    onWebRtcConnecting() {
        this.config.options.onWebRtcConnecting?.();
    }

    /**
     * Handles when Web Rtc has connected
     */
    onWebRtcConnected() {
        this.config.options.onWebRtcConnected?.();
    }

    /**
     * Handles when Web Rtc fails to connect
     */
    onWebRtcFailed() {
        this.config.options.onWebRtcFailed?.();
    }

    /**
     * Handle when the Video has been Initialized
     */
    onVideoInitialized() {
        this.config.options.onVideoInitialized?.();
        // starting a latency check
        this.statsPanel.latencyTest.latencyTestButton.onclick = () => {
            this.webRtcController.sendLatencyTest();
        };

        this.videoStartTime = Date.now();
    }

    /**
     * Set up functionality to happen when receiving latency test results
     * @param latency - latency test results object
     */
    onLatencyTestResult(latencyTimings: LatencyTestResults) {
        this.statsPanel.latencyTest.handleTestResult(latencyTimings);
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
        videoStats.handleSessionStatistics(this.videoStartTime, this.inputController, this.videoQpIndicator.videoEncoderAvgQP);

        this.config.options.onStatsReceived?.(videoStats);
        // Grab all stats we can off the aggregated stats
        this.statsPanel.handleStats(videoStats);
    }

    /**
     * Set up functionality to happen when calculating the average video encoder qp
     * @param QP - the quality number of the stream
     */
    onVideoEncoderAvgQP(QP: number) {
        this.videoQpIndicator.updateQpTooltip(QP);
    }

    /**
     * Set up functionality to happen when receiving and handling initial settings for the UE app
     * @param settings - initial UE app settings
     */
    onInitialSettings(settings: InitialSettings) {
        if (settings.PixelStreamingSettings) {
            const allowConsoleCommands =
                settings.PixelStreamingSettings.AllowPixelStreamingCommands;
            if (allowConsoleCommands === false) {
                Logger.Info(
                    Logger.GetStackTrace(),
                    '-AllowPixelStreamingCommands=false, sending arbitrary console commands from browser to UE is disabled.'
                );
            }
            const disableLatencyTest =
                settings.PixelStreamingSettings.DisableLatencyTest;
            if (disableLatencyTest) {
                this.statsPanel.latencyTest.latencyTestButton.disabled = true;
                this.statsPanel.latencyTest.latencyTestButton.title =
                    'Disabled by -PixelStreamingDisableLatencyTester=true';
                Logger.Info(
                    Logger.GetStackTrace(),
                    '-PixelStreamingDisableLatencyTester=true, requesting latency report from the the browser to UE is disabled.'
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
}

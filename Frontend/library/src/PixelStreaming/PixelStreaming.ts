// Copyright Epic Games, Inc. All Rights Reserved.

import { Config, OptionParameters } from '../Config/Config';
import { LatencyTestResults } from '../DataChannel/LatencyTestResults';
import { AggregatedStats } from '../PeerConnectionController/AggregatedStats';
import { WebRtcPlayerController } from '../WebRtcPlayer/WebRtcPlayerController';
import { Flags, NumericParameters } from '../Config/Config';
import { Logger } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.7';
import { InitialSettings } from '../DataChannel/InitialSettings';
import {
    PixelStreamingEventEmitter,
    InitialSettingsEvent,
    LatencyCalculatedEvent,
    LatencyTestResultEvent,
    PixelStreamingEvent,
    StatsReceivedEvent,
    StreamLoadingEvent,
    StreamPreConnectEvent,
    StreamReconnectEvent,
    StreamPreDisconnectEvent,
    VideoEncoderAvgQPEvent,
    VideoInitializedEvent,
    WebRtcAutoConnectEvent,
    WebRtcConnectedEvent,
    WebRtcConnectingEvent,
    WebRtcDisconnectedEvent,
    WebRtcFailedEvent,
    WebRtcSdpEvent,
    DataChannelLatencyTestResponseEvent,
    DataChannelLatencyTestResultEvent,
    PlayerCountEvent,
    WebRtcTCPRelayDetectedEvent,
    SubscribeFailedEvent,
    WebRtcSdpOfferEvent,
    WebRtcSdpAnswerEvent
} from '../Util/EventEmitter';
import { WebXRController } from '../WebXR/WebXRController';
import { MessageDirection } from '../UeInstanceMessage/StreamMessageController';
import {
    DataChannelLatencyTestConfig,
    DataChannelLatencyTestController
} from '../DataChannel/DataChannelLatencyTestController';
import {
    DataChannelLatencyTestResponse,
    DataChannelLatencyTestResult
} from '../DataChannel/DataChannelLatencyTestResults';
import { RTCUtils } from '../Util/RTCUtils';
import { IURLSearchParams } from '../Util/IURLSearchParams';
import { LatencyInfo } from '../PeerConnectionController/LatencyCalculator';

export interface PixelStreamingOverrides {
    /** The DOM element where Pixel Streaming video and user input event handlers are attached to.
     * You can give an existing DOM element here. If not given, the library will create a new div element
     * that is not attached anywhere. In this case you can later get access to this new element and
     * attach it to your web page. */
    videoElementParent?: HTMLElement;
}

/**
 * The key class for the browser side of a Pixel Streaming application, it includes:
 * WebRTC handling, XR support, input handling, and emitters for lifetime and state change events.
 * Users are encouraged to use this class as is, through composition, or extend it. In any case,
 * this will likely be the core of your Pixel Streaming experience in terms of functionality.
 */
export class PixelStreaming {
    protected _webRtcController: WebRtcPlayerController;
    protected _webXrController: WebXRController;
    protected _dataChannelLatencyTestController: DataChannelLatencyTestController;

    /**
     * Configuration object. You can read or modify config through this object. Whenever
     * the configuration is changed, the library will emit a `settingsChanged` event.
     */
    public config: Config;

    private _videoElementParent: HTMLElement;

    private allowConsoleCommands = false;

    private _videoStartTime: number;
    private _inputController: boolean;

    private _eventEmitter: PixelStreamingEventEmitter;

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

        this._eventEmitter = new PixelStreamingEventEmitter();

        this.configureSettings();

        // setup WebRTC
        this.setWebRtcPlayerController(new WebRtcPlayerController(this.config, this));

        this._webXrController = new WebXRController(this._webRtcController);

        this._setupWebRtcTCPRelayDetection = this._setupWebRtcTCPRelayDetection.bind(this);

        // Add event listener for the webRtcConnected event
        this._eventEmitter.addEventListener('webRtcConnected', (_: WebRtcConnectedEvent) => {
            // Bind to the stats received event
            this._eventEmitter.addEventListener('statsReceived', this._setupWebRtcTCPRelayDetection);
        });
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
                // If the setting has been set to true (either programmatically or the user has flicked the toggle)
                // and we aren't currently quality controller, send the request
                if (wantsQualityController === true && !this._webRtcController.isQualityController) {
                    this._webRtcController.sendRequestQualityControlOwnership();
                }
            }
        );

        this.config._addOnSettingChangedListener(Flags.AFKDetection, (isAFKEnabled: boolean) => {
            this._webRtcController.setAfkEnabled(isAFKEnabled);
        });

        this.config._addOnSettingChangedListener(Flags.MatchViewportResolution, () => {
            this._webRtcController.videoPlayer.updateVideoStreamSize();
        });

        this.config._addOnSettingChangedListener(Flags.HoveringMouseMode, (isHoveringMouse: boolean) => {
            this.config.setFlagLabel(
                Flags.HoveringMouseMode,
                `Control Scheme: ${isHoveringMouse ? 'Hovering' : 'Locked'} Mouse`
            );
            this._webRtcController.setMouseInputEnabled(this.config.isFlagEnabled(Flags.MouseInput));
        });

        // user input
        this.config._addOnSettingChangedListener(Flags.KeyboardInput, (isEnabled: boolean) => {
            this._webRtcController.setKeyboardInputEnabled(isEnabled);
        });

        this.config._addOnSettingChangedListener(Flags.MouseInput, (isEnabled: boolean) => {
            this._webRtcController.setMouseInputEnabled(isEnabled);
        });

        this.config._addOnSettingChangedListener(
            Flags.FakeMouseWithTouches,
            (_isFakeMouseEnabled: boolean) => {
                this._webRtcController.setTouchInputEnabled(this.config.isFlagEnabled(Flags.TouchInput));
            }
        );

        this.config._addOnSettingChangedListener(Flags.TouchInput, (isEnabled: boolean) => {
            this._webRtcController.setTouchInputEnabled(isEnabled);
        });

        this.config._addOnSettingChangedListener(Flags.GamepadInput, (isEnabled: boolean) => {
            this._webRtcController.setGamePadInputEnabled(isEnabled);
        });

        // direct qp settings
        this.config._addOnNumericSettingChangedListener(NumericParameters.MinQP, (newValue: number) => {
            Logger.Info('--------  Sending MinQP  --------');
            this._webRtcController.sendEncoderMinQP(newValue);
            Logger.Info('-------------------------------------------');
            const quality = Math.trunc(100 * (1 - newValue / 51));
            this.config.setNumericSetting(NumericParameters.CompatQualityMax, quality);
        });

        this.config._addOnNumericSettingChangedListener(NumericParameters.MaxQP, (newValue: number) => {
            Logger.Info('--------  Sending MaxQP  --------');
            this._webRtcController.sendEncoderMaxQP(newValue);
            Logger.Info('-------------------------------------------');
            const quality = Math.trunc(100 * (1 - newValue / 51));
            this.config.setNumericSetting(NumericParameters.CompatQualityMin, quality);
        });

        // direct quality factor settings
        this.config._addOnNumericSettingChangedListener(NumericParameters.MinQuality, (newValue: number) => {
            Logger.Info('--------  Sending MinQuality  --------');
            this._webRtcController.sendEncoderMinQuality(newValue);
            Logger.Info('-------------------------------------------');
            this.config.setNumericSetting(NumericParameters.CompatQualityMin, newValue);
        });

        this.config._addOnNumericSettingChangedListener(NumericParameters.MaxQuality, (newValue: number) => {
            Logger.Info('--------  Sending MaxQuality  --------');
            this._webRtcController.sendEncoderMaxQuality(newValue);
            Logger.Info('-------------------------------------------');
            this.config.setNumericSetting(NumericParameters.CompatQualityMax, newValue);
        });

        // new quality value that gets scaled to qp for legacy reasons
        this.config._addOnNumericSettingChangedListener(
            NumericParameters.CompatQualityMin,
            (newValue: number) => {
                newValue = 51 - (newValue / 100) * 51;
                Logger.Info('--------  Sending MinQP from quality value  --------');
                this._webRtcController.sendEncoderMaxQP(newValue);
                Logger.Info('-------------------------------------------');
            }
        );

        this.config._addOnNumericSettingChangedListener(
            NumericParameters.CompatQualityMax,
            (newValue: number) => {
                newValue = 51 - (newValue / 100) * 51;
                Logger.Info('--------  Sending MaxQP from quality value  --------');
                this._webRtcController.sendEncoderMinQP(newValue);
                Logger.Info('-------------------------------------------');
            }
        );
        // WebRTC settings
        this.config._addOnNumericSettingChangedListener(
            NumericParameters.WebRTCMinBitrate,
            (newValue: number) => {
                Logger.Info('--------  Sending web rtc settings  --------');
                this._webRtcController.sendWebRTCMinBitrate(newValue * 1000 /* kbps to bps */);
                Logger.Info('-------------------------------------------');
            }
        );

        this.config._addOnNumericSettingChangedListener(
            NumericParameters.WebRTCMaxBitrate,
            (newValue: number) => {
                Logger.Info('--------  Sending web rtc settings  --------');
                this._webRtcController.sendWebRTCMaxBitrate(newValue * 1000 /* kbps to bps */);
                Logger.Info('-------------------------------------------');
            }
        );

        this.config._addOnNumericSettingChangedListener(NumericParameters.WebRTCFPS, (newValue: number) => {
            Logger.Info('--------  Sending web rtc settings  --------');
            this._webRtcController.sendWebRTCFps(newValue);
            Logger.Info('-------------------------------------------');
        });

        this.config._addOnOptionSettingChangedListener(
            OptionParameters.PreferredCodec,
            (newValue: string) => {
                if (this._webRtcController) {
                    this._webRtcController.setPreferredCodec(newValue);
                }
            }
        );

        this.config._registerOnChangeEvents(this._eventEmitter);
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
    private setWebRtcPlayerController(webRtcPlayerController: WebRtcPlayerController) {
        this._webRtcController = webRtcPlayerController;

        this._webRtcController.setPreferredCodec(
            this.config.getSettingOption(OptionParameters.PreferredCodec).selected
        );
        this._webRtcController.resizePlayerStyle();

        // connect if auto connect flag is enabled
        this.checkForAutoConnect();
    }

    /**
     * Connect to signaling server.
     */
    public connect() {
        this._eventEmitter.dispatchEvent(new StreamPreConnectEvent());
        this._webRtcController.connectToSignallingServer();
    }

    /**
     * Reconnects to the signaling server. If connection is up, disconnects first
     * before establishing a new connection
     */
    public reconnect() {
        this._eventEmitter.dispatchEvent(new StreamReconnectEvent());
        this._webRtcController.tryReconnect('Reconnecting...');
    }

    /**
     * Disconnect from the signaling server and close open peer connections.
     */
    public disconnect() {
        this._eventEmitter.dispatchEvent(new StreamPreDisconnectEvent());
        this._webRtcController.close();
    }

    /**
     * Play the stream. Can be called only after a peer connection has been established.
     */
    public play() {
        this._onStreamLoading();
        this._webRtcController.playStream();
    }

    /**
     * Auto connect if AutoConnect flag is enabled
     */
    private checkForAutoConnect() {
        // set up if the auto play will be used or regular click to start
        if (this.config.isFlagEnabled(Flags.AutoConnect)) {
            // if autoplaying show an info overlay while while waiting for the connection to begin
            this._onWebRtcAutoConnect();
            this._webRtcController.connectToSignallingServer();
        }
    }

    /**
     * Will unmute the microphone track which is sent to Unreal Engine.
     * By default, will only unmute an existing mic track.
     *
     * @param forceEnable Can be used for cases when this object wasn't initialized with a mic track.
     * If this parameter is true, the connection will be restarted with a microphone.
     * Warning: this takes some time, as a full renegotiation and reconnection will happen.
     */
    public unmuteMicrophone(forceEnable = false): void {
        // If there's an existing mic track, we just set muted state
        if (this.config.isFlagEnabled('UseMic')) {
            this.setMicrophoneMuted(false);
            return;
        }

        // If there's no pre-existing mic track, and caller is ok with full reset, we enable and reset
        if (forceEnable) {
            this.config.setFlagEnabled('UseMic', true);
            this.reconnect();
            return;
        }

        // If we prefer not to force a reconnection, just warn the user that this operation didn't happen
        Logger.Warning(
            'Trying to unmute mic, but PixelStreaming was initialized with no microphone track. Call with forceEnable == true to re-connect with a mic track.'
        );
    }

    public muteMicrophone(): void {
        if (this.config.isFlagEnabled('UseMic')) {
            this.setMicrophoneMuted(true);
            return;
        }

        // If there wasn't a mic track, just let user know there's nothing to mute
        Logger.Info(
            'Trying to mute mic, but PixelStreaming has no microphone track, so sending sound is already disabled.'
        );
    }

    private setMicrophoneMuted(mute: boolean): void {
        for (const transceiver of this._webRtcController?.peerConnectionController?.peerConnection?.getTransceivers() ??
            []) {
            if (RTCUtils.canTransceiverSendAudio(transceiver)) {
                transceiver.sender.track.enabled = !mute;
            }
        }
    }

    /**
     * Will unmute the video track which is sent to Unreal Engine.
     * By default, will only unmute an existing video track.
     *
     * @param forceEnable Can be used for cases when this object wasn't initialized with a video track.
     * If this parameter is true, the connection will be restarted with a camera.
     * Warning: this takes some time, as a full renegotiation and reconnection will happen.
     */
    public unmuteCamera(forceEnable = false): void {
        // If there's an existing video track, we just set muted state
        if (this.config.isFlagEnabled('UseCamera')) {
            this.setCameraMuted(false);
            return;
        }

        // If there's no pre-existing video track, and caller is ok with full reset, we enable and reset
        if (forceEnable) {
            this.config.setFlagEnabled('UseCamera', true);
            this.reconnect();
            return;
        }

        // If we prefer not to force a reconnection, just warn the user that this operation didn't happen
        Logger.Warning(
            'Trying to unmute video, but PixelStreaming was initialized with no video track. Call with forceEnable == true to re-connect with a video track.'
        );
    }

    public muteCamera(): void {
        if (this.config.isFlagEnabled('UseCamera')) {
            this.setCameraMuted(true);
            return;
        }

        // If there wasn't a mic track, just let user know there's nothing to mute
        Logger.Info(
            'Trying to mute camera, but PixelStreaming has no video track, so sending video is already disabled.'
        );
    }

    private setCameraMuted(mute: boolean): void {
        for (const transceiver of this._webRtcController?.peerConnectionController?.peerConnection?.getTransceivers() ??
            []) {
            if (RTCUtils.canTransceiverSendVideo(transceiver)) {
                transceiver.sender.track.enabled = !mute;
            }
        }
    }

    /**
     * Internal function to emit an event when auto connecting occurs
     */
    _onWebRtcAutoConnect() {
        this._eventEmitter.dispatchEvent(new WebRtcAutoConnectEvent());
    }

    /**
     * Internal function to emit an event for when SDP negotiation is fully finished.
     */
    _onWebRtcSdp() {
        this._eventEmitter.dispatchEvent(new WebRtcSdpEvent());
    }

    /**
     * Internal function to emit an SDP offer after it has been set.
     */
    _onWebRtcSdpOffer(offer: RTCSessionDescriptionInit) {
        this._eventEmitter.dispatchEvent(new WebRtcSdpOfferEvent({ sdp: offer }));
    }

    /**
     * Internal function to emit an SDP answer after it has been set.
     */
    _onWebRtcSdpAnswer(answer: RTCSessionDescriptionInit) {
        this._eventEmitter.dispatchEvent(new WebRtcSdpAnswerEvent({ sdp: answer }));
    }

    /**
     * Internal function call to emit a `latencyCalculated` event.
     */
    _onLatencyCalculated(latencyInfo: LatencyInfo) {
        this._eventEmitter.dispatchEvent(new LatencyCalculatedEvent({ latencyInfo }));
    }

    /**
     * Internal function to emits a StreamLoading event
     */
    _onStreamLoading() {
        this._eventEmitter.dispatchEvent(new StreamLoadingEvent());
    }

    /**
     * Event fired when the video is disconnected - emits given eventString or an override
     * message from webRtcController if one has been set
     * @param eventString - a string describing why the connection closed
     * @param allowClickToReconnect - true if we want to allow the user to retry the connection with a click
     */
    _onDisconnect(eventString: string, allowClickToReconnect: boolean) {
        this._eventEmitter.dispatchEvent(
            new WebRtcDisconnectedEvent({
                eventString: eventString,
                allowClickToReconnect: allowClickToReconnect
            })
        );
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
        this.checkForAutoEnterVR();
    }

    /**
     * If the AutoEnterVR flag is set and an immersive-vr session is supported,
     * request the WebXR session. Browsers typically require a user gesture for
     * `requestSession`; if no gesture is currently active the request will be
     * rejected and a warning is logged. Callers that need a guaranteed entry
     * (e.g. AutoConnect from a fresh page load) should still wire up a button.
     */
    private checkForAutoEnterVR() {
        if (!this.config.isFlagEnabled(Flags.AutoEnterVR)) {
            return;
        }
        WebXRController.isSessionSupported('immersive-vr')
            .then((supported: boolean) => {
                if (!supported) {
                    Logger.Info('AutoEnterVR is on but immersive-vr is not supported on this device.');
                    return;
                }
                this._webXrController.xrClicked();
            })
            .catch((err: unknown) => {
                const msg = err instanceof Error ? err.message : JSON.stringify(err);
                Logger.Warning(`AutoEnterVR check failed: ${msg}`);
            });
    }

    /**
     * Set up functionality to happen when receiving latency test results
     * @param latency - latency test results object
     */
    _onLatencyTestResult(latencyTimings: LatencyTestResults) {
        this._eventEmitter.dispatchEvent(new LatencyTestResultEvent({ latencyTimings }));
    }

    _onDataChannelLatencyTestResponse(response: DataChannelLatencyTestResponse) {
        this._eventEmitter.dispatchEvent(new DataChannelLatencyTestResponseEvent({ response }));
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
            this._webRtcController.videoAvgQp
        );

        this._eventEmitter.dispatchEvent(new StatsReceivedEvent({ aggregatedStats: videoStats }));
    }

    /**
     * Set up functionality to happen when calculating the average video encoder qp
     * @param QP - the quality number of the stream
     */
    _onVideoEncoderAvgQP(QP: number) {
        this._eventEmitter.dispatchEvent(new VideoEncoderAvgQPEvent({ avgQP: QP }));
    }

    /**
     * Set up functionality to happen when receiving and handling initial settings for the UE app
     * @param settings - initial UE app settings
     */
    _onInitialSettings(settings: InitialSettings) {
        this._eventEmitter.dispatchEvent(new InitialSettingsEvent({ settings }));
        if (settings.PixelStreamingSettings) {
            this.allowConsoleCommands = settings.PixelStreamingSettings.AllowPixelStreamingCommands ?? false;
            if (this.allowConsoleCommands === false) {
                Logger.Info(
                    '-AllowPixelStreamingCommands=false, sending arbitrary console commands from browser to UE is disabled.'
                );
            }
        }

        const useUrlParams = this.config.useUrlParams;
        const urlParams = new IURLSearchParams(window.location.search);
        Logger.Info(`using URL parameters ${useUrlParams}`);
        if (settings.EncoderSettings) {
            // here we should either get Min/MaxQP from PS1
            // or Min/MaxQuality from PS2
            // we only want to set one set or the other as they converge in CompatQualityMin/Max and
            // we dont want to have them conflict with default values.
            if (settings.EncoderSettings.MinQP) {
                this.config.setNumericSetting(
                    NumericParameters.MinQP,
                    // If a setting is set in the URL, make sure we respect that value as opposed to what the application sends us
                    useUrlParams && urlParams.has(NumericParameters.MinQP)
                        ? Number.parseFloat(urlParams.get(NumericParameters.MinQP))
                        : settings.EncoderSettings.MinQP || 0
                );

                this.config.setNumericSetting(
                    NumericParameters.MaxQP,
                    useUrlParams && urlParams.has(NumericParameters.MaxQP)
                        ? Number.parseFloat(urlParams.get(NumericParameters.MaxQP))
                        : settings.EncoderSettings.MaxQP || 51
                );
            }

            if (settings.EncoderSettings.MinQuality) {
                this.config.setNumericSetting(
                    NumericParameters.MinQuality,
                    // If a setting is set in the URL, make sure we respect that value as opposed to what the application sends us
                    useUrlParams && urlParams.has(NumericParameters.MinQuality)
                        ? Number.parseFloat(urlParams.get(NumericParameters.MinQuality))
                        : settings.EncoderSettings.MinQuality || 0
                );

                this.config.setNumericSetting(
                    NumericParameters.MaxQuality,
                    useUrlParams && urlParams.has(NumericParameters.MaxQuality)
                        ? Number.parseFloat(urlParams.get(NumericParameters.MaxQuality))
                        : settings.EncoderSettings.MaxQuality || 100
                );
            }

            // these two are just used to converge quality and qp and behave slightly differently since they
            // shouldnt exist in EncoderSettings
            if (useUrlParams) {
                if (urlParams.has(NumericParameters.CompatQualityMin)) {
                    this.config.setNumericSetting(
                        NumericParameters.CompatQualityMin,
                        Number.parseFloat(urlParams.get(NumericParameters.CompatQualityMin))
                    );
                }
                if (urlParams.has(NumericParameters.CompatQualityMax)) {
                    this.config.setNumericSetting(
                        NumericParameters.CompatQualityMax,
                        Number.parseFloat(urlParams.get(NumericParameters.CompatQualityMax))
                    );
                }
            }
        }
        if (settings.WebRTCSettings) {
            this.config.setNumericSetting(
                NumericParameters.WebRTCMinBitrate,
                useUrlParams && urlParams.has(NumericParameters.WebRTCMinBitrate)
                    ? Number.parseFloat(urlParams.get(NumericParameters.WebRTCMinBitrate))
                    : settings.WebRTCSettings.MinBitrate / 1000 /* bps to kbps */
            );
            this.config.setNumericSetting(
                NumericParameters.WebRTCMaxBitrate,
                useUrlParams && urlParams.has(NumericParameters.WebRTCMaxBitrate)
                    ? Number.parseFloat(urlParams.get(NumericParameters.WebRTCMaxBitrate))
                    : settings.WebRTCSettings.MaxBitrate / 1000 /* bps to kbps */
            );
            this.config.setNumericSetting(
                NumericParameters.WebRTCFPS,
                useUrlParams && urlParams.has(NumericParameters.WebRTCFPS)
                    ? Number.parseFloat(urlParams.get(NumericParameters.WebRTCFPS))
                    : settings.WebRTCSettings.FPS
            );
        }
    }

    /**
     * Set up functionality to happen when setting quality control ownership of a stream
     * @param hasQualityOwnership - does this user have quality ownership of the stream true / false
     */
    _onQualityControlOwnership(hasQualityOwnership: boolean) {
        this.config.setFlagEnabled(Flags.IsQualityController, hasQualityOwnership);
    }

    _onPlayerCount(playerCount: number) {
        this._eventEmitter.dispatchEvent(new PlayerCountEvent({ count: playerCount }));
    }

    _onSubscribeFailed(message: string) {
        this._eventEmitter.dispatchEvent(new SubscribeFailedEvent({ message: message }));
    }

    // Sets up to emit the webrtc tcp relay detect event
    _setupWebRtcTCPRelayDetection(statsReceivedEvent: StatsReceivedEvent) {
        // Get the active candidate pair
        const activeCandidatePair = statsReceivedEvent.data.aggregatedStats.getActiveCandidatePair();

        // Check if the active candidate pair is not null
        if (activeCandidatePair != null) {
            // Get the local candidate assigned to the active candidate pair
            const localCandidate = statsReceivedEvent.data.aggregatedStats.localCandidates.find(
                (candidate) => candidate.id == activeCandidatePair.localCandidateId,
                null
            );

            // Check if the local candidate is not null, candidate type is relay and the relay protocol is tcp
            if (
                localCandidate != null &&
                localCandidate.candidateType == 'relay' &&
                localCandidate.relayProtocol == 'tcp'
            ) {
                // Send the web rtc tcp relay detected event
                this._eventEmitter.dispatchEvent(new WebRtcTCPRelayDetectedEvent());
            }
            // The check is completed and the stats listen event can be removed
            this._eventEmitter.removeEventListener('statsReceived', this._setupWebRtcTCPRelayDetection);
        }
    }

    /**
     * Request a connection latency test.
     * NOTE: There are plans to refactor all request* functions. Expect changes if you use this!
     * @returns
     */
    public requestLatencyTest() {
        if (!this._webRtcController.videoPlayer.isVideoReady()) {
            return false;
        }
        this._webRtcController.sendLatencyTest();
        return true;
    }

    /**
     * Request a data channel latency test.
     * NOTE: There are plans to refactor all request* functions. Expect changes if you use this!
     */
    public requestDataChannelLatencyTest(config: DataChannelLatencyTestConfig) {
        if (!this._webRtcController.videoPlayer.isVideoReady()) {
            return false;
        }
        if (!this._dataChannelLatencyTestController) {
            this._dataChannelLatencyTestController = new DataChannelLatencyTestController(
                this._webRtcController.sendDataChannelLatencyTest.bind(this._webRtcController),
                (result: DataChannelLatencyTestResult) => {
                    this._eventEmitter.dispatchEvent(new DataChannelLatencyTestResultEvent({ result }));
                }
            );
            this.addEventListener('dataChannelLatencyTestResponse', ({ data: { response } }) => {
                this._dataChannelLatencyTestController.receive(response);
            });
        }
        return this._dataChannelLatencyTestController.start(config);
    }

    /**
     * Request for the UE application to show FPS counter.
     * NOTE: There are plans to refactor all request* functions. Expect changes if you use this!
     * @returns
     */
    public requestShowFps() {
        if (!this._webRtcController.videoPlayer.isVideoReady()) {
            return false;
        }
        this._webRtcController.sendShowFps();
        return true;
    }

    /**
     * Request for a new IFrame from the UE application.
     * NOTE: There are plans to refactor all request* functions. Expect changes if you use this!
     * @returns
     */
    public requestIframe() {
        if (!this._webRtcController.videoPlayer.isVideoReady()) {
            return false;
        }
        this._webRtcController.sendIframeRequest();
        return true;
    }

    /**
     * Send data to UE application. The data will be run through JSON.stringify() so e.g. strings
     * and any serializable plain JSON objects with no recurrence can be sent.
     * @returns true if succeeded, false if rejected
     */
    public emitUIInteraction(descriptor: object | string) {
        if (!this._webRtcController.videoPlayer.isVideoReady()) {
            return false;
        }
        this._webRtcController.emitUIInteraction(descriptor);
        return true;
    }

    /**
     * Send a command to UE application. Blocks ConsoleCommand descriptors unless UE
     * has signaled that it allows console commands.
     * @returns true if succeeded, false if rejected
     */
    public emitCommand(descriptor: object) {
        if (!this._webRtcController.videoPlayer.isVideoReady()) {
            return false;
        }
        if (!this.allowConsoleCommands && 'ConsoleCommand' in descriptor) {
            return false;
        }
        this._webRtcController.emitCommand(descriptor);
        return true;
    }

    /**
     * Send a console command to UE application. Only allowed if UE has signaled that it allows
     * console commands.
     * @returns true if succeeded, false if rejected
     */
    public emitConsoleCommand(command: string) {
        if (!this.allowConsoleCommands || !this._webRtcController.videoPlayer.isVideoReady()) {
            return false;
        }
        this._webRtcController.emitConsoleCommand(command);
        return true;
    }

    /**
     * Sets the text contents of the currently focused UE text box widget.
     * @param contents The new contents of the UE text box.
     * @returns True if the message could be sent.
     */
    public sendTextboxEntry(contents: string): boolean {
        if (!this._webRtcController.videoPlayer.isVideoReady()) {
            return false;
        }
        this._webRtcController.sendTextboxEntry(contents);
        return true;
    }

    /**
     * Add a UE -> browser response event listener
     * @param name - The name of the response handler
     * @param listener - The method to be activated when a message is received
     */
    public addResponseEventListener(name: string, listener: (response: string) => void) {
        this._webRtcController.responseController.addResponseEventListener(name, listener);
    }

    /**
     * Remove a UE -> browser response event listener
     * @param name - The name of the response handler
     */
    public removeResponseEventListener(name: string) {
        this._webRtcController.responseController.removeResponseEventListener(name);
    }

    /**
     * Dispatch a new event.
     * @param e event
     * @returns
     */
    public dispatchEvent(e: PixelStreamingEvent): boolean {
        return this._eventEmitter.dispatchEvent(e);
    }

    /**
     * Register an event handler.
     * @param type event name
     * @param listener event handler function
     */
    public addEventListener<
        T extends PixelStreamingEvent['type'],
        E extends PixelStreamingEvent & { type: T }
    >(type: T, listener: (e: Event & E) => void) {
        this._eventEmitter.addEventListener(type, listener);
    }

    /**
     * Remove an event handler.
     * @param type event name
     * @param listener event handler function
     */
    public removeEventListener<
        T extends PixelStreamingEvent['type'],
        E extends PixelStreamingEvent & { type: T }
    >(type: T, listener: (e: Event & E) => void) {
        this._eventEmitter.removeEventListener(type, listener);
    }

    /**
     * Enable/disable XR mode.
     */
    public toggleXR() {
        this.webXrController.xrClicked();
    }

    /**
     * Pass in a function to generate a signalling server URL.
     * This function is useful if you need to programmatically construct your signalling server URL.
     * @param signallingUrlBuilderFunc A function that generates a signalling server url.
     */
    public setSignallingUrlBuilder(signallingUrlBuilderFunc: () => string) {
        this._webRtcController.signallingUrlBuilder = signallingUrlBuilderFunc;
    }

    public get webRtcController() {
        return this._webRtcController;
    }

    /**
     * Public getter for the websocket controller. Access to this property allows you to send
     * custom websocket messages.
     */
    public get signallingProtocol() {
        return this._webRtcController.protocol;
    }

    /**
     * Public getter for the webXrController controller. Used for all XR features.
     */
    public get webXrController() {
        return this._webXrController;
    }

    public registerMessageHandler(
        name: string,
        direction: MessageDirection,
        handler?: (data: ArrayBuffer | Array<number | string>) => void
    ) {
        if (direction === MessageDirection.FromStreamer && typeof handler === 'undefined') {
            Logger.Warning(`Unable to register an undefined handler for ${name}`);
            return;
        }

        if (direction === MessageDirection.ToStreamer && typeof handler === 'undefined') {
            this._webRtcController.streamMessageController.registerMessageHandler(
                direction,
                name,
                (data: Array<number | string>) =>
                    this._webRtcController.sendMessageController.sendMessageToStreamer(name, data)
            );
        } else {
            this._webRtcController.streamMessageController.registerMessageHandler(
                direction,
                name,
                (data: ArrayBuffer) => handler(data)
            );
        }
    }

    public get toStreamerHandlers() {
        return this._webRtcController.streamMessageController.toStreamerHandlers;
    }

    public isReconnecting() {
        return this._webRtcController.isReconnecting;
    }
}

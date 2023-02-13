// Copyright Epic Games, Inc. All Rights Reserved.

import { PixelStreaming, Flags, Logger, AggregatedStats, LatencyTestResults, InitialSettings } from '@epicgames-ps/lib-pixelstreamingfrontend-dev';
import { OverlayBase } from '../Overlay/BaseOverlay';
import { ActionOverlay } from '../Overlay/ActionOverlay';
import { TextOverlay } from '../Overlay/TextOverlay';
import { ConnectOverlay } from '../Overlay/ConnectOverlay';
import { DisconnectOverlay } from '../Overlay/DisconnectOverlay';
import { PlayOverlay } from '../Overlay/PlayOverlay';
import { InfoOverlay } from '../Overlay/InfoOverlay';
import { ErrorOverlay } from '../Overlay/ErrorOverlay';
import { AFKOverlay } from '../Overlay/AFKOverlay';
import { LabelledButton } from '../UI/LabelledButton';
import { SettingsPanel } from '../UI/SettingsPanel';
import { StatsPanel } from '../UI/StatsPanel';
import { VideoQpIndicator } from '../UI/VideoQpIndicator';

export interface UIOptions {
    pixelStreaming: PixelStreaming;
}
/**
 * Provides common base functionality for applications that extend this application
 */
export class Application {
    pixelStreaming: PixelStreaming;

    // set the overlay placeholders
    currentOverlay: OverlayBase | null;
    disconnectOverlay: ActionOverlay;
    connectOverlay: ActionOverlay;
    playOverlay: ActionOverlay;
    infoOverlay: TextOverlay;
    errorOverlay: TextOverlay;
    afkOverlay: AFKOverlay;

    settingsPanel: SettingsPanel;
    statsPanel: StatsPanel;
    videoQpIndicator: VideoQpIndicator;

    /**
     * @param config - A newly instantiated config object
     * returns the base delegate object with the config inside it along with a new instance of the Overlay controller class
     */
    constructor(options: UIOptions) {
        this.pixelStreaming = options.pixelStreaming;

        this.createOverlays();

        // Add stats panel
        this.statsPanel = new StatsPanel();
        this.pixelStreaming.uiFeaturesElement.appendChild(this.statsPanel.rootElement);

        // Add settings panel
        this.settingsPanel = new SettingsPanel();
        this.pixelStreaming.uiFeaturesElement.appendChild(this.settingsPanel.rootElement);

        // Add the video stream QP indicator
        this.videoQpIndicator = new VideoQpIndicator();
        this.pixelStreaming.uiFeaturesElement.appendChild(this.videoQpIndicator.rootElement);
        
        this.configureSettings();

        this.createButtons();

        this.registerCallbacks();

        this.showConnectOrAutoConnectOverlays();
    }

    public createOverlays(): void {
        // build all of the overlays
        this.disconnectOverlay = new DisconnectOverlay(this.pixelStreaming.videoElementParent);
        this.connectOverlay = new ConnectOverlay(this.pixelStreaming.videoElementParent);
        this.playOverlay = new PlayOverlay(this.pixelStreaming.videoElementParent);
        this.infoOverlay = new InfoOverlay(this.pixelStreaming.videoElementParent);
        this.errorOverlay = new ErrorOverlay(this.pixelStreaming.videoElementParent);
        this.afkOverlay = new AFKOverlay(this.pixelStreaming.videoElementParent);

        this.disconnectOverlay.onAction(() => 
          this.pixelStreaming.reconnect()
        );

        // Build the webRtc connect overlay Event Listener and show the connect overlay
        this.connectOverlay.onAction(() =>
          this.pixelStreaming.connect()
        );

        // set up the play overlays action
        this.playOverlay.onAction(() => 
          this.pixelStreaming.play()
        );

    }

    /**
     * Set up button click functions and button functionality
     */
    public createButtons() {

        // Add settings button to controls
        this.pixelStreaming.controls.settingsIcon.rootElement.onclick = () =>
            this.settingsClicked();
        this.settingsPanel.settingsCloseButton.onclick = () =>
            this.settingsClicked();
    
        // setup the stats/info button
        this.pixelStreaming.controls.statsIcon.rootElement.onclick = () => this.statsClicked();

        this.statsPanel.statsCloseButton.onclick = () => this.statsClicked();

        // Add button for toggle fps
        const showFPSButton = new LabelledButton('Show FPS', 'Toggle');
        showFPSButton.addOnClickListener(() => {
            this.pixelStreaming.requestShowFps();
        });

        // Add button for restart stream
        const restartStreamButton = new LabelledButton(
            'Restart Stream',
            'Restart'
        );
        restartStreamButton.addOnClickListener(() => {
            this.pixelStreaming.restartStream();
        });

        // Add button for request keyframe
        const requestKeyframeButton = new LabelledButton(
            'Request keyframe',
            'Request'
        );
        requestKeyframeButton.addOnClickListener(() => {
            this.pixelStreaming.requestIframe();
        });

        const commandsSectionElem = this.pixelStreaming.config.buildSectionWithHeading(
            this.settingsPanel.settingsContentElement,
            'Commands'
        );
        commandsSectionElem.appendChild(showFPSButton.rootElement);
        commandsSectionElem.appendChild(requestKeyframeButton.rootElement);
        commandsSectionElem.appendChild(restartStreamButton.rootElement);

    }

    /**
     * Configure the settings with on change listeners and any additional per experience settings.
     */
    configureSettings(): void {
        // This builds all the settings sections and flags under this `settingsContent` element.
        this.pixelStreaming.config.populateSettingsElement(
            this.settingsPanel.settingsContentElement
        );
    }

    registerCallbacks() {
        this.pixelStreaming.events.on("afkWarningActivate", this.showAfkOverlay.bind(this));
        this.pixelStreaming.events.on("afkWarningUpdate", this.afkOverlay.updateCountdown.bind(this.afkOverlay));
        this.pixelStreaming.events.on("afkWarningDeactivate", this.afkOverlay.hide.bind(this.afkOverlay));
        this.pixelStreaming.events.on("afkTimedOut", this.afkOverlay.hide.bind(this.afkOverlay));
        this.pixelStreaming.events.on("videoEncoderAvgQP", this.onVideoEncoderAvgQP.bind(this));
        this.pixelStreaming.events.on("webRtcSdp", this.onWebRtcSdp.bind(this));
        this.pixelStreaming.events.on("webRtcAutoConnect", this.onWebRtcAutoConnect.bind(this));
        this.pixelStreaming.events.on("webRtcConnecting", this.onWebRtcConnecting.bind(this));
        this.pixelStreaming.events.on("webRtcConnected", this.onWebRtcConnected.bind(this));
        this.pixelStreaming.events.on("webRtcFailed", this.onWebRtcFailed.bind(this));
        this.pixelStreaming.events.on("videoInitialized", this.onVideoInitialized.bind(this));
        this.pixelStreaming.events.on("streamLoading", this.onStreamLoading.bind(this));
        this.pixelStreaming.events.on("disconnect", this.onDisconnect.bind(this));
        this.pixelStreaming.events.on("playStreamError", this.onPlayStreamError.bind(this));
        this.pixelStreaming.events.on("playStream", this.onPlayStream.bind(this));
        this.pixelStreaming.events.on("playStreamRejected", this.onPlayStreamRejected.bind(this));
        this.pixelStreaming.events.on("loadFreezeFrame", this.onLoadFreezeFrame.bind(this));
        this.pixelStreaming.events.on("statsReceived", this.onStatsReceived.bind(this));
        this.pixelStreaming.events.on("latencyTestResult", this.onLatencyTestResults.bind(this));
        this.pixelStreaming.events.on("initialSettings", this.onInitialSettings.bind(this));
    }

    public get rootElement(): HTMLElement {
        return this.pixelStreaming.rootElement;
    }

    /**
     * Shows the disconnect overlay
     * @param updateText - the text that will be displayed in the overlay
     */
    showDisconnectOverlay(updateText: string) {
        this.hideCurrentOverlay();
        this.updateDisconnectOverlay(updateText);
        this.disconnectOverlay.show();
        this.currentOverlay = this.disconnectOverlay;
    }

    /**
     * Update the disconnect overlays span text
     * @param updateText - the new countdown number
     */
    updateDisconnectOverlay(updateText: string) {
        this.disconnectOverlay.update(updateText);
    }

    /**
     * Activates the disconnect overlays action
     */
    onDisconnectionAction() {
        this.disconnectOverlay.activate();
    }

    /**
     * Hides the current overlay
     */
    hideCurrentOverlay() {
        if (this.currentOverlay != null) {
            this.currentOverlay.hide();
            this.currentOverlay = null;
        }
    }

    /**
     * Shows the connect overlay
     */
    showConnectOverlay() {
        this.hideCurrentOverlay();
        this.connectOverlay.show();
        this.currentOverlay = this.connectOverlay;
    }

    /**
     * Shows the play overlay
     */
    showPlayOverlay() {
        this.hideCurrentOverlay();
        this.playOverlay.show();
        this.currentOverlay = this.playOverlay;
    }

    /**
     * Shows the text overlay
     * @param text - the text that will be shown in the overlay
     */
    showTextOverlay(text: string) {
        this.hideCurrentOverlay();
        this.infoOverlay.update(text);
        this.infoOverlay.show();
        this.currentOverlay = this.infoOverlay;
    }

    /**
     * Shows the error overlay
     * @param text - the text that will be shown in the overlay
     */
    showErrorOverlay(text: string) {
        this.hideCurrentOverlay();
        this.errorOverlay.update(text);
        this.errorOverlay.show();
        this.currentOverlay = this.errorOverlay;
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
     * Activates the connect overlays action
     */
    onConnectAction() {
        this.connectOverlay.activate();
    }

    /**
     * Activates the play overlays action
     */
    onPlayAction() {
        this.playOverlay.activate();
    }

    /**
     * Shows the afk overlay
     * @param countDown - the countdown number for the afk countdown
     */
    showAfkOverlay(countDown: number, dismissAfk: () => void) {
        this.hideCurrentOverlay();
        this.afkOverlay.updateCountdown(
            countDown
        );
        this.afkOverlay.onAction(() => dismissAfk());
        this.afkOverlay.show();
        this.currentOverlay = this.afkOverlay;
    }

    /**
     * Show the Connect Overlay or auto connect
     */
    showConnectOrAutoConnectOverlays() {
        // set up if the auto play will be used or regular click to start
        if (!this.pixelStreaming.config.isFlagEnabled(Flags.AutoConnect)) {
            this.showConnectOverlay();
        }
    }

    /**
     * Show the webRtcAutoConnect Overlay and connect
     */
    onWebRtcAutoConnect() {
        this.showTextOverlay('Auto Connecting Now');
    }

    /**
     * Set up functionality to happen when receiving a webRTC answer
     */
    onWebRtcSdp() {
        this.showTextOverlay('WebRTC Connection Negotiated');
    }

    /**
     * Shows a text overlay to alert the user the stream is currently loading
     */
    onStreamLoading() {
        // build the spinner span
        const spinnerSpan: HTMLSpanElement = document.createElement('span');
        spinnerSpan.className = 'visually-hidden';
        spinnerSpan.innerHTML = 'Loading...';

        // build the spinner div
        const spinnerDiv: HTMLDivElement = document.createElement('div');
        spinnerDiv.id = 'loading-spinner';
        spinnerDiv.className = 'spinner-border ms-2';
        spinnerDiv.setAttribute('role', 'status');

        // append the spinner to the element
        spinnerDiv.appendChild(spinnerSpan);

        this.showTextOverlay('Loading Stream ' + spinnerDiv.outerHTML);
    }

    /**
     * Event fired when the video is disconnected - displays the error overlay and resets the buttons stream tools upon disconnect
     * @param eventString - the event text that will be shown in the overlay
     */
    onDisconnect(eventString: string, showActionOrErrorOnDisconnect: boolean) {
        if (showActionOrErrorOnDisconnect == false) {
            this.showErrorOverlay(`Disconnected: ${eventString}`);
        } else {
            this.showDisconnectOverlay(
                `Disconnected: ${eventString}  <div class="clickableState">Click To Restart</div>`
            );
        }
        // disable starting a latency check
        this.statsPanel.latencyTest.latencyTestButton.onclick = () => {
            // do nothing
        };
    }

    /**
     * Handles when Web Rtc is connecting
     */
    onWebRtcConnecting() {
        this.showTextOverlay('Starting connection to server, please wait');
    }

    /**
     * Handles when Web Rtc has connected
     */
    onWebRtcConnected() {
        this.showTextOverlay('WebRTC connected, waiting for video');
    }

    /**
     * Handles when Web Rtc fails to connect
     */
    onWebRtcFailed() {
        this.showErrorOverlay('Unable to setup video');
    }

    onLoadFreezeFrame(shouldShowPlayOverlay: boolean) {
        if (shouldShowPlayOverlay === true) {
            Logger.Log(Logger.GetStackTrace(), 'showing play overlay');
            this.showPlayOverlay();
        }
    }

    onPlayStream() {
        this.hideCurrentOverlay();
    }

    onPlayStreamError(message: string) {
        this.showErrorOverlay(message);
    }

    onPlayStreamRejected(onRejectedReason: unknown) {
        this.showPlayOverlay();
    }

    onVideoInitialized() {
        if (!this.pixelStreaming.config.isFlagEnabled(Flags.AutoPlayVideo)) {
            this.showPlayOverlay();
        }

        // starting a latency check
        this.statsPanel.latencyTest.latencyTestButton.onclick = () => {
            this.pixelStreaming.requestLatencyTest();
        };
    }

    /**
     * Set up functionality to happen when calculating the average video encoder qp
     * @param QP - the quality number of the stream
     */
    onVideoEncoderAvgQP(QP: number) {
        this.videoQpIndicator.updateQpTooltip(QP);
    }
    
    onInitialSettings(settings: InitialSettings) {
        if (settings.PixelStreamingSettings) {
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
    }

    onStatsReceived(aggregatedStats: AggregatedStats) {
        // Grab all stats we can off the aggregated stats
        this.statsPanel.handleStats(aggregatedStats);
    }

    onLatencyTestResults(latencyTimings: LatencyTestResults) {
        this.statsPanel.latencyTest.handleTestResult(latencyTimings);
    }
}

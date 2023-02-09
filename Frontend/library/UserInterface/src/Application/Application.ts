// Copyright Epic Games, Inc. All Rights Reserved.

import { PixelStreaming, Flags, Logger } from '@epicgames-ps/lib-pixelstreamingfrontend-dev';
import { OverlayBase } from '../Overlay/BaseOverlay';
import { ActionOverlay } from '../Overlay/ActionOverlay';
import { TextOverlay } from '../Overlay/TextOverlay';
import { ConnectOverlay } from '../Overlay/ConnectOverlay';
import { DisconnectOverlay } from '../Overlay/DisconnectOverlay';
import { PlayOverlay } from '../Overlay/PlayOverlay';
import { InfoOverlay } from '../Overlay/InfoOverlay';
import { ErrorOverlay } from '../Overlay/ErrorOverlay';
import { AFKOverlay } from '../Overlay/AFKOverlay';

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

    /**
     * @param config - A newly instantiated config object
     * returns the base delegate object with the config inside it along with a new instance of the Overlay controller class
     */
    constructor(options: UIOptions) {
        this.pixelStreaming = options.pixelStreaming;

        this.createOverlays();

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

    registerCallbacks() {
        this.pixelStreaming.config.options.onAfkWarningActivate = this.showAfkOverlay.bind(this);
        this.pixelStreaming.config.options.onAfkWarningUpdate = this.afkOverlay.updateCountdown.bind(this);
        this.pixelStreaming.config.options.onAfkWarningDeactivate = this.afkOverlay.hide.bind(this);
        this.pixelStreaming.config.options.onAfkTimedOut = this.afkOverlay.hide.bind(this);
        this.pixelStreaming.config.options.onWebRtcSdp = this.onWebRtcSdp.bind(this);
        this.pixelStreaming.config.options.onWebRtcAutoConnect = this.onWebRtcAutoConnect.bind(this);
        this.pixelStreaming.config.options.onWebRtcConnecting = this.onWebRtcConnecting.bind(this);
        this.pixelStreaming.config.options.onWebRtcConnected = this.onWebRtcConnected.bind(this);
        this.pixelStreaming.config.options.onWebRtcFailed = this.onWebRtcFailed.bind(this);
        this.pixelStreaming.config.options.onVideoInitialized = this.onVideoInitialized.bind(this);
        this.pixelStreaming.config.options.onStreamLoading = this.onStreamLoading.bind(this);
        this.pixelStreaming.config.options.onDisconnect = this.onDisconnect.bind(this);
        this.pixelStreaming.config.options.onPlayStreamError = this.onPlayStreamError.bind(this);
        this.pixelStreaming.config.options.onPlayStream = this.onPlayStream.bind(this);
        this.pixelStreaming.config.options.onPlayStreamRejected = this.onPlayStreamRejected.bind(this);
        this.pixelStreaming.config.options.onLoadFreezeFrame = this.onLoadFreezeFrame.bind(this);
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
    showAfkOverlay(countDown: number) {
        this.hideCurrentOverlay();
        this.afkOverlay.updateCountdown(
            countDown
        );
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
    }
}

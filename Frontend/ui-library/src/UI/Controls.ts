// Copyright Epic Games, Inc. All Rights Reserved.

import { FullScreenIcon } from './FullscreenIcon';
import { SettingsIcon } from './SettingsIcon';
import { StatsIcon } from './StatsIcon';
import { XRIcon } from './XRIcon';
import { WebXRController } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.2';

/**
 * Element containing various controls like stats, settings, fullscreen.
 */
export class Controls {
    statsIcon: StatsIcon;
    fullscreenIcon: FullScreenIcon;
    settingsIcon: SettingsIcon;
    xrIcon: XRIcon;

    _rootElement: HTMLElement;

    /**
     * Construct the controls
     */
    constructor() {
        this.statsIcon = new StatsIcon();
        this.settingsIcon = new SettingsIcon();
        this.fullscreenIcon = new FullScreenIcon();
        this.xrIcon = new XRIcon();
    }

    /**
     * Get the element containing the controls.
     */
    public get rootElement(): HTMLElement {
        if (!this._rootElement) {
            this._rootElement = document.createElement('div');
            this._rootElement.id = 'controls';
            this._rootElement.appendChild(this.fullscreenIcon.rootElement);
            this._rootElement.appendChild(this.settingsIcon.rootElement);
            this._rootElement.appendChild(this.statsIcon.rootElement);
            WebXRController.isSessionSupported('immersive-vr').then(
                (supported: boolean) => {
                    if (supported) {
                        this._rootElement.appendChild(this.xrIcon.rootElement);
                    }
                }
            );
        }
        return this._rootElement;
    }
}

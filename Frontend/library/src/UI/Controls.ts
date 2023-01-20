// Copyright Epic Games, Inc. All Rights Reserved.

import { FullScreenIcon } from './FullscreenIcon';
import { SettingsIcon } from './SettingsIcon';
import { StatsIcon } from './StatsIcon';

/**
 * Element containing various controls like stats, settings, fullscreen.
 */
export class Controls {
    statsIcon: StatsIcon;
    fullscreenIcon: FullScreenIcon;
    settingsIcon: SettingsIcon;

    _rootElement: HTMLElement;

    /**
     * Construct the controls
     */
    constructor() {
        this.statsIcon = new StatsIcon();
        this.settingsIcon = new SettingsIcon();
        this.fullscreenIcon = new FullScreenIcon();
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
        }
        return this._rootElement;
    }
}

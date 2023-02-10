// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * A UI component containing all the settings for the application.
 */
export class SettingsPanel {
    _rootElement: HTMLElement;
    _settingsCloseButton: HTMLElement;
    _settingsContentElement: HTMLElement;

    constructor() {
        this._rootElement = null;
    }

    /**
     * @returns Return or creates a HTML element that represents this setting in the DOM.
     */
    public get rootElement(): HTMLElement {
        if (!this._rootElement) {
            this._rootElement = document.createElement('div');
            this._rootElement.id = 'settings-panel';
            this._rootElement.classList.add('panel-wrap');

            const panelElem = document.createElement('div');
            panelElem.classList.add('panel');
            this._rootElement.appendChild(panelElem);

            const settingsHeading = document.createElement('div');
            settingsHeading.id = 'settingsHeading';
            settingsHeading.textContent = 'Settings';
            panelElem.appendChild(settingsHeading);

            panelElem.appendChild(this.settingsCloseButton);
            panelElem.appendChild(this.settingsContentElement);
        }
        return this._rootElement;
    }

    public get settingsContentElement(): HTMLElement {
        if (!this._settingsContentElement) {
            this._settingsContentElement = document.createElement('div');
            this._settingsContentElement.id = 'settingsContent';
        }
        return this._settingsContentElement;
    }

    public get settingsCloseButton(): HTMLElement {
        if (!this._settingsCloseButton) {
            this._settingsCloseButton = document.createElement('div');
            this._settingsCloseButton.id = 'settingsClose';
        }
        return this._settingsCloseButton;
    }

    /**
     * Show settings panel.
     */
    public show(): void {
        if (!this.rootElement.classList.contains('panel-wrap-visible')) {
            this.rootElement.classList.add('panel-wrap-visible');
        }
    }

    /**
     * Toggle the visibility of the settings panel.
     */
    public toggleVisibility(): void {
        this.rootElement.classList.toggle('panel-wrap-visible');
    }

    /**
     * Hide settings panel.
     */
    public hide(): void {
        if (this.rootElement.classList.contains('panel-wrap-visible')) {
            this.rootElement.classList.remove('panel-wrap-visible');
        }
    }
}

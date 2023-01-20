// Copyright Epic Games, Inc. All Rights Reserved.

import { SettingBase } from './SettingBase';

export class SettingFlag extends SettingBase {
    /* We toggle this checkbox to reflect the value of our setting's boolean flag. */
    _checkbox: HTMLInputElement; // input type="checkbox"

    /* This element contains a text node that reflects the setting's text label. */
    _settingsTextElem: HTMLElement;

    constructor(
        id: string,
        label: string,
        description: string,
        defaultFlagValue: boolean
    ) {
        super(id, label, description, defaultFlagValue);

        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has(this.id)) {
            this.flag = defaultFlagValue;
        } else {
            // parse flag from url parameters
            const urlParamFlag = this.getUrlParamFlag();
            this.flag = urlParamFlag;
        }
    }

    /**
     * Parse the flag value from the url parameters.
     * @returns True if the url parameters contains /?id, but False if /?id=false
     */
    getUrlParamFlag(): boolean {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has(this.id)) {
            if (
                urlParams.get(this.id) === 'false' ||
                urlParams.get(this.id) === 'False'
            ) {
                return false;
            }
            return true;
        }
        return false;
    }

    public get settingsTextElem(): HTMLElement {
        if (!this._settingsTextElem) {
            this._settingsTextElem = document.createElement('div');
            this._settingsTextElem.innerText = this._label;
            this._settingsTextElem.title = this.description;
        }
        return this._settingsTextElem;
    }

    public get checkbox(): HTMLInputElement {
        if (!this._checkbox) {
            this._checkbox = document.createElement('input');
            this._checkbox.type = 'checkbox';
        }
        return this._checkbox;
    }

    /**
     * @returns Return or creates a HTML element that represents this setting in the DOM.
     */
    public get rootElement(): HTMLElement {
        if (!this._rootElement) {
            // create root div with "setting" css class
            this._rootElement = document.createElement('div');
            this._rootElement.id = this.id;
            this._rootElement.classList.add('setting');

            // create div element to contain our setting's text
            this._rootElement.appendChild(this.settingsTextElem);

            // create label element to wrap out input type
            const wrapperLabel = document.createElement('label');
            wrapperLabel.classList.add('tgl-switch');
            this._rootElement.appendChild(wrapperLabel);

            // create input type=checkbox
            this.checkbox.title = this.description;
            this.checkbox.classList.add('tgl');
            this.checkbox.classList.add('tgl-flat');
            const slider = document.createElement('div');
            slider.classList.add('tgl-slider');
            wrapperLabel.appendChild(this.checkbox);
            wrapperLabel.appendChild(slider);

            // setup on change from checkbox
            this.checkbox.addEventListener('change', () => {
                this.flag = this.checkbox.checked;

                // set url params
                const urlParams = new URLSearchParams(window.location.search);
                if (this.checkbox.checked === true) {
                    urlParams.set(this.id, 'true');
                } else {
                    urlParams.delete(this.id);
                }
                window.history.replaceState(
                    {},
                    '',
                    urlParams.toString() !== ''
                        ? `${location.pathname}?${urlParams}`
                        : `${location.pathname}`
                );
            });
        }
        return this._rootElement;
    }

    /**
     * Enables this flag.
     */
    public enable(): void {
        this.flag = true;
    }

    /**
     * @return The setting's value.
     */
    public get flag(): boolean {
        return this.checkbox.checked;
    }

    /**
     * Update the setting's stored value.
     * @param inValue The new value for the setting.
     */
    public set flag(inValue: unknown) {
        this.value = inValue;
        if (typeof inValue === 'boolean') {
            this.checkbox.checked = inValue;
        }
    }

    /**
     * Set the label text for the setting.
     * @param label setting label.
     */
    public set label(inLabel: string) {
        this._label = inLabel;
        this.settingsTextElem.innerText = this._label;
    }

    /**
     * @returns The label text for the setting.
     */
    public get label(): string {
        return this._label;
    }
}

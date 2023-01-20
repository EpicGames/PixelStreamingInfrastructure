// Copyright Epic Games, Inc. All Rights Reserved.

import { SettingBase } from './SettingBase';

export class SettingText extends SettingBase {
    /* A text box that reflects the value of this setting. */
    _textbox: HTMLInputElement; // input type="text"

    /* This element contains a text node that reflects the setting's text label. */
    _settingsTextElem: HTMLElement;

    constructor(
        id: string,
        label: string,
        description: string,
        defaultTextValue: string
    ) {
        super(id, label, description, defaultTextValue);

        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has(this.id)) {
            this.text = defaultTextValue;
        } else {
            // parse flag from url parameters
            const urlParamFlag = this.getUrlParamText();
            this.text = urlParamFlag;
        }
    }

    /**
     * Parse the text value from the url parameters.
     * @returns The text value parsed from the url if the url parameters contains /?id=value, but empty string if just /?id or no url param found.
     */
    getUrlParamText(): string {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has(this.id)) {
            return urlParams.get(this.id);
        }
        return '';
    }

    public get settingsTextElem(): HTMLElement {
        if (!this._settingsTextElem) {
            this._settingsTextElem = document.createElement('div');
            this._settingsTextElem.innerText = this._label;
            this._settingsTextElem.title = this.description;
        }
        return this._settingsTextElem;
    }

    public get textbox(): HTMLInputElement {
        if (!this._textbox) {
            this._textbox = document.createElement('input');
            this._textbox.classList.add('form-control');
            this._textbox.type = 'textbox';
        }
        return this._textbox;
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
            this._rootElement.appendChild(wrapperLabel);

            // create input type=checkbox
            this.textbox.title = this.description;
            wrapperLabel.appendChild(this.textbox);

            // setup on change from checkbox
            this.textbox.addEventListener('input', () => {
                this.text = this.textbox.value;

                // set url params
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set(this.id, this.textbox.value);
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
     * @return The setting's value.
     */
    public get text(): string {
        return this.textbox.value;
    }

    /**
     * Update the setting's stored value.
     * @param inValue The new value for the setting.
     */
    public set text(inValue: unknown) {
        this.value = inValue;
        if (typeof inValue === 'string') {
            this.textbox.value = inValue;
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
}

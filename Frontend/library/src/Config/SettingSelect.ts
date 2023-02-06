// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '../Logger/Logger';
import { SettingBase } from './SettingBase';

export class SettingSelect extends SettingBase {
    /* A text box that reflects the value of this setting. */
    _selectbox: HTMLSelectElement; // input type="select"

    /* This element contains a text node that reflects the setting's text label. */
    _settingsTextElem: HTMLElement;

    constructor(
        id: string,
        label: string,
        description: string
    ) {
        super(id, label, description, '');

        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has(this.id)) {
            this.text = '';
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

    setOptions(options: string[]) {
        if (this._selectbox) {
            var i, L = this._selectbox.options.length - 1;
            for(i = L; i >= 0; i--) {
                this._selectbox.remove(i);
            }
            for (const optionText of options) {
                const option = new Option(optionText);
                this._selectbox.appendChild(option);
            }
        }
    }

    public get settingsTextElem(): HTMLElement {
        if (!this._settingsTextElem) {
            this._settingsTextElem = document.createElement('div');
            this._settingsTextElem.innerText = this._label;
            this._settingsTextElem.title = this.description;
        }
        return this._settingsTextElem;
    }

    public get selectbox(): HTMLSelectElement {
        if (!this._selectbox) {
            this._selectbox = document.createElement('select');
            this._selectbox.classList.add('form-control');
            //this._selectbox.type = 'textbox';
        }
        return this._selectbox;
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
            this.selectbox.title = this.description;
            wrapperLabel.appendChild(this.selectbox);

            // setup on change from checkbox
            this.selectbox.addEventListener('change', () => {
                this.text = this.selectbox.value;

                // set url params
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set(this.id, this.selectbox.value);
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
        return this.selectbox.value;
    }

    /**
     * Update the setting's stored value.
     * @param inValue The new value for the setting.
     */
    public set text(inValue: unknown) {
        this.value = inValue;
        if (typeof inValue === 'string') {
            this.selectbox.value = inValue;
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

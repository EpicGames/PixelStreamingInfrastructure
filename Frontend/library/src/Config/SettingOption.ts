// Copyright Epic Games, Inc. All Rights Reserved.

import { SettingBase } from './SettingBase';

export class SettingOption extends SettingBase {
    /* A select element that reflects the value of this setting. */
    _selector: HTMLSelectElement; // <select></select>

    /* This element contains a text node that reflects the setting's text label. */
    _settingsTextElem: HTMLElement;

    constructor(
        id: string,
        label: string,
        description: string,
        defaultTextValue: string,
        options: Array<string>
    ) {
        super(id, label, description, [defaultTextValue, defaultTextValue]);

        this.options = options;

        const urlParams = new URLSearchParams(window.location.search);
        const stringToMatch: string = urlParams.has(this.id)
            ? this.getUrlParamText()
            : defaultTextValue;
        this.selected = stringToMatch;
    }

    public get selector(): HTMLSelectElement {
        if (!this._selector) {
            this._selector = document.createElement('select');
            this._selector.classList.add('form-control');
        }
        return this._selector;
    }

    public get settingsTextElem(): HTMLElement {
        if (!this._settingsTextElem) {
            this._settingsTextElem = document.createElement('div');
            this._settingsTextElem.innerText = this._label;
            this._settingsTextElem.title = this.description;
        }
        return this._settingsTextElem;
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

            // create select element
            this.selector.title = this.description;
            wrapperLabel.appendChild(this.selector);

            // setup on change from selector
            this.selector.onchange = () => {
                this.value = this.selector.value;

                // set url params
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set(this.id, this.selector.value);
                window.history.replaceState(
                    {},
                    '',
                    urlParams.toString() !== ''
                        ? `${location.pathname}?${urlParams}`
                        : `${location.pathname}`
                );
            };
        }
        return this._rootElement;
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

    /**
     * Add a change listener to the select element.
     */
    public addOnChangedListener(onChangedFunc: (newValue: string) => void) {
        this.onChange = onChangedFunc;
    }

    public get options(): Array<string> {
        return [...this.selector.options].map((o) => o.value);
    }

    public set options(values: Array<string>) {
        for (let i = this.selector.options.length - 1; i >= 0; i--) {
            this.selector.remove(i);
        }

        values.forEach((value: string) => {
            const opt = document.createElement('option');
            opt.value = value;
            opt.innerHTML = value;
            this.selector.appendChild(opt);
        });
    }

    public get selected(): string {
        return this.value as string;
    }

    public set selected(value: string) {
        // A user may not specify the full possible value so we instead use the closest match.
        // eg ?xxx=H264 would select 'H264 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f'
        const filteredList = this.options.filter(
            (option: string) => option.indexOf(value) !== -1
        );
        if (filteredList.length) {
            this.value = filteredList[0];
            this.selector.value = filteredList[0];
        }
    }

    public disable() {
        this.selector.disabled = true;
    }

    public enable() {
        this.selector.disabled = false;
    }
}

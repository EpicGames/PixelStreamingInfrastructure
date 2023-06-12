// Copyright Epic Games, Inc. All Rights Reserved.

import type {
    SettingText,
    TextParametersIds
} from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.3';
import { SettingUIBase } from './SettingUIBase';

export class SettingUIText<
    CustomIds extends string = TextParametersIds
> extends SettingUIBase {
    /* A text box that reflects the value of this setting. */
    _textbox: HTMLInputElement; // input type="text"

    /* This element contains a text node that reflects the setting's text label. */
    _settingsTextElem: HTMLElement;

    constructor(setting: SettingText<CustomIds>) {
        super(setting);

        this.label = this.setting.label;
        this.text = this.setting.text;
    }

    /**
     * @returns The setting component.
     */
    public get setting(): SettingText<CustomIds> {
        return this._setting as SettingText<CustomIds>;
    }

    public get settingsTextElem(): HTMLElement {
        if (!this._settingsTextElem) {
            this._settingsTextElem = document.createElement('div');
            this._settingsTextElem.innerText = this.setting.label;
            this._settingsTextElem.title = this.setting.description;
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
            this._rootElement.id = this.setting.id;
            this._rootElement.classList.add('setting');

            // create div element to contain our setting's text
            this._rootElement.appendChild(this.settingsTextElem);

            // create label element to wrap out input type
            const wrapperLabel = document.createElement('label');
            this._rootElement.appendChild(wrapperLabel);

            // create input type=checkbox
            this.textbox.title = this.setting.description;
            wrapperLabel.appendChild(this.textbox);

            // setup on change from checkbox
            this.textbox.addEventListener('input', () => {
                if (this.setting.text !== this.textbox.value) {
                    this.setting.text = this.textbox.value;
                    this.setting.updateURLParams();
                }
            });
        }
        return this._rootElement;
    }

    /**
     * Update the setting's stored value.
     * @param inValue The new value for the setting.
     */
    public set text(inValue: string) {
        this.textbox.value = inValue;
    }

    /**
     * Get value
     */
    public get text() {
        return this.textbox.value;
    }

    /**
     * Set the label text for the setting.
     * @param label setting label.
     */
    public set label(inLabel: string) {
        this.settingsTextElem.innerText = inLabel;
    }

    /**
     * Get label
     */
    public get label() {
        return this.settingsTextElem.innerText;
    }
}

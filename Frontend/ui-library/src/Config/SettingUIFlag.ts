// Copyright Epic Games, Inc. All Rights Reserved.

import type {
    FlagsIds,
    SettingFlag
} from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.3';
import { SettingUIBase } from './SettingUIBase';

export class SettingUIFlag<
    CustomIds extends string = FlagsIds
> extends SettingUIBase {
    /* We toggle this checkbox to reflect the value of our setting's boolean flag. */
    _checkbox: HTMLInputElement; // input type="checkbox"

    /* This element contains a text node that reflects the setting's text label. */
    _settingsTextElem: HTMLElement;

    onChangeEmit: (changedValue: boolean) => void;

    constructor(setting: SettingFlag<CustomIds>) {
        super(setting);

        this.label = setting.label;
        this.flag = setting.flag;
    }

    /**
     * @returns The setting component.
     */
    public get setting(): SettingFlag<CustomIds> {
        return this._setting as SettingFlag<CustomIds>;
    }

    public get settingsTextElem(): HTMLElement {
        if (!this._settingsTextElem) {
            this._settingsTextElem = document.createElement('div');
            this._settingsTextElem.innerText = this.setting._label;
            this._settingsTextElem.title = this.setting.description;
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
            this._rootElement.id = this.setting.id;
            this._rootElement.classList.add('setting');

            // create div element to contain our setting's text
            this._rootElement.appendChild(this.settingsTextElem);

            // create label element to wrap out input type
            const wrapperLabel = document.createElement('label');
            wrapperLabel.classList.add('tgl-switch');
            this._rootElement.appendChild(wrapperLabel);

            // create input type=checkbox
            this.checkbox.title = this.setting.description;
            this.checkbox.classList.add('tgl');
            this.checkbox.classList.add('tgl-flat');
            const slider = document.createElement('div');
            slider.classList.add('tgl-slider');
            wrapperLabel.appendChild(this.checkbox);
            wrapperLabel.appendChild(slider);

            // setup on change from checkbox
            this.checkbox.addEventListener('change', () => {
                if (this.setting.flag !== this.checkbox.checked) {
                    this.setting.flag = this.checkbox.checked;
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
    public set flag(inValue: boolean) {
        this.checkbox.checked = inValue;
    }

    /**
     * Get value
     */
    public get flag() {
        return this.checkbox.checked;
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

// Copyright Epic Games, Inc. All Rights Reserved.

import type {
    OptionParametersIds,
    SettingOption
} from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.3';
import { SettingUIBase } from './SettingUIBase';

export class SettingUIOption<
    CustomIds extends string = OptionParametersIds
> extends SettingUIBase {
    /* A select element that reflects the value of this setting. */
    _selector: HTMLSelectElement; // <select></select>

    /* This element contains a text node that reflects the setting's text label. */
    _settingsTextElem: HTMLElement;

    constructor(setting: SettingOption<CustomIds>) {
        super(setting);

        this.label = this.setting.label;
        this.options = this.setting.options;
        this.selected = this.setting.selected;
    }

    /**
     * @returns The setting component.
     */
    public get setting(): SettingOption<CustomIds> {
        return this._setting as SettingOption<CustomIds>;
    }

    public get selector(): HTMLSelectElement {
        if (!this._selector) {
            this._selector = document.createElement('select');
            this._selector.classList.add('form-control');
            this._selector.classList.add('settings-option');
        }
        return this._selector;
    }

    public get settingsTextElem(): HTMLElement {
        if (!this._settingsTextElem) {
            this._settingsTextElem = document.createElement('div');
            this._settingsTextElem.innerText = this.setting.label;
            this._settingsTextElem.title = this.setting.description;
        }
        return this._settingsTextElem;
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

    /**
     * @returns Return or creates a HTML element that represents this setting in the DOM.
     */
    public get rootElement(): HTMLElement {
        if (!this._rootElement) {
            // create root div with "setting" css class
            this._rootElement = document.createElement('div');
            this._rootElement.id = this.setting.id;
            this._rootElement.classList.add('setting');
            this._rootElement.classList.add('form-group');

            // create div element to contain our setting's text
            this._rootElement.appendChild(this.settingsTextElem);

            // create label element to wrap out input type
            const wrapperLabel = document.createElement('label');
            this._rootElement.appendChild(wrapperLabel);

            // create select element
            this.selector.title = this.setting.description;
            wrapperLabel.appendChild(this.selector);

            // setup on change from selector
            this.selector.onchange = () => {
                if (this.setting.selected !== this.selector.value) {
                    this.setting.selected = this.selector.value;
                    this.setting.updateURLParams();
                }
            };
        }
        return this._rootElement;
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

    public get options() {
        return [...this.selector.options].map((o) => o.value);
    }

    public set selected(value: string) {
        // A user may not specify the full possible value so we instead use the closest match.
        // eg ?xxx=H264 would select 'H264 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f'
        const filteredList = this.options.filter(
            (option: string) => option.indexOf(value) !== -1
        );
        if (filteredList.length) {
            this.selector.value = filteredList[0];
        }
    }

    public get selected() {
        return this.selector.value;
    }

    public disable() {
        this.selector.disabled = true;
    }

    public enable() {
        this.selector.disabled = false;
    }
}

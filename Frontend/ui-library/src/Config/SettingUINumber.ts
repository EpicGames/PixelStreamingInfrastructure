// Copyright Epic Games, Inc. All Rights Reserved.

import type {
    NumericParametersIds,
    SettingNumber
} from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.3';
import { Logger } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.3';
import { SettingUIBase } from './SettingUIBase';

/**
 * A number spinner with a text label beside it.
 */
export class SettingUINumber<
    CustomIds extends string = NumericParametersIds
> extends SettingUIBase {
    _spinner: HTMLInputElement;

    /* This element contains a text node that reflects the setting's text label. */
    _settingsTextElem: HTMLElement;

    constructor(setting: SettingNumber<CustomIds>) {
        super(setting);

        this.label = this.setting.label;
        this.number = this.setting.number;
    }

    /**
     * @returns The setting component.
     */
    public get setting(): SettingNumber<CustomIds> {
        return this._setting as SettingNumber<CustomIds>;
    }

    public get settingsTextElem(): HTMLElement {
        if (!this._settingsTextElem) {
            this._settingsTextElem = document.createElement('label');
            this._settingsTextElem.innerText = this.setting.label;
            this._settingsTextElem.title = this.setting.description;
        }
        return this._settingsTextElem;
    }

    /**
     * Get the HTMLInputElement for the button.
     */
    public get spinner(): HTMLInputElement {
        if (!this._spinner) {
            this._spinner = document.createElement('input');
            this._spinner.type = 'number';
            this._spinner.min = this.setting.min.toString();
            this._spinner.max = this.setting.max.toString();
            this._spinner.value = this.setting.number.toString();
            this._spinner.title = this.setting.description;
            this._spinner.classList.add('form-control');
        }
        return this._spinner;
    }

    /**
     * @returns Return or creates a HTML element that represents this setting in the DOM.
     */
    public get rootElement(): HTMLElement {
        if (!this._rootElement) {
            // create root div with "setting" css class
            this._rootElement = document.createElement('div');
            this._rootElement.classList.add('setting');
            this._rootElement.classList.add('form-group');

            // create div element to contain our setting's text
            this._rootElement.appendChild(this.settingsTextElem);

            // create label element to wrap out input type
            this._rootElement.appendChild(this.spinner);

            // setup onchange
            this.spinner.onchange = (event: Event) => {
                const inputElem = event.target as HTMLInputElement;

                const parsedValue = Number.parseInt(inputElem.value);

                if (Number.isNaN(parsedValue)) {
                    Logger.Warning(
                        Logger.GetStackTrace(),
                        `Could not parse value change into a valid number - value was ${inputElem.value}, resetting value to ${this.setting.min}`
                    );
                    if (this.setting.number !== this.setting.min) {
                        this.setting.number = this.setting.min;
                    }
                } else {
                    if (this.setting.number !== parsedValue) {
                        this.setting.number = parsedValue;
                        this.setting.updateURLParams();
                    }
                }
            };
        }
        return this._rootElement;
    }

    /**
     * Set the number in the spinner (will be clamped within range).
     */
    public set number(newNumber: number) {
        this.spinner.value = this.setting.clamp(newNumber).toString();
    }

    /**
     * Get value
     */
    public get number() {
        return +this.spinner.value;
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

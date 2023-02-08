// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '../Logger/Logger';
import { SettingBase } from './SettingBase';

/**
 * A number spinner with a text label beside it.
 */
export class SettingNumber extends SettingBase {
    _min: number;
    _max: number;
    _rootElement: HTMLElement;
    _spinner: HTMLInputElement;

    constructor(
        id: string,
        label: string,
        description: string,
        min: number,
        max: number,
        defaultNumber: number
    ) {
        super(id, label, description, defaultNumber);

        this._min = min;
        this._max = max;

        // attempt to read the number from the url params
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has(this.id)) {
            this.number = defaultNumber;
        } else {
            const parsedValue = Number.parseInt(urlParams.get(this.id));
            this.number = Number.isNaN(parsedValue)
                ? defaultNumber
                : parsedValue;
        }

        // setup onchange
        this.spinner.onchange = (event: Event) => {
            const inputElem = event.target as HTMLInputElement;

            const parsedValue = Number.parseInt(inputElem.value);

            if (Number.isNaN(parsedValue)) {
                Logger.Warning(
                    Logger.GetStackTrace(),
                    `Could not parse value change into a valid number - value was ${inputElem.value}, resetting value to ${this._min}`
                );
                this.number = this._min;
            } else {
                this.number = parsedValue;
                this.updateURLParams();
            }
        };
    }

    /**
     * Set the number in the spinner (will be clamped within range).
     */
    public set number(newNumber: number) {
        this.value = this.clamp(newNumber);
        this.spinner.value = this.value.toString();
    }

    /**
     * @returns The number stored in the spinner.
     */
    public get number(): number {
        return this.value as number;
    }

    /**
     * Clamps a number between the min and max values (inclusive).
     * @param inNumber The number to clamp.
     * @returns The clamped number.
     */
    public clamp(inNumber: number): number {
        return Math.max(Math.min(this._max, inNumber), this._min);
    }

    /**
     * Add a change listener to the spinner element.
     */
    public addOnChangedListener(onChangedFunc: (newNumber: number) => void) {
        this.onChange = onChangedFunc;
    }

    public updateURLParams(): void {
        // set url params like ?id=number
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set(this.id, this.value.toString());
        window.history.replaceState(
            {},
            '',
            urlParams.toString() !== ''
                ? `${location.pathname}?${urlParams}`
                : `${location.pathname}`
        );
    }

    /**
     * Get the HTMLInputElement for the button.
     */
    public get spinner(): HTMLInputElement {
        if (!this._spinner) {
            this._spinner = document.createElement('input');
            this._spinner.type = 'number';
            this._spinner.min = this._min.toString();
            this._spinner.max = this._max.toString();
            this._spinner.value = this.value.toString();
            this._spinner.title = this.description;
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
            const settingsTextElem = document.createElement('label');
            settingsTextElem.innerText = this._label;
            settingsTextElem.title = this.description;
            this._rootElement.appendChild(settingsTextElem);

            // create label element to wrap out input type
            this._rootElement.appendChild(this.spinner);
        }
        return this._rootElement;
    }
}

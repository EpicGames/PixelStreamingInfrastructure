// Copyright Epic Games, Inc. All Rights Reserved.

import type { NumericParametersIds } from './Config';
import { SettingBase } from './SettingBase';

/**
 * A number spinner with a text label beside it.
 */
export class SettingNumber<
    CustomIds extends string = NumericParametersIds
> extends SettingBase {
    _min: number;
    _max: number;

    id: NumericParametersIds | CustomIds;
    onChangeEmit: (changedValue: number) => void;
    useUrlParams: boolean;

    constructor(
        id: NumericParametersIds | CustomIds,
        label: string,
        description: string,
        min: number,
        max: number,
        defaultNumber: number,
        useUrlParams: boolean
    ) {
        super(id, label, description, defaultNumber);

        this._min = min;
        this._max = max;

        // attempt to read the number from the url params
        const urlParams = new URLSearchParams(window.location.search);
        if (!useUrlParams || !urlParams.has(this.id)) {
            this.number = defaultNumber;
        } else {
            const parsedValue = Number.parseInt(urlParams.get(this.id));
            this.number = Number.isNaN(parsedValue)
                ? defaultNumber
                : parsedValue;
        }
        this.useUrlParams = useUrlParams;
    }

    /**
     * Persist the setting value in URL.
     */
    public updateURLParams(): void {
        if (this.useUrlParams) {
            // set url params like ?id=number
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set(this.id, this.number.toString());
            window.history.replaceState(
                {},
                '',
                urlParams.toString() !== ''
                    ? `${location.pathname}?${urlParams}`
                    : `${location.pathname}`
            );
        }
    }

    /**
     * Set the number in the spinner (will be clamped within range).
     */
    public set number(newNumber: number) {
        this.value = this.clamp(newNumber);
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
     * Returns the minimum value
     * @returns The minimum value
     */
    public get min(): number {
        return this._min;
    }

    /**
     * Returns the maximum value
     * @returns The maximum value
     */
    public get max(): number {
        return this._max;
    }

    /**
     * Add a change listener to the spinner element.
     */
    public addOnChangedListener(onChangedFunc: (newNumber: number) => void) {
        this.onChange = onChangedFunc;
    }
}

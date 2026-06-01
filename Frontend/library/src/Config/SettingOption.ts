// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.8';
import type { OptionParametersIds } from './Config';
import { SettingBase } from './SettingBase';

/**
 * An Option setting object with a text label. Allows you to specify an array of options and select one of them.
 */
export class SettingOption<CustomIds extends string = OptionParametersIds> extends SettingBase {
    override id: OptionParametersIds | CustomIds;
    override onChangeEmit: (changedValue: string) => void;
    _options: Array<string>;

    /* Transforms the url parameter value into something else, by default no transformation is made, the url param is returned as-is. */
    _urlParamResolver: (urlParamValue: string) => string;

    constructor(
        id: OptionParametersIds | CustomIds,
        label: string,
        description: string,
        defaultTextValue: string,
        options: Array<string>,
        useUrlParams: boolean,

        defaultUrlParamResolver: (urlParamValue: string) => string = function (value: string) {
            /* Return the string as-is by default */
            return value;
        },

        defaultOnChangeListener: (changedValue: unknown, setting: SettingBase) => void = () => {
            /* Do nothing, to be overridden. */
        }
    ) {
        super(id, label, description, defaultTextValue, defaultOnChangeListener);

        this._urlParamResolver = defaultUrlParamResolver;

        const stringToMatch: string = this.hasURLParam(this.id)
            ? this._urlParamResolver(this.getURLParam(this.id))
            : defaultTextValue;

        this.options = options ?? [stringToMatch];
        this.selected = stringToMatch;
        this.useUrlParams = useUrlParams;
    }

    protected override getValueAsString(): string {
        return this.selected;
    }

    /**
     * Add a change listener to the select element.
     */
    public addOnChangedListener(onChangedFunc: (newValue: string) => void) {
        this.onChange = onChangedFunc;
    }

    /**
     * @returns All available options as an array
     */
    public get options(): Array<string> {
        return this._options;
    }

    /**
     * Set options
     * @param values Array of options
     */
    public set options(values: Array<string>) {
        this._options = values;
        this.onChangeEmit(this.selected);
    }

    /**
     * @returns Selected option as a string
     */
    public get selected(): string {
        return this.value as string;
    }

    /**
     * Set selected option if it matches one of the available options
     * @param value Selected option
     */
    public set selected(value: string) {
        if (value === undefined) {
            return;
        }

        // If options contains the value, then set that as selected
        if (this.options.includes(value)) {
            this.value = value;
        } else {
            Logger.Error(
                `Could not set "${value}" as the selected option for ${this.id} because it wasn't one of the options.`
            );
        }
    }

    /**
     * Set the url parameter resolver to do some transformation to the string value
     * that is extracted from the url parameters.
     * @param urlParam A function that transforms the extracted url parameter string for this setting to something else.
     */
    public set urlParamResolver(value: (urlParam: string) => string) {
        this._urlParamResolver = value;
    }
}

// Copyright Epic Games, Inc. All Rights Reserved.

import type { OptionParametersIds } from './Config';
import { SettingBase } from './SettingBase';

/**
 * An Option setting object with a text label. Allows you to specify an array of options and select one of them.
 */
export class SettingOption<
    CustomIds extends string = OptionParametersIds
> extends SettingBase {
    id: OptionParametersIds | CustomIds;
    onChangeEmit: (changedValue: string) => void;
    _options: Array<string>;
    useUrlParams: boolean;

    constructor(
        id: OptionParametersIds | CustomIds,
        label: string,
        description: string,
        defaultTextValue: string,
        options: Array<string>,
        useUrlParams: boolean,
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		defaultOnChangeListener: (changedValue: unknown, setting: SettingBase) => void = () => { /* Do nothing, to be overridden. */ }
    ) {
        super(id, label, description, [defaultTextValue, defaultTextValue], defaultOnChangeListener);

        this.options = options;
        const urlParams = new URLSearchParams(window.location.search);
        const stringToMatch: string =
            useUrlParams && urlParams.has(this.id)
                ? this.getUrlParamText()
                : defaultTextValue;
        this.selected = stringToMatch;
        this.useUrlParams = useUrlParams;
    }

    /**
     * Parse the text value from the url parameters.
     * @returns The text value parsed from the url if the url parameters contains /?id=value, but empty string if just /?id or no url param found.
     */
    getUrlParamText(): string {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has(this.id)) {
            return urlParams.get(this.id) ?? '';
        }
        return '';
    }

    /**
     * Persist the setting value in URL.
     */
    public updateURLParams() {
        if (this.useUrlParams) {
            // set url params
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set(this.id, this.selected);
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
        // A user may not specify the full possible value so we instead use the closest match.
        // eg ?xxx=H264 would select 'H264 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f'
        let filteredList = this.options.filter(
            (option: string) => option.indexOf(value) !== -1
        );
        if (filteredList.length) {
            this.value = filteredList[0];
            return;
        } 

        // A user has specified a codec with a fmtp string but this codec + fmtp line isn't available.
        // in that case, just use the codec
        filteredList = this.options.filter(
            (option: string) => option.indexOf(value.split(' ')[0]) !== -1
        );
        if (filteredList.length) {
            this.value = filteredList[0];
            return;
        }
    }
}

// Copyright Epic Games, Inc. All Rights Reserved.

import type { OptionParametersIds } from './Config';
import { SettingBase } from './SettingBase';

export class SettingOption extends SettingBase {
    id: OptionParametersIds;
    onChangeEmit: (changedValue: string) => void;
    _options: Array<string>;
    useUrlParams: boolean;

    constructor(
        id: OptionParametersIds,
        label: string,
        description: string,
        defaultTextValue: string,
        options: Array<string>,
        useUrlParams: boolean
    ) {
        super(id, label, description, [defaultTextValue, defaultTextValue]);

        this.options = options;
        const urlParams = new URLSearchParams(window.location.search);
        const stringToMatch: string = useUrlParams && urlParams.has(this.id)
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

    setUrlParamText() {
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

    public get options(): Array<string> {
        return this._options;
    }

    public set options(values: Array<string>) {
        this._options = values;
        this.onChangeEmit(this.selected);
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
            this.setUrlParamText();
        }
    }
}

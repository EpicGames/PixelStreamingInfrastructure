// Copyright Epic Games, Inc. All Rights Reserved.

import type { TextParametersIds } from './Config';
import { SettingBase } from './SettingBase';

export class SettingText extends SettingBase {
    id: TextParametersIds;
    onChangeEmit: (changedValue: string) => void;
    useUrlParams: boolean;

    constructor(
        id: TextParametersIds,
        label: string,
        description: string,
        defaultTextValue: string,
        useUrlParams: boolean
    ) {
        super(id, label, description, defaultTextValue);

        const urlParams = new URLSearchParams(window.location.search);
        if (!useUrlParams || !urlParams.has(this.id)) {
            this.text = defaultTextValue;
        } else {
            // parse flag from url parameters
            const urlParamFlag = this.getUrlParamText();
            this.text = urlParamFlag;
        }
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

    public updateURLParams() {
        if (this.useUrlParams) {
            // set url params
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set(this.id, this.text);
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
     * @return The setting's value.
     */
    public get text(): string {
        return this.value as string;
    }

    /**
     * Update the setting's stored value.
     * @param inValue The new value for the setting.
     */
    public set text(inValue: string) {
        this.value = inValue;
    }

}

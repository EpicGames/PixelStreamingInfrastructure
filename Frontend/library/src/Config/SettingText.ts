// Copyright Epic Games, Inc. All Rights Reserved.

import type { TextParametersIds } from './Config';
import { SettingBase } from './SettingBase';

/**
 * A text setting object with a text label.
 */
export class SettingText<
    CustomIds extends string = TextParametersIds
> extends SettingBase {
    id: TextParametersIds | CustomIds;
    onChangeEmit: (changedValue: string) => void;
    useUrlParams: boolean;

    constructor(
        id: TextParametersIds | CustomIds,
        label: string,
        description: string,
        defaultTextValue: string,
        useUrlParams: boolean,
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		defaultOnChangeListener: (changedValue: unknown, setting: SettingBase) => void = () => { /* Do nothing, to be overridden. */ }
    ) {
        super(id, label, description, defaultTextValue, defaultOnChangeListener);

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

    /**
     * Persist the setting value in URL.
     */
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

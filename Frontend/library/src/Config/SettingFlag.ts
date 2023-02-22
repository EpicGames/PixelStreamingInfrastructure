// Copyright Epic Games, Inc. All Rights Reserved.

import type { FlagsIds } from './Config';
import { SettingBase } from './SettingBase';

/**
 * A boolean flag setting object with a text label.
 */
export class SettingFlag<
    CustomIds extends string = FlagsIds
> extends SettingBase {
    id: FlagsIds | CustomIds;
    onChangeEmit: (changedValue: boolean) => void;
    useUrlParams: boolean;

    constructor(
        id: FlagsIds | CustomIds,
        label: string,
        description: string,
        defaultFlagValue: boolean,
        useUrlParams: boolean,
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		defaultOnChangeListener: (changedValue: unknown, setting: SettingBase) => void = () => { /* Do nothing, to be overridden. */ }
    ) {
        super(id, label, description, defaultFlagValue, defaultOnChangeListener);

        const urlParams = new URLSearchParams(window.location.search);
        if (!useUrlParams || !urlParams.has(this.id)) {
            this.flag = defaultFlagValue;
        } else {
            // parse flag from url parameters
            const urlParamFlag = this.getUrlParamFlag();
            this.flag = urlParamFlag;
        }
        this.useUrlParams = useUrlParams;
    }

    /**
     * Parse the flag value from the url parameters.
     * @returns True if the url parameters contains /?id, but False if /?id=false
     */
    getUrlParamFlag(): boolean {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has(this.id)) {
            if (
                urlParams.get(this.id) === 'false' ||
                urlParams.get(this.id) === 'False'
            ) {
                return false;
            }
            return true;
        }
        return false;
    }

    /**
     * Persist the setting value in URL.
     */
    public updateURLParams() {
        if (this.useUrlParams) {
            // set url params
            const urlParams = new URLSearchParams(window.location.search);
            if (this.flag === true) {
                urlParams.set(this.id, 'true');
            } else {
                urlParams.set(this.id, 'false');
            }
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
     * Enables this flag.
     */
    public enable(): void {
        this.flag = true;
    }

    /**
     * @return The setting's value.
     */
    public get flag(): boolean {
        return !!this.value;
    }

    /**
     * Update the setting's stored value.
     * @param inValue The new value for the setting.
     */
    public set flag(inValue: boolean) {
        this.value = inValue;
    }
}

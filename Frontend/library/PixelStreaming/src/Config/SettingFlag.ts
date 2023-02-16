// Copyright Epic Games, Inc. All Rights Reserved.

import type { FlagsIds } from './Config';
import { SettingBase } from './SettingBase';

export class SettingFlag extends SettingBase {
    id: FlagsIds;
    onChangeEmit: (changedValue: boolean) => void;

    constructor(
        id: FlagsIds,
        label: string,
        description: string,
        defaultFlagValue: boolean
    ) {
        super(id, label, description, defaultFlagValue);

        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has(this.id)) {
            this.flag = defaultFlagValue;
        } else {
            // parse flag from url parameters
            const urlParamFlag = this.getUrlParamFlag();
            this.flag = urlParamFlag;
        }
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

    public updateURLParams() {
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
        this.updateURLParams();
    }
}

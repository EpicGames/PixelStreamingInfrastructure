// Copyright Epic Games, Inc. All Rights Reserved.

import { SettingBase } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.3';

/**
 * Base class for a setting that has a text label, an arbitrary setting value it stores, an a HTML element that represents this setting.
 */
export class SettingUIBase {
    _setting: SettingBase;
    _rootElement: HTMLElement;

    constructor(setting: SettingBase) {
        this._setting = setting;
    }

    /**
     * @returns The setting component.
     */
    public get setting(): SettingBase {
        return this._setting;
    }

    /**
     * @returns Return or creates a HTML element that represents this setting in the DOM.
     */
    public get rootElement(): HTMLElement {
        if (!this._rootElement) {
            this._rootElement = document.createElement('div');
        }
        return this._rootElement;
    }
}

// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * Base class for a setting that has a text label, an arbitrary setting value it stores, an a HTML element that represents this setting.
 */
export class SettingBase {
    id: string;
    description: string;
    _label: string;
    _value: unknown;
    _rootElement: HTMLElement;
    onChange: (changedValue: unknown) => void;

    constructor(
        id: string,
        label: string,
        description: string,
        defaultSettingValue: unknown
    ) {
        this.onChange = () => {
            /* Do nothing, to be overridden. */
        };
        this.id = id;
        this.description = description;
        this.label = label;
        this.value = defaultSettingValue;
    }

    /**
     * Set the label text for the setting.
     * @param label setting label.
     */
    public set label(inLabel: string) {
        this._label = inLabel;
    }

    /**
     * @returns The label text for the setting.
     */
    public get label(): string {
        return this._label;
    }

    /**
     * @return The setting's value.
     */
    public get value(): unknown {
        return this._value;
    }

    /**
     * Update the setting's stored value.
     * @param inValue The new value for the setting.
     */
    public set value(inValue: unknown) {
        this._value = inValue;
        this.onChange(this._value);
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

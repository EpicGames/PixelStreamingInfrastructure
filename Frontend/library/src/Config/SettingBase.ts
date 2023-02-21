// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * Base class for a setting that has a text label and an arbitrary setting value it stores.
 */
export class SettingBase {
    id: string;
    description: string;
    _label: string;
    _value: unknown;
    onChange: (changedValue: unknown, setting: SettingBase) => void;
    onChangeEmit: (changedValue: unknown) => void;

    constructor(
        id: string,
        label: string,
        description: string,
        defaultSettingValue: unknown,
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		defaultOnChangeListener: (changedValue: unknown, setting: SettingBase) => void = () => { /* Do nothing, to be overridden. */ }
    ) {
        this.onChange = defaultOnChangeListener;

        this.onChangeEmit = () => {
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
        this.onChangeEmit(this._value);
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
        this.onChange(this._value, this);
        this.onChangeEmit(this._value);
    }
}

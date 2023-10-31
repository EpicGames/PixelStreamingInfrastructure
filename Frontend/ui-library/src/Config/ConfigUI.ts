// Copyright Epic Games, Inc. All Rights Reserved.

import {
    Config,
    FlagsIds,
    NumericParametersIds,
    OptionParametersIds,
    TextParametersIds,
    TextParameters,
    OptionParameters,
    Flags,
    NumericParameters,
    SettingsChangedEvent,
    SettingFlag,
    SettingNumber,
    SettingText,
    SettingOption,
    Logger,
    SettingBase
} from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.3';
import { SettingUIFlag } from './SettingUIFlag';
import { SettingUINumber } from './SettingUINumber';
import { SettingUIText } from './SettingUIText';
import { SettingUIOption } from './SettingUIOption';

export const LightMode = 'LightMode' as const;
type ExtraFlags = typeof LightMode;
export type FlagsIdsExtended = FlagsIds | ExtraFlags;

export class ConfigUI {
    private customFlags = new Map<
        FlagsIdsExtended,
        SettingFlag<FlagsIdsExtended>
    >();

    /* A map of flags that can be toggled - options that can be set in the application - e.g. Use Mic? */
    private flagsUi = new Map<
        FlagsIdsExtended,
        SettingUIFlag<FlagsIdsExtended>
    >();

    /* A map of numerical settings - options that can be in the application - e.g. MinBitrate */
    private numericParametersUi = new Map<
        NumericParametersIds,
        SettingUINumber
    >();

    /* A map of text settings - e.g. signalling server url */
    private textParametersUi = new Map<TextParametersIds, SettingUIText>();

    /* A map of enum based settings - e.g. preferred codec */
    private optionParametersUi = new Map<
        OptionParametersIds,
        SettingUIOption
    >();

    // ------------ Settings -----------------

    constructor(config: Config) {
        this.createCustomUISettings(config.useUrlParams);
        this.registerSettingsUIComponents(config);
    }

    /**
     * Create custom UI settings that are not provided by the Pixel Streaming library.
     */
    createCustomUISettings(useUrlParams: boolean) {
        this.customFlags.set(
            LightMode,
            new SettingFlag<FlagsIdsExtended>(
                LightMode,
                'Color Scheme: Dark Mode',
                'Page styling will be either light or dark',
                false /*if want to use system pref: (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches)*/,
                useUrlParams,
                (isLightMode: boolean, setting: SettingBase) => {
                    setting.label = `Color Scheme: ${isLightMode ? 'Light' : 'Dark'} Mode`;
                }
            )
        );
    }

    /**
     * Creates UI wrapper components for each setting element in config.
     * @param config
     */
    registerSettingsUIComponents(config: Config) {
        for (const setting of config.getFlags()) {
            this.flagsUi.set(setting.id, new SettingUIFlag(setting));
        }
        for (const setting of Array.from(this.customFlags.values())) {
            this.flagsUi.set(
                setting.id,
                new SettingUIFlag<FlagsIdsExtended>(setting)
            );
        }
        for (const setting of config.getTextSettings()) {
            this.textParametersUi.set(setting.id, new SettingUIText(setting));
        }
        for (const setting of config.getNumericSettings()) {
            this.numericParametersUi.set(
                setting.id,
                new SettingUINumber(setting)
            );
        }
        for (const setting of config.getOptionSettings()) {
            this.optionParametersUi.set(
                setting.id,
                new SettingUIOption(setting)
            );
        }
    }

    /**
     * Make DOM elements for a settings section with a heading.
     * @param settingsElem The parent container for our DOM elements.
     * @param sectionHeading The heading element to go into the section.
     * @returns The constructed DOM element for the section.
     */
    buildSectionWithHeading(settingsElem: HTMLElement, sectionHeading: string) {
        // make section element
        const sectionElem = document.createElement('section');
        sectionElem.classList.add('settingsContainer');

        // make section heading
        const psSettingsHeader = document.createElement('div');
        psSettingsHeader.classList.add('settingsHeader');
        psSettingsHeader.classList.add('settings-text');
        psSettingsHeader.textContent = sectionHeading;

        // add section and heading to parent settings element
        sectionElem.appendChild(psSettingsHeader);
        settingsElem.appendChild(sectionElem);
        return sectionElem;
    }

    /**
     * Setup flags with their default values and add them to the `Config.flags` map.
     * @param settingsElem - The element that contains all the individual settings sections, flags, and so on.
     */
    populateSettingsElement(settingsElem: HTMLElement): void {
        /* Setup all Pixel Streaming specific settings */
        const psSettingsSection = this.buildSectionWithHeading(
            settingsElem,
            'Pixel Streaming'
        );

        // make settings show up in DOM
        this.addSettingText(
            psSettingsSection,
            this.textParametersUi.get(TextParameters.SignallingServerUrl)
        );
        this.addSettingOption(
            psSettingsSection,
            this.optionParametersUi.get(OptionParameters.StreamerId)
        );
        this.addSettingFlag(
            psSettingsSection,
            this.flagsUi.get(Flags.AutoConnect)
        );
        this.addSettingFlag(
            psSettingsSection,
            this.flagsUi.get(Flags.AutoPlayVideo)
        );
        this.addSettingFlag(
            psSettingsSection,
            this.flagsUi.get(Flags.BrowserSendOffer)
        );
        this.addSettingFlag(
            psSettingsSection, 
            this.flagsUi.get(Flags.UseMic)
        );
        this.addSettingFlag(
            psSettingsSection,
            this.flagsUi.get(Flags.StartVideoMuted)
        );
        this.addSettingFlag(
            psSettingsSection,
            this.flagsUi.get(Flags.IsQualityController)
        );
        this.addSettingFlag(
            psSettingsSection,
            this.flagsUi.get(Flags.ForceMonoAudio)
        );
        this.addSettingFlag(
            psSettingsSection,
            this.flagsUi.get(Flags.ForceTURN)
        );
        this.addSettingFlag(
            psSettingsSection,
            this.flagsUi.get(Flags.SuppressBrowserKeys)
        );
        this.addSettingFlag(
            psSettingsSection,
            this.flagsUi.get(Flags.AFKDetection)
        );
        this.addSettingFlag(
            psSettingsSection,
            this.flagsUi.get(Flags.WaitForStreamer)
        );
        this.addSettingNumeric(
            psSettingsSection,
            this.numericParametersUi.get(NumericParameters.AFKTimeoutSecs)
        );
        this.addSettingNumeric(
            psSettingsSection,
            this.numericParametersUi.get(NumericParameters.MaxReconnectAttempts)
        );
        this.addSettingNumeric(
            psSettingsSection,
            this.numericParametersUi.get(NumericParameters.StreamerAutoJoinInterval)
        );

        /* Setup all view/ui related settings under this section */
        const viewSettingsSection = this.buildSectionWithHeading(
            settingsElem,
            'UI'
        );
        this.addSettingFlag(
            viewSettingsSection,
            this.flagsUi.get(Flags.MatchViewportResolution)
        );

        this.addSettingFlag(
            viewSettingsSection,
            this.flagsUi.get(Flags.HoveringMouseMode)
        );

        this.addSettingFlag(viewSettingsSection, this.flagsUi.get(LightMode));

        /* Setup all encoder related settings under this section */
        const inputSettingsSection = this.buildSectionWithHeading(
            settingsElem,
            'Input'
        );
        
        this.addSettingFlag(
            inputSettingsSection,
            this.flagsUi.get(Flags.KeyboardInput)
        );

        this.addSettingFlag(
            inputSettingsSection,
            this.flagsUi.get(Flags.MouseInput)
        );

        this.addSettingFlag(
            inputSettingsSection,
            this.flagsUi.get(Flags.TouchInput)
        );

        this.addSettingFlag(
            inputSettingsSection,
            this.flagsUi.get(Flags.GamepadInput)
        );

        this.addSettingFlag(
            inputSettingsSection,
            this.flagsUi.get(Flags.XRControllerInput)
        );

        /* Setup all encoder related settings under this section */
        const encoderSettingsSection = this.buildSectionWithHeading(
            settingsElem,
            'Encoder'
        );

        this.addSettingNumeric(
            encoderSettingsSection,
            this.numericParametersUi.get(NumericParameters.MinQP)
        );
        this.addSettingNumeric(
            encoderSettingsSection,
            this.numericParametersUi.get(NumericParameters.MaxQP)
        );

        const preferredCodecOption = this.optionParametersUi.get(
            OptionParameters.PreferredCodec
        );
        this.addSettingOption(
            encoderSettingsSection,
            this.optionParametersUi.get(OptionParameters.PreferredCodec)
        );
        if (
            preferredCodecOption &&
            [...preferredCodecOption.selector.options]
                .map((o) => o.value)
                .includes('Only available on Chrome')
        ) {
            preferredCodecOption.disable();
        }

        /* Setup all webrtc related settings under this section */
        const webrtcSettingsSection = this.buildSectionWithHeading(
            settingsElem,
            'WebRTC'
        );

        this.addSettingNumeric(
            webrtcSettingsSection,
            this.numericParametersUi.get(NumericParameters.WebRTCFPS)
        );
        this.addSettingNumeric(
            webrtcSettingsSection,
            this.numericParametersUi.get(NumericParameters.WebRTCMinBitrate)
        );
        this.addSettingNumeric(
            webrtcSettingsSection,
            this.numericParametersUi.get(NumericParameters.WebRTCMaxBitrate)
        );
    }

    /**
     * Add a SettingText element to a particular settings section in the DOM and registers that text in the text settings map.
     * @param settingsSection The settings section HTML element.
     * @param settingText The textual settings object.
     */
    addSettingText(
        settingsSection: HTMLElement,
        settingText?: SettingUIText
    ): void {
        if (settingText) {
            settingsSection.appendChild(settingText.rootElement);
            this.textParametersUi.set(settingText.setting.id, settingText);
        }
    }

    /**
     * Add a SettingFlag element to a particular settings section in the DOM and registers that flag in the Config.flag map.
     * @param settingsSection The settings section HTML element.
     * @param settingFlag The settings flag object.
     */
    addSettingFlag(
        settingsSection: HTMLElement,
        settingFlag?: SettingUIFlag<FlagsIdsExtended>
    ): void {
        if (settingFlag) {
            settingsSection.appendChild(settingFlag.rootElement);
            this.flagsUi.set(settingFlag.setting.id, settingFlag);
        }
    }

    /**
     * Add a numeric setting element to a particular settings section in the DOM and registers that flag in the Config.numericParameters map.
     * @param settingsSection The settings section HTML element.
     * @param settingFlag The settings flag object.
     */
    addSettingNumeric(
        settingsSection: HTMLElement,
        setting?: SettingUINumber
    ): void {
        if (setting) {
            settingsSection.appendChild(setting.rootElement);
            this.numericParametersUi.set(setting.setting.id, setting);
        }
    }

    /**
     * Add an enum based settings element to a particular settings section in the DOM and registers that flag in the Config.enumParameters map.
     * @param settingsSection The settings section HTML element.
     * @param settingFlag The settings flag object.
     */
    addSettingOption(
        settingsSection: HTMLElement,
        setting?: SettingUIOption
    ): void {
        if (setting) {
            settingsSection.appendChild(setting.rootElement);
            this.optionParametersUi.set(setting.setting.id, setting);
        }
    }

    onSettingsChanged({ data: { id, target, type } }: SettingsChangedEvent) {
        if (type === 'flag') {
            const _id = id as FlagsIds;
            const _target = target as SettingFlag;
            const setting = this.flagsUi.get(_id);
            if (setting) {
                if (setting.flag !== _target.flag) {
                    setting.flag = _target.flag;
                }
                if (setting.label !== _target.label) {
                    setting.label = _target.label;
                }
            }
        } else if (type === 'number') {
            const _id = id as NumericParametersIds;
            const _target = target as SettingNumber;
            const setting = this.numericParametersUi.get(_id);
            if (setting) {
                if (setting.number !== _target.number) {
                    setting.number = _target.number;
                }
                if (setting.label !== _target.label) {
                    setting.label = _target.label;
                }
            }
        } else if (type === 'text') {
            const _id = id as TextParametersIds;
            const _target = target as SettingText;
            const setting = this.textParametersUi.get(_id);
            if (setting) {
                if (setting.text !== _target.text) {
                    setting.text = _target.text;
                }
                if (setting.label !== _target.label) {
                    setting.label = _target.label;
                }
            }
        } else if (type === 'option') {
            const _id = id as OptionParametersIds;
            const _target = target as SettingOption;
            const setting = this.optionParametersUi.get(_id);
            if (setting) {
                const uiOptions = setting.options;
                const targetOptions = _target.options;
                if (
                    uiOptions.length !== targetOptions.length ||
                    !uiOptions.every((value) => targetOptions.includes(value))
                ) {
                    setting.options = _target.options;
                }
                if (setting.selected !== _target.selected) {
                    setting.selected = _target.selected;
                }
                if (setting.label !== _target.label) {
                    setting.label = _target.label;
                }
            }
        }
    }

    /**
     * Add a callback to fire when the flag is toggled.
     * @param id The id of the flag.
     * @param onChangeListener The callback to fire when the value changes.
     */
    addCustomFlagOnSettingChangedListener(
        id: ExtraFlags,
        onChangeListener: (newFlagValue: boolean) => void
    ): void {
        if (this.customFlags.has(id)) {
            this.customFlags.get(id).onChange = onChangeListener;
        }
    }

    /**
     * Set the label for the flag.
     * @param id The id of the flag.
     * @param label The new label to use for the flag.
     */
    setCustomFlagLabel(id: ExtraFlags, label: string) {
        if (!this.customFlags.has(id)) {
            Logger.Warning(
                Logger.GetStackTrace(),
                `Cannot set label for flag called ${id} - it does not exist in the Config.flags map.`
            );
        } else {
            this.customFlags.get(id).label = label;
            this.flagsUi.get(id).label = label;
        }
    }

    /**
     * Get the value of the configuration flag which has the given id.
     * @param id The unique id for the flag.
     * @returns True if the flag is enabled.
     */
    isCustomFlagEnabled(id: ExtraFlags): boolean {
        return this.customFlags.get(id).flag as boolean;
    }
}

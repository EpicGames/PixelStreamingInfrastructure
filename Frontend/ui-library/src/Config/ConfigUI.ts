// Copyright Epic Games, Inc. All Rights Reserved.

import {
    Config,
    NumericParametersIds,
    OptionParametersIds,
    TextParametersIds,
    TextParameters,
    OptionParameters,
    Flags,
    NumericParameters,
    SettingsChangedEvent,
    SettingFlag,
    Logger,
    SettingBase,
    isFlagId,
    isNumericId,
    isTextId,
    isOptionId
} from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.8';
import { SettingUIFlag } from './SettingUIFlag';
import { SettingUINumber } from './SettingUINumber';
import { SettingUIText } from './SettingUIText';
import { SettingUIOption } from './SettingUIOption';
import {
    ExtraFlags,
    ExtraFlagsIds,
    FlagsIdsExtended,
    isSectionEnabled,
    isSettingEnabled,
    OptionIdsExtended,
    SettingsSections,
    SettingsPanelConfiguration
} from '../UI/UIConfigurationTypes';

export class ConfigUI {
    private customFlags = new Map<FlagsIdsExtended, SettingFlag<FlagsIdsExtended>>();

    /* A map of flags that can be toggled - options that can be set in the application - e.g. Use Mic? */
    private flagsUi = new Map<FlagsIdsExtended, SettingUIFlag<FlagsIdsExtended>>();

    /* A map of numerical settings - options that can be in the application - e.g. MinBitrate */
    private numericParametersUi = new Map<NumericParametersIds, SettingUINumber>();

    /* A map of text settings - e.g. signalling server url */
    private textParametersUi = new Map<TextParametersIds, SettingUIText>();

    /* A map of enum based settings - e.g. preferred codec */
    private optionParametersUi = new Map<OptionParametersIds, SettingUIOption>();

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
            ExtraFlags.LightMode,
            new SettingFlag<FlagsIdsExtended>(
                ExtraFlags.LightMode,
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
     * @param config -
     */
    registerSettingsUIComponents(config: Config) {
        for (const setting of config.getFlags()) {
            this.flagsUi.set(setting.id, new SettingUIFlag(setting));
        }
        for (const setting of Array.from(this.customFlags.values())) {
            this.flagsUi.set(setting.id, new SettingUIFlag<FlagsIdsExtended>(setting));
        }
        for (const setting of config.getTextSettings()) {
            this.textParametersUi.set(setting.id, new SettingUIText(setting));
        }
        for (const setting of config.getNumericSettings()) {
            this.numericParametersUi.set(setting.id, new SettingUINumber(setting));
        }
        for (const setting of config.getOptionSettings()) {
            this.optionParametersUi.set(setting.id, new SettingUIOption(setting));
        }
    }

    /**
     * Make DOM elements for a settings section with a heading.
     * @param settingsElem - The parent container for our DOM elements.
     * @param sectionHeading - The heading element to go into the section.
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
     * @param settingsElem - - The element that contains all the individual settings sections, flags, and so on.
     */
    populateSettingsElement(settingsElem: HTMLElement, settingsConfig: SettingsPanelConfiguration): void {
        if (isSectionEnabled(settingsConfig, SettingsSections.PixelStreaming)) {
            /* Setup all Pixel Streaming specific settings */
            const psSettingsSection = this.buildSectionWithHeading(
                settingsElem,
                SettingsSections.PixelStreaming
            );

            // make settings show up in DOM
            if (isSettingEnabled(settingsConfig, TextParameters.SignallingServerUrl))
                this.addSettingText(
                    psSettingsSection,
                    this.textParametersUi.get(TextParameters.SignallingServerUrl)
                );
            if (isSettingEnabled(settingsConfig, Flags.BrowserSendOffer))
                this.addSettingFlag(psSettingsSection, this.flagsUi.get(Flags.BrowserSendOffer));
            if (isSettingEnabled(settingsConfig, OptionParameters.StreamerId))
                this.addSettingOption(
                    psSettingsSection,
                    this.optionParametersUi.get(OptionParameters.StreamerId)
                );
            if (isSettingEnabled(settingsConfig, Flags.AutoConnect))
                this.addSettingFlag(psSettingsSection, this.flagsUi.get(Flags.AutoConnect));
            if (isSettingEnabled(settingsConfig, Flags.AutoPlayVideo))
                this.addSettingFlag(psSettingsSection, this.flagsUi.get(Flags.AutoPlayVideo));
            if (isSettingEnabled(settingsConfig, Flags.UseMic))
                this.addSettingFlag(psSettingsSection, this.flagsUi.get(Flags.UseMic));
            if (isSettingEnabled(settingsConfig, Flags.UseCamera))
                this.addSettingFlag(psSettingsSection, this.flagsUi.get(Flags.UseCamera));
            if (isSettingEnabled(settingsConfig, Flags.StartVideoMuted))
                this.addSettingFlag(psSettingsSection, this.flagsUi.get(Flags.StartVideoMuted));
            if (isSettingEnabled(settingsConfig, Flags.IsQualityController))
                this.addSettingFlag(psSettingsSection, this.flagsUi.get(Flags.IsQualityController));
            if (isSettingEnabled(settingsConfig, Flags.ForceMonoAudio))
                this.addSettingFlag(psSettingsSection, this.flagsUi.get(Flags.ForceMonoAudio));
            if (isSettingEnabled(settingsConfig, Flags.ForceTURN))
                this.addSettingFlag(psSettingsSection, this.flagsUi.get(Flags.ForceTURN));
            if (isSettingEnabled(settingsConfig, Flags.SuppressBrowserKeys))
                this.addSettingFlag(psSettingsSection, this.flagsUi.get(Flags.SuppressBrowserKeys));
            if (isSettingEnabled(settingsConfig, Flags.AFKDetection))
                this.addSettingFlag(psSettingsSection, this.flagsUi.get(Flags.AFKDetection));
            if (isSettingEnabled(settingsConfig, Flags.WaitForStreamer))
                this.addSettingFlag(psSettingsSection, this.flagsUi.get(Flags.WaitForStreamer));
            if (isSettingEnabled(settingsConfig, NumericParameters.AFKTimeoutSecs))
                this.addSettingNumeric(
                    psSettingsSection,
                    this.numericParametersUi.get(NumericParameters.AFKTimeoutSecs)
                );
            if (isSettingEnabled(settingsConfig, NumericParameters.AFKCountdownSecs))
                this.addSettingNumeric(
                    psSettingsSection,
                    this.numericParametersUi.get(NumericParameters.AFKCountdownSecs)
                );
            if (isSettingEnabled(settingsConfig, NumericParameters.MaxReconnectAttempts))
                this.addSettingNumeric(
                    psSettingsSection,
                    this.numericParametersUi.get(NumericParameters.MaxReconnectAttempts)
                );
            if (isSettingEnabled(settingsConfig, NumericParameters.StreamerAutoJoinInterval))
                this.addSettingNumeric(
                    psSettingsSection,
                    this.numericParametersUi.get(NumericParameters.StreamerAutoJoinInterval)
                );
            if (isSettingEnabled(settingsConfig, NumericParameters.KeepaliveDelay))
                this.addSettingNumeric(
                    psSettingsSection,
                    this.numericParametersUi.get(NumericParameters.KeepaliveDelay)
                );
        }

        if (isSectionEnabled(settingsConfig, SettingsSections.UI)) {
            /* Setup all view/ui related settings under this section */
            const viewSettingsSection = this.buildSectionWithHeading(settingsElem, SettingsSections.UI);
            if (isSettingEnabled(settingsConfig, Flags.MatchViewportResolution))
                this.addSettingFlag(viewSettingsSection, this.flagsUi.get(Flags.MatchViewportResolution));

            if (isSettingEnabled(settingsConfig, NumericParameters.ViewportResScale))
                this.addSettingNumeric(
                    viewSettingsSection,
                    this.numericParametersUi.get(NumericParameters.ViewportResScale)
                );

            if (isSettingEnabled(settingsConfig, Flags.HoveringMouseMode))
                this.addSettingFlag(viewSettingsSection, this.flagsUi.get(Flags.HoveringMouseMode));

            if (isSettingEnabled(settingsConfig, ExtraFlags.LightMode))
                this.addSettingFlag(viewSettingsSection, this.flagsUi.get(ExtraFlags.LightMode));
        }

        if (isSectionEnabled(settingsConfig, SettingsSections.Input)) {
            /* Setup all encoder related settings under this section */
            const inputSettingsSection = this.buildSectionWithHeading(settingsElem, SettingsSections.Input);

            if (isSettingEnabled(settingsConfig, Flags.KeyboardInput))
                this.addSettingFlag(inputSettingsSection, this.flagsUi.get(Flags.KeyboardInput));

            if (isSettingEnabled(settingsConfig, Flags.MouseInput))
                this.addSettingFlag(inputSettingsSection, this.flagsUi.get(Flags.MouseInput));

            if (isSettingEnabled(settingsConfig, Flags.MouseDoubleClickAutoRelease))
                this.addSettingFlag(
                    inputSettingsSection,
                    this.flagsUi.get(Flags.MouseDoubleClickAutoRelease)
                );

            if (isSettingEnabled(settingsConfig, Flags.FakeMouseWithTouches))
                this.addSettingFlag(inputSettingsSection, this.flagsUi.get(Flags.FakeMouseWithTouches));

            if (isSettingEnabled(settingsConfig, Flags.TouchInput))
                this.addSettingFlag(inputSettingsSection, this.flagsUi.get(Flags.TouchInput));

            if (isSettingEnabled(settingsConfig, Flags.GamepadInput))
                this.addSettingFlag(inputSettingsSection, this.flagsUi.get(Flags.GamepadInput));

            if (isSettingEnabled(settingsConfig, Flags.XRControllerInput))
                this.addSettingFlag(inputSettingsSection, this.flagsUi.get(Flags.XRControllerInput));
        }

        if (isSectionEnabled(settingsConfig, SettingsSections.Encoder)) {
            /* Setup all encoder related settings under this section */
            const encoderSettingsSection = this.buildSectionWithHeading(
                settingsElem,
                SettingsSections.Encoder
            );

            if (isSettingEnabled(settingsConfig, NumericParameters.CompatQualityMin))
                this.addSettingNumeric(
                    encoderSettingsSection,
                    this.numericParametersUi.get(NumericParameters.CompatQualityMin)
                );
            if (isSettingEnabled(settingsConfig, NumericParameters.CompatQualityMax))
                this.addSettingNumeric(
                    encoderSettingsSection,
                    this.numericParametersUi.get(NumericParameters.CompatQualityMax)
                );

            const preferredCodecOption = this.optionParametersUi.get(OptionParameters.PreferredCodec);
            if (isSettingEnabled(settingsConfig, OptionParameters.PreferredCodec))
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

            if (isSettingEnabled(settingsConfig, OptionParameters.PreferredQuality))
                this.addSettingOption(
                    encoderSettingsSection,
                    this.optionParametersUi.get(OptionParameters.PreferredQuality)
                );
        }

        if (isSectionEnabled(settingsConfig, SettingsSections.WebRTC)) {
            /* Setup all webrtc related settings under this section */
            const webrtcSettingsSection = this.buildSectionWithHeading(settingsElem, SettingsSections.WebRTC);

            if (isSettingEnabled(settingsConfig, NumericParameters.WebRTCFPS))
                this.addSettingNumeric(
                    webrtcSettingsSection,
                    this.numericParametersUi.get(NumericParameters.WebRTCFPS)
                );
            if (isSettingEnabled(settingsConfig, NumericParameters.WebRTCMinBitrate))
                this.addSettingNumeric(
                    webrtcSettingsSection,
                    this.numericParametersUi.get(NumericParameters.WebRTCMinBitrate)
                );
            if (isSettingEnabled(settingsConfig, NumericParameters.WebRTCMaxBitrate))
                this.addSettingNumeric(
                    webrtcSettingsSection,
                    this.numericParametersUi.get(NumericParameters.WebRTCMaxBitrate)
                );
        }
    }

    /**
     * Add a SettingText element to a particular settings section in the DOM and registers that text in the text settings map.
     * @param settingsSection - The settings section HTML element.
     * @param settingText - The textual settings object.
     */
    addSettingText(settingsSection: HTMLElement, settingText?: SettingUIText): void {
        if (settingText) {
            settingsSection.appendChild(settingText.rootElement);
            this.textParametersUi.set(settingText.setting.id, settingText);
        }
    }

    /**
     * Add a SettingFlag element to a particular settings section in the DOM and registers that flag in the Config.flag map.
     * @param settingsSection - The settings section HTML element.
     * @param settingFlag - The settings flag object.
     */
    addSettingFlag(settingsSection: HTMLElement, settingFlag?: SettingUIFlag<FlagsIdsExtended>): void {
        if (settingFlag) {
            settingsSection.appendChild(settingFlag.rootElement);
            this.flagsUi.set(settingFlag.setting.id, settingFlag);
        }
    }

    /**
     * Add a numeric setting element to a particular settings section in the DOM and registers that flag in the Config.numericParameters map.
     * @param settingsSection - The settings section HTML element.
     * @param settingFlag - The settings flag object.
     */
    addSettingNumeric(settingsSection: HTMLElement, setting?: SettingUINumber): void {
        if (setting) {
            settingsSection.appendChild(setting.rootElement);
            this.numericParametersUi.set(setting.setting.id, setting);
        }
    }

    /**
     * Add an enum based settings element to a particular settings section in the DOM and registers that flag in the Config.enumParameters map.
     * @param settingsSection - The settings section HTML element.
     * @param settingFlag - The settings flag object.
     */
    addSettingOption(settingsSection: HTMLElement, setting?: SettingUIOption): void {
        if (setting) {
            settingsSection.appendChild(setting.rootElement);
            this.optionParametersUi.set(setting.setting.id, setting);
        }
    }

    onSettingsChanged({ data: { id, target, type } }: SettingsChangedEvent) {
        if (type === 'flag') {
            const setting = this.flagsUi.get(id);
            if (setting) {
                if (setting.flag !== target.flag) {
                    setting.flag = target.flag;
                }
                if (setting.label !== target.label) {
                    setting.label = target.label;
                }
            }
        } else if (type === 'number') {
            const setting = this.numericParametersUi.get(id);
            if (setting) {
                if (setting.number !== target.number) {
                    setting.number = target.number;
                }
                if (setting.label !== target.label) {
                    setting.label = target.label;
                }
            }
        } else if (type === 'text') {
            const setting = this.textParametersUi.get(id);
            if (setting) {
                if (setting.text !== target.text) {
                    setting.text = target.text;
                }
                if (setting.label !== target.label) {
                    setting.label = target.label;
                }
            }
        } else if (type === 'option') {
            const setting = this.optionParametersUi.get(id);
            if (setting) {
                const uiOptions = setting.options;
                const targetOptions = target.options;
                if (
                    uiOptions.length !== targetOptions.length ||
                    !uiOptions.every((value) => targetOptions.includes(value))
                ) {
                    setting.options = target.options;
                }
                if (setting.selected !== target.selected) {
                    setting.selected = target.selected;
                }
                if (setting.label !== target.label) {
                    setting.label = target.label;
                }
            }
        }
    }

    /**
     * Add a callback to fire when the flag is toggled.
     * @param id - The id of the flag.
     * @param onChangeListener - The callback to fire when the value changes.
     */
    addCustomFlagOnSettingChangedListener(
        id: ExtraFlagsIds,
        onChangeListener: (newFlagValue: boolean) => void
    ): void {
        if (this.customFlags.has(id)) {
            this.customFlags.get(id).onChange = onChangeListener;
        }
    }

    /**
     * Set the label for the flag.
     * @param id - The id of the flag.
     * @param label - The new label to use for the flag.
     */
    setCustomFlagLabel(id: ExtraFlagsIds, label: string) {
        if (!this.customFlags.has(id)) {
            Logger.Warning(
                `Cannot set label for flag called ${id} - it does not exist in the Config.flags map.`
            );
        } else {
            this.customFlags.get(id).label = label;
            this.flagsUi.get(id).label = label;
        }
    }

    /**
     * Get the value of the configuration flag which has the given id.
     * @param id - The unique id for the flag.
     * @returns True if the flag is enabled.
     */
    isCustomFlagEnabled(id: ExtraFlagsIds): boolean {
        return this.customFlags.get(id).flag;
    }

    disableSetting(id: OptionIdsExtended): void {
        if (isFlagId(id)) {
            this.flagsUi.get(id)?.disable();
        } else if (isNumericId(id)) {
            this.numericParametersUi.get(id)?.disable();
        } else if (isTextId(id)) {
            this.textParametersUi.get(id)?.disable();
        } else if (isOptionId(id)) {
            this.optionParametersUi.get(id)?.disable();
        }
    }

    enableSetting(id: OptionIdsExtended): void {
        if (isFlagId(id)) {
            this.flagsUi.get(id)?.enable();
        } else if (isNumericId(id)) {
            this.numericParametersUi.get(id)?.enable();
        } else if (isTextId(id)) {
            this.textParametersUi.get(id)?.enable();
        } else if (isOptionId(id)) {
            this.optionParametersUi.get(id)?.enable();
        }
    }
}

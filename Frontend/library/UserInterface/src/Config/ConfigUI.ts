// Copyright Epic Games, Inc. All Rights Reserved.

import { Config, FlagsIds, NumericParametersIds, OptionParametersIds, TextParametersIds, TextParameters, OptionParameters, Flags, NumericParameters, SettingsChangedEvent, SettingFlag, SettingNumber, SettingText, SettingOption } from '@epicgames-ps/lib-pixelstreamingfrontend-dev';
import { SettingUIFlag } from './SettingUIFlag';
import { SettingUINumber } from './SettingUINumber';
import { SettingUIText } from './SettingUIText';
import { SettingUIOption } from './SettingUIOption';

export class ConfigUI {
    /* A map of flags that can be toggled - options that can be set in the application - e.g. Use Mic? */
    private flags = new Map<FlagsIds, SettingUIFlag>();

    /* A map of numerical settings - options that can be in the application - e.g. MinBitrate */
    private numericParameters = new Map<NumericParametersIds, SettingUINumber>();

    /* A map of text settings - e.g. signalling server url */
    private textParameters = new Map<TextParametersIds, SettingUIText>();

    /* A map of enum based settings - e.g. preferred codec */
    private optionParameters = new Map<OptionParametersIds, SettingUIOption>();

    // ------------ Settings -----------------

    constructor(config: Config) {
        this.registerSettingsUIComponents(config);
    }

    /**
     * Creates UI wrapper components for each setting element in config.
     * @param config 
     */
    registerSettingsUIComponents(config: Config) {
        for (const setting of config.getFlags() ) {
            this.flags.set(setting.id, new SettingUIFlag(setting));
        }
        for (const setting of config.getTextSettings() ) {
            this.textParameters.set(setting.id, new SettingUIText(setting));
        }
        for (const setting of config.getNumericSettings() ) {
            this.numericParameters.set(setting.id, new SettingUINumber(setting));
        }
        for (const setting of config.getOptionSettings() ) {
            this.optionParameters.set(setting.id, new SettingUIOption(setting));
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
            this.textParameters.get(TextParameters.SignallingServerUrl)
        );
        this.addSettingOption(
            psSettingsSection,
            this.optionParameters.get(OptionParameters.StreamerId)
        );
        this.addSettingFlag(
            psSettingsSection,
            this.flags.get(Flags.AutoConnect)
        );
        this.addSettingFlag(
            psSettingsSection,
            this.flags.get(Flags.AutoPlayVideo)
        );
        this.addSettingFlag(
            psSettingsSection,
            this.flags.get(Flags.BrowserSendOffer)
        );
        this.addSettingFlag(psSettingsSection, this.flags.get(Flags.UseMic));
        this.addSettingFlag(
            psSettingsSection,
            this.flags.get(Flags.StartVideoMuted)
        );
        this.addSettingFlag(psSettingsSection, this.flags.get(Flags.PreferSFU));
        this.addSettingFlag(
            psSettingsSection,
            this.flags.get(Flags.IsQualityController)
        );
        this.addSettingFlag(
            psSettingsSection,
            this.flags.get(Flags.ForceMonoAudio)
        );
        this.addSettingFlag(psSettingsSection, this.flags.get(Flags.ForceTURN));
        this.addSettingFlag(
            psSettingsSection,
            this.flags.get(Flags.SuppressBrowserKeys)
        );
        this.addSettingFlag(
            psSettingsSection,
            this.flags.get(Flags.AFKDetection)
        );
        this.addSettingNumeric(
            psSettingsSection,
            this.numericParameters.get(NumericParameters.AFKTimeoutSecs)
        );

        /* Setup all view/ui related settings under this section */
        const viewSettingsSection = this.buildSectionWithHeading(
            settingsElem,
            'UI'
        );
        this.addSettingFlag(
            viewSettingsSection,
            this.flags.get(Flags.MatchViewportResolution)
        );

        this.addSettingFlag(viewSettingsSection, this.flags.get(Flags.HoveringMouseMode));

        this.addSettingFlag(viewSettingsSection, this.flags.get(Flags.LightMode));

        /* Setup all encoder related settings under this section */
        const encoderSettingsSection = this.buildSectionWithHeading(
            settingsElem,
            'Encoder'
        );

        this.addSettingNumeric(
            encoderSettingsSection,
            this.numericParameters.get(NumericParameters.MinQP)
        );
        this.addSettingNumeric(
            encoderSettingsSection,
            this.numericParameters.get(NumericParameters.MaxQP)
        );

        const preferredCodecOption = this.optionParameters.get(OptionParameters.PreferredCodec);
        this.addSettingOption(
            encoderSettingsSection,
            this.optionParameters.get(OptionParameters.PreferredCodec)
        );
        if(preferredCodecOption && [...preferredCodecOption.selector.options].map(o => o.value).includes("Only available on Chrome")) {
            preferredCodecOption.disable();
        }

        /* Setup all webrtc related settings under this section */
        const webrtcSettingsSection = this.buildSectionWithHeading(
            settingsElem,
            'WebRTC'
        );

        this.addSettingNumeric(
            webrtcSettingsSection,
            this.numericParameters.get(NumericParameters.WebRTCFPS)
        );
        this.addSettingNumeric(
            webrtcSettingsSection,
            this.numericParameters.get(NumericParameters.WebRTCMinBitrate)
        );
        this.addSettingNumeric(
            webrtcSettingsSection,
            this.numericParameters.get(NumericParameters.WebRTCMaxBitrate)
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
            this.textParameters.set(settingText.setting.id, settingText);
        }
    }

    /**
     * Add a SettingFlag element to a particular settings section in the DOM and registers that flag in the Config.flag map.
     * @param settingsSection The settings section HTML element.
     * @param settingFlag The settings flag object.
     */
    addSettingFlag(
        settingsSection: HTMLElement,
        settingFlag?: SettingUIFlag
    ): void {
        if (settingFlag) {
            settingsSection.appendChild(settingFlag.rootElement);
            this.flags.set(settingFlag.setting.id, settingFlag);
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
            this.numericParameters.set(setting.setting.id, setting);
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
            this.optionParameters.set(setting.setting.id, setting);
        }
    }

    onSettingsChanged({ data: { id, target, type }}: SettingsChangedEvent) {
        if (type === "flag") {
            const _id = id as FlagsIds;
            const _target = target as SettingFlag;
            const setting = this.flags.get(_id);
            if (setting) {
                if (setting.flag !== _target.flag) {
                    setting.flag = _target.flag;
                }
                if (setting.label !== _target.label) {
                    setting.label = _target.label;
                }
            }
        } else if (type === "number") {
            const _id = id as NumericParametersIds;
            const _target = target as SettingNumber;
            const setting = this.numericParameters.get(_id);
            if (setting) {
                if (setting.number !== _target.number) {
                    setting.number = _target.number;
                }
                if (setting.label !== _target.label) {
                    setting.label = _target.label;
                }
            }
        } else if (type === "text") {
            const _id = id as TextParametersIds;
            const _target = target as SettingText;
            const setting = this.textParameters.get(_id);
            if (setting) {
                if (setting.text !== _target.text) {
                    setting.text = _target.text;
                }
                if (setting.label !== _target.label) {
                    setting.label = _target.label;
                }
            }
        } else if (type === "option") {
            const _id = id as OptionParametersIds;
            const _target = target as SettingOption;
            const setting = this.optionParameters.get(_id);
            if (setting) {
                const uiOptions = setting.options;
                const targetOptions = _target.options;
                if (uiOptions.length !== targetOptions.length || !uiOptions.every((value) => targetOptions.includes(value))) {
                    console.log("Updating options", uiOptions, targetOptions)
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
}

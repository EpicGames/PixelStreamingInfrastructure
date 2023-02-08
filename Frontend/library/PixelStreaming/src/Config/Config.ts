// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '../Logger/Logger';
import { SettingFlag } from './SettingFlag';
import { SettingNumber } from './SettingNumber';
import { SettingText } from './SettingText';
import { SettingOption } from './SettingOption';

/**
 * A collection of flags that can be toggled and are core to all Pixel Streaming experiences.
 * These are used in the `Config.Flags` map. Note, that map can take any string but
 * these flags are provided for convenience to avoid hardcoded strings across the library.
 */
export class Flags {
    static AutoConnect = 'AutoConnect';
    static AutoPlayVideo = 'AutoPlayVideo';
    static AFKDetection = 'TimeoutIfIdle';
    static BrowserSendOffer = 'OfferToReceive';
    static HoveringMouseMode = 'HoveringMouse';
    static ForceMonoAudio = 'ForceMonoAudio';
    static ForceTURN = 'ForceTURN';
    static FakeMouseWithTouches = 'FakeMouseWithTouches';
    static IsQualityController = 'ControlsQuality';
    static MatchViewportResolution = 'MatchViewportRes';
    static PreferSFU = 'preferSFU';
    static StartVideoMuted = 'StartVideoMuted';
    static SuppressBrowserKeys = 'SuppressBrowserKeys';
    static UseMic = 'UseMic';
    static LightMode = 'LightMode';
}

/**
 * A collection of numeric parameters that are core to all Pixel Streaming experiences.
 *
 */
export class NumericParameters {
    static AFKTimeoutSecs = 'AFKTimeout';
    static MinQP = 'MinQP';
    static MaxQP = 'MaxQP';
    static WebRTCFPS = 'WebRTCFPS';
    static WebRTCMinBitrate = 'WebRTCMinBitrate';
    static WebRTCMaxBitrate = 'WebRTCMaxBitrate';
}

/**
 * A collection of textual parameters that are core to all Pixel Streaming experiences.
 *
 */
export class TextParameters {
    static SignallingServerUrl = 'ss';
}

/**
 * A collection of enum based parameters that are core to all Pixel Streaming experiences.
 *
 */
export class OptionParameters {
    static PreferredCodec = 'PreferredCodec';
    static StreamerId = 'StreamerId';
}

export class Config {
    /* A map of flags that can be toggled - options that can be set in the application - e.g. Use Mic? */
    private flags = new Map<string, SettingFlag>();

    /* A map of numerical settings - options that can be in the application - e.g. MinBitrate */
    private numericParameters = new Map<string, SettingNumber>();

    /* A map of text settings - e.g. signalling server url */
    private textParameters = new Map<string, SettingText>();

    /* A map of enum based settings - e.g. preferred codec */
    private optionParameters = new Map<string, SettingOption>();

    // ------------ Settings -----------------

    constructor() {
        this.populateDefaultSettings();
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
     * Populate the default settings for a Pixel Streaming application
     */
    populateDefaultSettings(): void {
        /**
         * Text Parameters
         */

        this.textParameters.set(
            TextParameters.SignallingServerUrl,
            new SettingText(
                TextParameters.SignallingServerUrl,
                'Signalling url',
                'Url of the signalling server',
                (location.protocol === 'https:' ? 'wss://' : 'ws://') +
                    window.location.hostname +
                    // for readability, we omit the port if it's 80
                    (window.location.port === '80' ||
                    window.location.port === ''
                        ? ''
                        : `:${window.location.port}`)
            )
        );

        this.optionParameters.set(
            OptionParameters.StreamerId,
            new SettingOption(
                OptionParameters.StreamerId,
                'Streamer ID',
                'The ID of the streamer to stream.',
                '',
                []
            )
        );

        /**
         * Enum Parameters
         */
        this.optionParameters.set(
            OptionParameters.PreferredCodec,
            new SettingOption(
                OptionParameters.PreferredCodec,
                'Preferred Codec',
                'The preferred codec to be used during codec negotiation',
                'H264 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f',
                (function (): Array<string> {
                    const browserSupportedCodecs: Array<string> = [];
                    // Try get the info needed from the RTCRtpReceiver. This is only available on chrome
                    if (!RTCRtpReceiver.getCapabilities) {
                        browserSupportedCodecs.push('Only available on Chrome');
                        return browserSupportedCodecs;
                    }

                    const matcher = /(VP\d|H26\d|AV1).*/;
                    const codecs =
                        RTCRtpReceiver.getCapabilities('video').codecs;
                    codecs.forEach((codec) => {
                        const str =
                            codec.mimeType.split('/')[1] +
                            ' ' +
                            (codec.sdpFmtpLine || '');
                        const match = matcher.exec(str);
                        if (match !== null) {
                            browserSupportedCodecs.push(str);
                        }
                    });
                    return browserSupportedCodecs;
                })()
            )
        );

        /**
         * Boolean parameters
         */

        this.flags.set(
            Flags.AutoConnect,
            new SettingFlag(
                Flags.AutoConnect,
                'Auto connect to stream',
                'Whether we should attempt to auto connect to the signalling server or show a click to start prompt.',
                false
            )
        );

        this.flags.set(
            Flags.AutoPlayVideo,
            new SettingFlag(
                Flags.AutoPlayVideo,
                'Auto play video',
                'When video is ready automatically start playing it as opposed to showing a play button.',
                true
            )
        );

        this.flags.set(
            Flags.BrowserSendOffer,
            new SettingFlag(
                Flags.BrowserSendOffer,
                'Browser send offer',
                'Browser will initiate the WebRTC handshake by sending the offer to the streamer',
                false
            )
        );

        this.flags.set(
            Flags.UseMic,
            new SettingFlag(
                Flags.UseMic,
                'Use microphone',
                'Make browser request microphone access and open an input audio track.',
                false
            )
        );

        this.flags.set(
            Flags.StartVideoMuted,
            new SettingFlag(
                Flags.StartVideoMuted,
                'Start video muted',
                'Video will start muted if true.',
                false
            )
        );

        this.flags.set(
            Flags.SuppressBrowserKeys,
            new SettingFlag(
                Flags.SuppressBrowserKeys,
                'Suppress browser keys',
                'Suppress certain browser keys that we use in UE, for example F5 to show shader complexity instead of refresh the page.',
                true
            )
        );

        this.flags.set(
            Flags.PreferSFU,
            new SettingFlag(
                Flags.PreferSFU,
                'Prefer SFU',
                'Try to connect to the SFU instead of P2P.',
                false
            )
        );

        this.flags.set(
            Flags.IsQualityController,
            new SettingFlag(
                Flags.IsQualityController,
                'Is quality controller?',
                'True if this peer controls stream quality',
                true
            )
        );

        this.flags.set(
            Flags.ForceMonoAudio,
            new SettingFlag(
                Flags.ForceMonoAudio,
                'Force mono audio',
                'Force browser to request mono audio in the SDP',
                false
            )
        );

        this.flags.set(
            Flags.ForceTURN,
            new SettingFlag(
                Flags.ForceTURN,
                'Force TURN',
                'Only generate TURN/Relayed ICE candidates.',
                false
            )
        );

        this.flags.set(
            Flags.AFKDetection,
            new SettingFlag(
                Flags.AFKDetection,
                'AFK if idle',
                'Timeout the experience if user is AFK for a period.',
                false
            )
        );

        this.flags.set(
            Flags.MatchViewportResolution,
            new SettingFlag(
                Flags.MatchViewportResolution,
                'Match viewport resolution',
                'Pixel Streaming will be instructed to dynamically resize the video stream to match the size of the video element.',
                false
            )
        );

        this.flags.set(
            Flags.HoveringMouseMode,
            new SettingFlag(
                Flags.HoveringMouseMode,
                'Control Scheme: Locked Mouse',
                'Either locked mouse, where the pointer is consumed by the video and locked to it, or hovering mouse, where the mouse is not consumed.',
                false
            )
        );

        this.flags.set(
            Flags.FakeMouseWithTouches,
            new SettingFlag(
                Flags.FakeMouseWithTouches,
                'Fake mouse with touches',
                'A single finger touch is converted into a mouse event. This allows a non-touch application to be controlled partially via a touch device.',
                false
            )
        );

        this.flags.set(
            Flags.LightMode,
            new SettingFlag(
                Flags.LightMode,
                'Use a light color scheme',
                'The Pixel Streaming player will be instructed to use a lighter color scheme',
                false // (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches would use system preference
            )
        );

        /**
         * Numeric parameters
         */

        this.numericParameters.set(
            NumericParameters.AFKTimeoutSecs,
            new SettingNumber(
                NumericParameters.AFKTimeoutSecs,
                'AFK timeout',
                'The time (in seconds) it takes for the application to time out if AFK timeout is enabled.',
                0 /*min*/,
                600 /*max*/,
                120 /*value*/
            )
        );

        this.numericParameters.set(
            NumericParameters.MinQP,
            new SettingNumber(
                NumericParameters.MinQP,
                'Min QP',
                'The lower bound for the quantization parameter (QP) of the encoder. 0 = Best quality, 51 = worst quality.',
                0 /*min*/,
                51 /*max*/,
                0 /*value*/
            )
        );

        this.numericParameters.set(
            NumericParameters.MaxQP,
            new SettingNumber(
                NumericParameters.MaxQP,
                'Max QP',
                'The upper bound for the quantization parameter (QP) of the encoder. 0 = Best quality, 51 = worst quality.',
                0 /*min*/,
                51 /*max*/,
                51 /*value*/
            )
        );

        this.numericParameters.set(
            NumericParameters.WebRTCFPS,
            new SettingNumber(
                NumericParameters.WebRTCFPS,
                'Max FPS',
                'The maximum FPS that WebRTC will try to transmit frames at.',
                1 /*min*/,
                999 /*max*/,
                60 /*value*/
            )
        );

        this.numericParameters.set(
            NumericParameters.WebRTCMinBitrate,
            new SettingNumber(
                NumericParameters.WebRTCMinBitrate,
                'Min Bitrate (kbps)',
                'The minimum bitrate that WebRTC should use.',
                0 /*min*/,
                100000 /*max*/,
                0 /*value*/
            )
        );

        this.numericParameters.set(
            NumericParameters.WebRTCMaxBitrate,
            new SettingNumber(
                NumericParameters.WebRTCMaxBitrate,
                'Max Bitrate (kbps)',
                'The maximum bitrate that WebRTC should use.',
                0 /*min*/,
                100000 /*max*/,
                0 /*value*/
            )
        );
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

        const ControlSchemeFlag = this.flags.get(Flags.HoveringMouseMode);
        this.addSettingFlag(viewSettingsSection, ControlSchemeFlag);
        ControlSchemeFlag.label = `Control Scheme: ${
            ControlSchemeFlag.flag ? 'Hovering' : 'Locked'
        } Mouse`;

        const colorSchemeFlag = this.flags.get(Flags.LightMode);
        this.addSettingFlag(viewSettingsSection, colorSchemeFlag);
        colorSchemeFlag.label = `Color Scheme: ${
            colorSchemeFlag.flag ? 'Light' : 'Dark'
        } Mode`;

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
            preferredCodecOption
        );
        if([...preferredCodecOption.selector.options].map(o => o.value).includes("Only available on Chrome")) {
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
     * Add a callback to fire when the numeric setting is toggled.
     * @param id The id of the flag.
     * @param onChangedListener The callback to fire when the numeric value changes.
     */
    addOnNumericSettingChangedListener(
        id: string,
        onChangedListener: (newValue: number) => void
    ): void {
        if (this.numericParameters.has(id)) {
            this.numericParameters
                .get(id)
                .addOnChangedListener(onChangedListener);
        }
    }

    addOnOptionSettingChangedListener(
        id: string,
        onChangedListener: (newValue: string) => void
    ): void {
        if (this.optionParameters.has(id)) {
            this.optionParameters
                .get(id)
                .addOnChangedListener(onChangedListener);
        }
    }

    /**
     * @param id The id of the numeric setting we are interested in getting a value for.
     * @returns The numeric value stored in the parameter with the passed id.
     */
    getNumericSettingValue(id: string): number {
        if (this.numericParameters.has(id)) {
            return this.numericParameters.get(id).number;
        } else {
            throw new Error(`There is no numeric setting with the id of ${id}`);
        }
    }

    /**
     * @param id The id of the text setting we are interested in getting a value for.
     * @returns The text value stored in the parameter with the passed id.
     */
    getTextSettingValue(id: string): string {
        if (this.textParameters.has(id)) {
            return this.textParameters.get(id).value as string;
        } else {
            throw new Error(`There is no numeric setting with the id of ${id}`);
        }
    }

    /**
     * Set number in the setting.
     * @param id The id of the numeric setting we are interested in.
     * @param value The numeric value to set.
     */
    setNumericSetting(id: string, value: number): void {
        if (this.numericParameters.has(id)) {
            this.numericParameters.get(id).number = value;
        } else {
            throw new Error(`There is no numeric setting with the id of ${id}`);
        }
    }

    /**
     * Add a callback to fire when the flag is toggled.
     * @param id The id of the flag.
     * @param onChangeListener The callback to fire when the value changes.
     */
    addOnSettingChangedListener(
        id: string,
        onChangeListener: (newFlagValue: boolean) => void
    ): void {
        if (this.flags.has(id)) {
            this.flags.get(id).onChange = onChangeListener;
        }
    }

    /**
     * Add a callback to fire when the text is changed.
     * @param id The id of the flag.
     * @param onChangeListener The callback to fire when the value changes.
     */
    addOnTextSettingChangedListener(
        id: string,
        onChangeListener: (newTextValue: string) => void
    ): void {
        if (this.textParameters.has(id)) {
            this.textParameters.get(id).onChange = onChangeListener;
        }
    }

    /**
     * Add a SettingText element to a particular settings section in the DOM and registers that text in the text settings map.
     * @param settingsSection The settings section HTML element.
     * @param settingText The textual settings object.
     */
    addSettingText(
        settingsSection: HTMLElement,
        settingText: SettingText
    ): void {
        settingsSection.appendChild(settingText.rootElement);
        this.textParameters.set(settingText.id, settingText);
    }

    /**
     * Add a SettingFlag element to a particular settings section in the DOM and registers that flag in the Config.flag map.
     * @param settingsSection The settings section HTML element.
     * @param settingFlag The settings flag object.
     */
    addSettingFlag(
        settingsSection: HTMLElement,
        settingFlag: SettingFlag
    ): void {
        settingsSection.appendChild(settingFlag.rootElement);
        this.flags.set(settingFlag.id, settingFlag);
    }

    /**
     * Add a numeric setting element to a particular settings section in the DOM and registers that flag in the Config.numericParameters map.
     * @param settingsSection The settings section HTML element.
     * @param settingFlag The settings flag object.
     */
    addSettingNumeric(
        settingsSection: HTMLElement,
        setting: SettingNumber
    ): void {
        settingsSection.appendChild(setting.rootElement);
        this.numericParameters.set(setting.id, setting);
    }

    /**
     * Add an enum based settings element to a particular settings section in the DOM and registers that flag in the Config.enumParameters map.
     * @param settingsSection The settings section HTML element.
     * @param settingFlag The settings flag object.
     */
    addSettingOption(
        settingsSection: HTMLElement,
        setting: SettingOption
    ): void {
        settingsSection.appendChild(setting.rootElement);
        this.optionParameters.set(setting.id, setting);
    }

    getSettingOption(id: string): SettingOption {
        return this.optionParameters.get(id);
    }

    /**
     * Get the value of the configuration flag which has the given id.
     * @param id The unique id for the flag.
     * @returns True if the flag is enabled.
     */
    isFlagEnabled(id: string): boolean {
        return this.flags.get(id).flag as boolean;
    }

    /**
     * Set flag to be enabled/disabled.
     * @param id The id of the flag to toggle.
     * @param flagEnabled True if the flag should be enabled.
     */
    setFlagEnabled(id: string, flagEnabled: boolean) {
        if (!this.flags.has(id)) {
            Logger.Warning(
                Logger.GetStackTrace(),
                `Cannot toggle flag called ${id} - it does not exist in the Config.flags map.`
            );
        } else {
            this.flags.get(id).flag = flagEnabled;
        }
    }

    /**
     * Set the text setting.
     * @param id The id of the setting
     * @param settingValue The value to set in the setting.
     */
    setTextSetting(id: string, settingValue: string) {
        if (!this.textParameters.has(id)) {
            Logger.Warning(
                Logger.GetStackTrace(),
                `Cannot set text setting called ${id} - it does not exist in the Config.textParameters map.`
            );
        } else {
            this.textParameters.get(id).text = settingValue;
        }
    }

    /**
     * Set the option setting list of options.
     * @param id The id of the setting
     * @param settingOptions The values the setting could take
     */
    setOptionSettingOptions(id: string, settingOptions: Array<string>) {
        if (!this.optionParameters.has(id)) {
            Logger.Warning(
                Logger.GetStackTrace(),
                `Cannot set text setting called ${id} - it does not exist in the Config.optionParameters map.`
            );
        } else {
            this.optionParameters.get(id).options = settingOptions;
        }
    }

    /**
     * Set option enum settings selected option.
     * @param id The id of the setting
     * @param settingOptions The value to select out of all the options
     */
    setOptionSettingValue(id: string, settingValue: string) {
        if (!this.optionParameters.has(id)) {
            Logger.Warning(
                Logger.GetStackTrace(),
                `Cannot set text setting called ${id} - it does not exist in the Config.enumParameters map.`
            );
        } else {
            this.optionParameters.get(id).selected = settingValue;
        }
    }

    /**
     * Set the label for the flag.
     * @param id The id of the flag.
     * @param label The new label to use for the flag.
     */
    setFlagLabel(id: string, label: string) {
        if (!this.flags.has(id)) {
            Logger.Warning(
                Logger.GetStackTrace(),
                `Cannot set label for flag called ${id} - it does not exist in the Config.flags map.`
            );
        } else {
            this.flags.get(id).label = label;
        }
    }
}

/**
 * The enum associated with the mouse being locked or hovering
 */
export enum ControlSchemeType {
    LockedMouse = 0,
    HoveringMouse = 1
}

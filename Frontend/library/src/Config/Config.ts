// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '../Logger/Logger';
import { SettingFlag } from './SettingFlag';
import { SettingNumber } from './SettingNumber';
import { SettingText } from './SettingText';
import { SettingOption } from './SettingOption';
import { EventEmitter, SettingsChangedEvent } from '../Util/EventEmitter';
import { SettingBase } from './SettingBase';

/**
 * A collection of flags that can be toggled and are core to all Pixel Streaming experiences.
 * These are used in the `Config.Flags` map.
 */
export class Flags {
    static AutoConnect = 'AutoConnect' as const;
    static AutoPlayVideo = 'AutoPlayVideo' as const;
    static AFKDetection = 'TimeoutIfIdle' as const;
    static BrowserSendOffer = 'OfferToReceive' as const;
    static HoveringMouseMode = 'HoveringMouse' as const;
    static ForceMonoAudio = 'ForceMonoAudio' as const;
    static ForceTURN = 'ForceTURN' as const;
    static FakeMouseWithTouches = 'FakeMouseWithTouches' as const;
    static IsQualityController = 'ControlsQuality' as const;
    static MatchViewportResolution = 'MatchViewportRes' as const;
    static StartVideoMuted = 'StartVideoMuted' as const;
    static SuppressBrowserKeys = 'SuppressBrowserKeys' as const;
    static UseMic = 'UseMic' as const;
    static KeyboardInput = 'KeyboardInput' as const;
    static MouseInput = 'MouseInput' as const;
    static TouchInput = 'TouchInput' as const;
    static GamepadInput = 'GamepadInput' as const;
    static XRControllerInput = 'XRControllerInput' as const;
    static WaitForStreamer = "WaitForStreamer" as const;
}

export type FlagsKeys = Exclude<keyof typeof Flags, 'prototype'>;
export type FlagsIds = typeof Flags[FlagsKeys];

const isFlagId = (id: string): id is FlagsIds =>
    Object.getOwnPropertyNames(Flags).some(
        (name: FlagsKeys) => Flags[name] === id
    );

/**
 * A collection of numeric parameters that are core to all Pixel Streaming experiences.
 *
 */
export class NumericParameters {
    static AFKTimeoutSecs = 'AFKTimeout' as const;
    static MinQP = 'MinQP' as const;
    static MaxQP = 'MaxQP' as const;
    static WebRTCFPS = 'WebRTCFPS' as const;
    static WebRTCMinBitrate = 'WebRTCMinBitrate' as const;
    static WebRTCMaxBitrate = 'WebRTCMaxBitrate' as const;
    static MaxReconnectAttempts = 'MaxReconnectAttempts' as const;
    static StreamerAutoJoinInterval = 'StreamerAutoJoinInterval' as const;
}

export type NumericParametersKeys = Exclude<
    keyof typeof NumericParameters,
    'prototype'
>;
export type NumericParametersIds =
    typeof NumericParameters[NumericParametersKeys];

const isNumericId = (id: string): id is NumericParametersIds =>
    Object.getOwnPropertyNames(NumericParameters).some(
        (name: NumericParametersKeys) => NumericParameters[name] === id
    );

/**
 * A collection of textual parameters that are core to all Pixel Streaming experiences.
 *
 */
export class TextParameters {
    static SignallingServerUrl = 'ss' as const;
}

export type TextParametersKeys = Exclude<
    keyof typeof TextParameters,
    'prototype'
>;
export type TextParametersIds = typeof TextParameters[TextParametersKeys];

const isTextId = (id: string): id is TextParametersIds =>
    Object.getOwnPropertyNames(TextParameters).some(
        (name: TextParametersKeys) => TextParameters[name] === id
    );

/**
 * A collection of enum based parameters that are core to all Pixel Streaming experiences.
 *
 */
export class OptionParameters {
    static PreferredCodec = 'PreferredCodec' as const;
    static StreamerId = 'StreamerId' as const;
}

export type OptionParametersKeys = Exclude<
    keyof typeof OptionParameters,
    'prototype'
>;
export type OptionParametersIds = typeof OptionParameters[OptionParametersKeys];

const isOptionId = (id: string): id is OptionParametersIds =>
    Object.getOwnPropertyNames(OptionParameters).some(
        (name: OptionParametersKeys) => OptionParameters[name] === id
    );

/**
 * Utility types for inferring data type based on setting ID
 */
export type OptionIds =
    | FlagsIds
    | NumericParametersIds
    | TextParametersIds
    | OptionParametersIds;
export type OptionKeys<T> = T extends FlagsIds
    ? boolean
    : T extends NumericParametersIds
    ? number
    : T extends TextParametersIds
    ? string
    : T extends OptionParametersIds
    ? string
    : never;

export type AllSettings = {
    [K in OptionIds]: OptionKeys<K>;
};

export interface ConfigParams {
    /** Initial Pixel Streaming settings */
    initialSettings?: Partial<AllSettings>;
    /** If useUrlParams is set true, will read initial values from URL parameters and persist changed settings into URL */
    useUrlParams?: boolean;
}
export class Config {
    /* A map of flags that can be toggled - options that can be set in the application - e.g. Use Mic? */
    private flags = new Map<FlagsIds, SettingFlag>();

    /* A map of numerical settings - options that can be in the application - e.g. MinBitrate */
    private numericParameters = new Map<NumericParametersIds, SettingNumber>();

    /* A map of text settings - e.g. signalling server url */
    private textParameters = new Map<TextParametersIds, SettingText>();

    /* A map of enum based settings - e.g. preferred codec */
    private optionParameters = new Map<OptionParametersIds, SettingOption>();

    private _useUrlParams: boolean;

    // ------------ Settings -----------------

    constructor(config: ConfigParams = {}) {
        const { initialSettings, useUrlParams } = config;
        this._useUrlParams = !!useUrlParams;
        this.populateDefaultSettings(this._useUrlParams);
        if (initialSettings) {
            this.setSettings(initialSettings);
        }
    }

    /**
     * True if reading configuration initial values from URL parameters, and
     * persisting changes in URL when changed.
     */
    public get useUrlParams() {
        return this._useUrlParams;
    }

    /**
     * Populate the default settings for a Pixel Streaming application
     */
    private populateDefaultSettings(useUrlParams: boolean): void {
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
                        : `:${window.location.port}`),
                useUrlParams
            )
        );

        this.optionParameters.set(
            OptionParameters.StreamerId,
            new SettingOption(
                OptionParameters.StreamerId,
                'Streamer ID',
                'The ID of the streamer to stream.',
                '',
                [],
                useUrlParams
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
                })(),
                useUrlParams
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
                false,
                useUrlParams
            )
        );

        this.flags.set(
            Flags.AutoPlayVideo,
            new SettingFlag(
                Flags.AutoPlayVideo,
                'Auto play video',
                'When video is ready automatically start playing it as opposed to showing a play button.',
                true,
                useUrlParams
            )
        );

        this.flags.set(
            Flags.BrowserSendOffer,
            new SettingFlag(
                Flags.BrowserSendOffer,
                'Browser send offer',
                'Browser will initiate the WebRTC handshake by sending the offer to the streamer',
                false,
                useUrlParams
            )
        );

        this.flags.set(
            Flags.UseMic,
            new SettingFlag(
                Flags.UseMic,
                'Use microphone',
                'Make browser request microphone access and open an input audio track.',
                false,
                useUrlParams
            )
        );

        this.flags.set(
            Flags.StartVideoMuted,
            new SettingFlag(
                Flags.StartVideoMuted,
                'Start video muted',
                'Video will start muted if true.',
                false,
                useUrlParams
            )
        );

        this.flags.set(
            Flags.SuppressBrowserKeys,
            new SettingFlag(
                Flags.SuppressBrowserKeys,
                'Suppress browser keys',
                'Suppress certain browser keys that we use in UE, for example F5 to show shader complexity instead of refresh the page.',
                true,
                useUrlParams
            )
        );

        this.flags.set(
            Flags.IsQualityController,
            new SettingFlag(
                Flags.IsQualityController,
                'Is quality controller?',
                'True if this peer controls stream quality',
                true,
                useUrlParams
            )
        );

        this.flags.set(
            Flags.ForceMonoAudio,
            new SettingFlag(
                Flags.ForceMonoAudio,
                'Force mono audio',
                'Force browser to request mono audio in the SDP',
                false,
                useUrlParams
            )
        );

        this.flags.set(
            Flags.ForceTURN,
            new SettingFlag(
                Flags.ForceTURN,
                'Force TURN',
                'Only generate TURN/Relayed ICE candidates.',
                false,
                useUrlParams
            )
        );

        this.flags.set(
            Flags.AFKDetection,
            new SettingFlag(
                Flags.AFKDetection,
                'AFK if idle',
                'Timeout the experience if user is AFK for a period.',
                false,
                useUrlParams
            )
        );

        this.flags.set(
            Flags.MatchViewportResolution,
            new SettingFlag(
                Flags.MatchViewportResolution,
                'Match viewport resolution',
                'Pixel Streaming will be instructed to dynamically resize the video stream to match the size of the video element.',
                false,
                useUrlParams
            )
        );

        this.flags.set(
            Flags.HoveringMouseMode,
            new SettingFlag(
                Flags.HoveringMouseMode,
                'Control Scheme: Locked Mouse',
                'Either locked mouse, where the pointer is consumed by the video and locked to it, or hovering mouse, where the mouse is not consumed.',
                false,
                useUrlParams,
                (isHoveringMouse: boolean, setting: SettingBase) => {
                    setting.label = `Control Scheme: ${isHoveringMouse ? 'Hovering' : 'Locked'} Mouse`;
                }
            )
        );

        this.flags.set(
            Flags.FakeMouseWithTouches,
            new SettingFlag(
                Flags.FakeMouseWithTouches,
                'Fake mouse with touches',
                'A single finger touch is converted into a mouse event. This allows a non-touch application to be controlled partially via a touch device.',
                false,
                useUrlParams
            )
        );

        this.flags.set(
            Flags.KeyboardInput,
            new SettingFlag(
                Flags.KeyboardInput,
                'Keyboard input',
                'If enabled, send keyboard events to streamer',
                true,
                useUrlParams
            )
        );

        this.flags.set(
            Flags.MouseInput,
            new SettingFlag(
                Flags.MouseInput,
                'Mouse input',
                'If enabled, send mouse events to streamer',
                true,
                useUrlParams
            )
        );

        this.flags.set(
            Flags.TouchInput,
            new SettingFlag(
                Flags.TouchInput,
                'Touch input',
                'If enabled, send touch events to streamer',
                true,
                useUrlParams
            )
        );

        this.flags.set(
            Flags.GamepadInput,
            new SettingFlag(
                Flags.GamepadInput,
                'Gamepad input',
                'If enabled, send gamepad events to streamer',
                true,
                useUrlParams
            )
        );

        this.flags.set(
            Flags.XRControllerInput,
            new SettingFlag(
                Flags.XRControllerInput,
                'XR controller input',
                'If enabled, send XR controller events to streamer',
                true,
                useUrlParams
            )
        );

        this.flags.set(
            Flags.WaitForStreamer,
            new SettingFlag(
                Flags.WaitForStreamer,
                'Wait for streamer',
                'Will continue trying to connect to the first streamer available.',
                true,
                useUrlParams
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
                120 /*value*/,
                useUrlParams
            )
        );

        this.numericParameters.set(
            NumericParameters.MaxReconnectAttempts,
            new SettingNumber(
                NumericParameters.MaxReconnectAttempts,
                'Max Reconnects',
                'Maximum number of reconnects the application will attempt when a streamer disconnects.',
                0 /*min*/,
                999 /*max*/,
                3 /*value*/,
                useUrlParams
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
                0 /*value*/,
                useUrlParams
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
                51 /*value*/,
                useUrlParams
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
                60 /*value*/,
                useUrlParams
            )
        );

        this.numericParameters.set(
            NumericParameters.WebRTCMinBitrate,
            new SettingNumber(
                NumericParameters.WebRTCMinBitrate,
                'Min Bitrate (kbps)',
                'The minimum bitrate that WebRTC should use.',
                0 /*min*/,
                500000 /*max*/,
                0 /*value*/,
                useUrlParams
            )
        );

        this.numericParameters.set(
            NumericParameters.WebRTCMaxBitrate,
            new SettingNumber(
                NumericParameters.WebRTCMaxBitrate,
                'Max Bitrate (kbps)',
                'The maximum bitrate that WebRTC should use.',
                0 /*min*/,
                500000 /*max*/,
                0 /*value*/,
                useUrlParams
            )
        );

        this.numericParameters.set(
            NumericParameters.StreamerAutoJoinInterval,
            new SettingNumber(
                NumericParameters.StreamerAutoJoinInterval,
                'Streamer Auto Join Interval (ms)',
                'Delay between retries when waiting for an available streamer.',
                500 /*min*/,
                900000 /*max*/,
                3000 /*value*/,
                useUrlParams
            )
        );
    }

    /**
     * Add a callback to fire when the numeric setting is toggled.
     * @param id The id of the flag.
     * @param onChangedListener The callback to fire when the numeric value changes.
     */
    _addOnNumericSettingChangedListener(
        id: NumericParametersIds,
        onChangedListener: (newValue: number) => void
    ): void {
        if (this.numericParameters.has(id)) {
            this.numericParameters
                .get(id)
                .addOnChangedListener(onChangedListener);
        }
    }

    _addOnOptionSettingChangedListener(
        id: OptionParametersIds,
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
    getNumericSettingValue(id: NumericParametersIds): number {
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
    getTextSettingValue(id: TextParametersIds): string {
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
    setNumericSetting(id: NumericParametersIds, value: number): void {
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
    _addOnSettingChangedListener(
        id: FlagsIds,
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
    _addOnTextSettingChangedListener(
        id: TextParametersIds,
        onChangeListener: (newTextValue: string) => void
    ): void {
        if (this.textParameters.has(id)) {
            this.textParameters.get(id).onChange = onChangeListener;
        }
    }

    /**
     * Get the option which has the given id.
     * @param id The id of the option.
     * @returns The SettingOption object matching id
     */
    getSettingOption(id: OptionParametersIds): SettingOption {
        return this.optionParameters.get(id);
    }

    /**
     * Get the value of the configuration flag which has the given id.
     * @param id The unique id for the flag.
     * @returns True if the flag is enabled.
     */
    isFlagEnabled(id: FlagsIds): boolean {
        return this.flags.get(id).flag as boolean;
    }

    /**
     * Set flag to be enabled/disabled.
     * @param id The id of the flag to toggle.
     * @param flagEnabled True if the flag should be enabled.
     */
    setFlagEnabled(id: FlagsIds, flagEnabled: boolean) {
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
    setTextSetting(id: TextParametersIds, settingValue: string) {
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
    setOptionSettingOptions(
        id: OptionParametersIds,
        settingOptions: Array<string>
    ) {
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
    setOptionSettingValue(id: OptionParametersIds, settingValue: string) {
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
    setFlagLabel(id: FlagsIds, label: string) {
        if (!this.flags.has(id)) {
            Logger.Warning(
                Logger.GetStackTrace(),
                `Cannot set label for flag called ${id} - it does not exist in the Config.flags map.`
            );
        } else {
            this.flags.get(id).label = label;
        }
    }

    /**
     * Set a subset of all settings in one function call.
     *
     * @param settings A (partial) list of settings to set
     */
    setSettings(settings: Partial<AllSettings>) {
        for (const key of Object.keys(settings)) {
            if (isFlagId(key)) {
                this.setFlagEnabled(key, settings[key]);
            } else if (isNumericId(key)) {
                this.setNumericSetting(key, settings[key]);
            } else if (isTextId(key)) {
                this.setTextSetting(key, settings[key]);
            } else if (isOptionId(key)) {
                this.setOptionSettingValue(key, settings[key]);
            }
        }
    }

    /**
     * Get all settings
     * @returns All setting values as an object with setting ids as keys
     */
    getSettings(): Partial<AllSettings> {
        const settings: Partial<AllSettings> = {};
        for (const [key, value] of this.flags.entries()) {
            settings[key] = value.flag;
        }
        for (const [key, value] of this.numericParameters.entries()) {
            settings[key] = value.number;
        }
        for (const [key, value] of this.textParameters.entries()) {
            settings[key] = value.text;
        }
        for (const [key, value] of this.optionParameters.entries()) {
            settings[key] = value.selected;
        }
        return settings;
    }

    /**
     * Get all Flag settings as an array.
     * @returns All SettingFlag objects
     */
    getFlags(): Array<SettingFlag> {
        return Array.from(this.flags.values());
    }

    /**
     * Get all Text settings as an array.
     * @returns All SettingText objects
     */
    getTextSettings(): Array<SettingText> {
        return Array.from(this.textParameters.values());
    }

    /**
     * Get all Number settings as an array.
     * @returns All SettingNumber objects
     */
    getNumericSettings(): Array<SettingNumber> {
        return Array.from(this.numericParameters.values());
    }

    /**
     * Get all Option settings as an array.
     * @returns All SettingOption objects
     */
    getOptionSettings(): Array<SettingOption> {
        return Array.from(this.optionParameters.values());
    }

    /**
     * Emit events when settings change.
     * @param eventEmitter
     */
    _registerOnChangeEvents(eventEmitter: EventEmitter) {
        for (const key of this.flags.keys()) {
            const flag = this.flags.get(key);
            if (flag) {
                flag.onChangeEmit = (newValue: boolean) =>
                    eventEmitter.dispatchEvent(
                        new SettingsChangedEvent({
                            id: flag.id,
                            type: 'flag',
                            value: newValue,
                            target: flag
                        })
                    );
            }
        }
        for (const key of this.numericParameters.keys()) {
            const number = this.numericParameters.get(key);
            if (number) {
                number.onChangeEmit = (newValue: number) =>
                    eventEmitter.dispatchEvent(
                        new SettingsChangedEvent({
                            id: number.id,
                            type: 'number',
                            value: newValue,
                            target: number
                        })
                    );
            }
        }
        for (const key of this.textParameters.keys()) {
            const text = this.textParameters.get(key);
            if (text) {
                text.onChangeEmit = (newValue: string) =>
                    eventEmitter.dispatchEvent(
                        new SettingsChangedEvent({
                            id: text.id,
                            type: 'text',
                            value: newValue,
                            target: text
                        })
                    );
            }
        }
        for (const key of this.optionParameters.keys()) {
            const option = this.optionParameters.get(key);
            if (option) {
                option.onChangeEmit = (newValue: string) =>
                    eventEmitter.dispatchEvent(
                        new SettingsChangedEvent({
                            id: option.id,
                            type: 'option',
                            value: newValue,
                            target: option
                        })
                    );
            }
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

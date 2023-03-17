import { mockRTCRtpReceiver, unmockRTCRtpReceiver } from '../__test__/mockRTCRtpReceiver';
import {
    Config,
    Flags,
    FlagsKeys,
    NumericParameters,
    NumericParametersKeys,
    OptionParameters,
    OptionParametersKeys,
    TextParameters,
    TextParametersKeys
} from './Config';

const allFlags = Object.keys(Flags).map((key) => Flags[key as FlagsKeys]);
const allNumericParameters = Object.keys(NumericParameters).map(
    (key) => NumericParameters[key as NumericParametersKeys]
);
const allTextParameters = Object.keys(TextParameters).map(
    (key) => TextParameters[key as TextParametersKeys]
);
const allOptionParameters = Object.keys(OptionParameters).map(
    (key) => OptionParameters[key as OptionParametersKeys]
);

const allParameters = [
    ...allFlags,
    ...allNumericParameters,
    ...allTextParameters,
    ...allOptionParameters
];

describe('Config', () => {
    beforeEach(() => {
        mockRTCRtpReceiver();
    });

    afterEach(() => {
        unmockRTCRtpReceiver();
        jest.resetAllMocks();
    });

    it('should populate initial values for all settings when initialized without parameters', () => {
        const config = new Config();

        const settings = config.getSettings();
        expect(Object.keys(settings)).toEqual(
            expect.arrayContaining(allParameters)
        );
    });

    it('should populate given initial setting values', () => {
        const initialSettings = {
            [Flags.AutoPlayVideo]: false,
            [NumericParameters.WebRTCMaxBitrate]: 12345,
            [TextParameters.SignallingServerUrl]: 'url'
        };

        const config = new Config({ initialSettings });

        expect(config.isFlagEnabled(Flags.AutoPlayVideo)).toEqual(
            initialSettings[Flags.AutoPlayVideo]
        );
        expect(
            config.getNumericSettingValue(NumericParameters.WebRTCMaxBitrate)
        ).toEqual(initialSettings[NumericParameters.WebRTCMaxBitrate]);
        expect(
            config.getTextSettingValue(TextParameters.SignallingServerUrl)
        ).toEqual(initialSettings[TextParameters.SignallingServerUrl]);
    });

    it('should replace setting values when new settings are set with setSettings', () => {
        const config = new Config();

        const preferredCodecs = ['c1', 'c2', 'c3'];
        config.setOptionSettingOptions(
            OptionParameters.PreferredCodec,
            preferredCodecs
        );

        const changedSettings = {
            [Flags.AutoPlayVideo]: false,
            [NumericParameters.WebRTCMaxBitrate]: 54321,
            [TextParameters.SignallingServerUrl]: 'signalling-url',
            [OptionParameters.PreferredCodec]: 'c2'
        };

        config.setSettings(changedSettings);

        expect(config.isFlagEnabled(Flags.AutoPlayVideo)).toEqual(
            changedSettings[Flags.AutoPlayVideo]
        );
        expect(
            config.getNumericSettingValue(NumericParameters.WebRTCMaxBitrate)
        ).toEqual(changedSettings[NumericParameters.WebRTCMaxBitrate]);
        expect(
            config.getTextSettingValue(TextParameters.SignallingServerUrl)
        ).toEqual(changedSettings[TextParameters.SignallingServerUrl]);
        expect(
            config.getSettingOption(OptionParameters.PreferredCodec).selected
        ).toEqual(changedSettings[OptionParameters.PreferredCodec]);
    });

    it('should replace setting values when new settings are set with set* setters', () => {
        const config = new Config();

        const preferredCodecs = ['c1', 'c2', 'c3'];
        config.setOptionSettingOptions(
            OptionParameters.PreferredCodec,
            preferredCodecs
        );

        const changedSettings = {
            [Flags.AutoPlayVideo]: false,
            [NumericParameters.WebRTCMaxBitrate]: 54321,
            [TextParameters.SignallingServerUrl]: 'signalling-url',
            [OptionParameters.PreferredCodec]: 'c2'
        };

        config.setFlagEnabled(
            Flags.AutoPlayVideo,
            changedSettings[Flags.AutoPlayVideo]
        );
        config.setNumericSetting(
            NumericParameters.WebRTCMaxBitrate,
            changedSettings[NumericParameters.WebRTCMaxBitrate]
        );
        config.setTextSetting(
            TextParameters.SignallingServerUrl,
            changedSettings[TextParameters.SignallingServerUrl]
        );
        config.setOptionSettingValue(
            OptionParameters.PreferredCodec,
            changedSettings[OptionParameters.PreferredCodec]
        );

        expect(config.isFlagEnabled(Flags.AutoPlayVideo)).toEqual(
            changedSettings[Flags.AutoPlayVideo]
        );
        expect(
            config.getNumericSettingValue(NumericParameters.WebRTCMaxBitrate)
        ).toEqual(changedSettings[NumericParameters.WebRTCMaxBitrate]);
        expect(
            config.getTextSettingValue(TextParameters.SignallingServerUrl)
        ).toEqual(changedSettings[TextParameters.SignallingServerUrl]);
        expect(
            config.getSettingOption(OptionParameters.PreferredCodec).selected
        ).toEqual(changedSettings[OptionParameters.PreferredCodec]);
    });

    it('should persist config changes to window.location URL when updateURLParams() is called', () => {
        const config = new Config({ useUrlParams: true });

        const preferredCodecs = ['c1', 'c2', 'c3'];
        config.setOptionSettingOptions(
            OptionParameters.PreferredCodec,
            preferredCodecs
        );

        const changedSettings = {
            [Flags.AutoPlayVideo]: false,
            [NumericParameters.WebRTCMaxBitrate]: 54321,
            [TextParameters.SignallingServerUrl]: 'signalling-url',
            [OptionParameters.PreferredCodec]: 'c2'
        };

        config.setSettings(changedSettings);

        config
            .getFlags()
            .find((setting) => setting.id === Flags.AutoPlayVideo)
            ?.updateURLParams();
        config
            .getNumericSettings()
            .find(
                (setting) => setting.id === NumericParameters.WebRTCMaxBitrate
            )
            ?.updateURLParams();
        config
            .getTextSettings()
            .find(
                (setting) => setting.id === TextParameters.SignallingServerUrl
            )
            ?.updateURLParams();
        config
            .getOptionSettings()
            .find((setting) => setting.id === OptionParameters.PreferredCodec)
            ?.updateURLParams();

        const urlParams = new URLSearchParams(window.location.search);

        expect(urlParams.get(Flags.AutoPlayVideo)).toEqual(
            changedSettings[Flags.AutoPlayVideo].toString()
        );
        expect(urlParams.get(NumericParameters.WebRTCMaxBitrate)).toEqual(
            changedSettings[NumericParameters.WebRTCMaxBitrate].toString()
        );
        expect(urlParams.get(TextParameters.SignallingServerUrl)).toEqual(
            changedSettings[TextParameters.SignallingServerUrl].toString()
        );
        expect(urlParams.get(OptionParameters.PreferredCodec)).toEqual(
            changedSettings[OptionParameters.PreferredCodec].toString()
        );
    });

    it('should read initial config from window.location URL if initialized with useUrlParams: true', () => {
        window.history.replaceState(
            {},
            '',
            'http://localhost/?AutoPlayVideo=false&WebRTCMaxBitrate=43210&ss=signalling-url-from-url-param'
        );

        const config = new Config({ useUrlParams: true });

        expect(config.isFlagEnabled(Flags.AutoPlayVideo)).toEqual(false);
        expect(
            config.getNumericSettingValue(NumericParameters.WebRTCMaxBitrate)
        ).toEqual(43210);
        expect(
            config.getTextSettingValue(TextParameters.SignallingServerUrl)
        ).toEqual('signalling-url-from-url-param');
    });
});

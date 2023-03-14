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
} from '../Config/Config';
import { PixelStreaming } from './PixelStreaming';
import { SettingsChangedEvent } from '../pixelstreamingfrontend';
import { mockWebSocket, MockWebSocketSpyFunctions, unmockWebSocket } from '../__test__/mockWebSocket';

describe('PixelStreaming', () => {
    let webSocketSpyFunctions: MockWebSocketSpyFunctions;

    beforeEach(() => {
        mockRTCRtpReceiver();
        webSocketSpyFunctions = mockWebSocket();
    });

    afterEach(() => {
        unmockRTCRtpReceiver();
        unmockWebSocket();
        jest.resetAllMocks();
    });

    it('should emit settingsChanged events when the configuration is updated', () => {
        const config = new Config();
        const pixelStreaming = new PixelStreaming(config);

        const settingsChangedSpy = jest.fn();
        pixelStreaming.addEventListener("settingsChanged", settingsChangedSpy);

        expect(settingsChangedSpy).not.toHaveBeenCalled();
        config.setNumericSetting(NumericParameters.WebRTCMaxBitrate, 123);
        expect(settingsChangedSpy).toHaveBeenCalledWith(new SettingsChangedEvent({
            id: NumericParameters.WebRTCMaxBitrate,
            target: config.getNumericSettings().find((setting) => setting.id === NumericParameters.WebRTCMaxBitrate)!,
            type: 'number',
            value: 123,
        }));
    });

    it('should connect to signalling server when connect is called', () => {
        const mockUrl = 'ws://localhost:24680';
        const config = new Config({ initialSettings: {ss: mockUrl}});

        const pixelStreaming = new PixelStreaming(config);
        expect(webSocketSpyFunctions.constructorSpy).not.toHaveBeenCalled();
        pixelStreaming.connect();
        expect(webSocketSpyFunctions.constructorSpy).toHaveBeenCalledWith(mockUrl);
    });

});

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
        jest.useFakeTimers();
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
        const mockUrl = 'ws://localhost:24680/';
        const config = new Config({ initialSettings: {ss: mockUrl}});

        const pixelStreaming = new PixelStreaming(config);
        expect(webSocketSpyFunctions.constructorSpy).not.toHaveBeenCalled();
        pixelStreaming.connect();
        expect(webSocketSpyFunctions.constructorSpy).toHaveBeenCalledWith(mockUrl);
    });

    it('should autoconnect to signalling server if autoconnect setting is enabled', () => {
        const mockUrl = 'ws://localhost:24680/';
        const config = new Config({ initialSettings: {ss: mockUrl, AutoConnect: true}});

        expect(webSocketSpyFunctions.constructorSpy).not.toHaveBeenCalled();
        const pixelStreaming = new PixelStreaming(config);
        expect(webSocketSpyFunctions.constructorSpy).toHaveBeenCalledWith(mockUrl);
    });

    it('should disconnect from signalling server if disconnect is called', () => {
        const mockUrl = 'ws://localhost:24680/';
        const config = new Config({ initialSettings: {ss: mockUrl, AutoConnect: true}});
        const disconnectedSpy = jest.fn();

        expect(webSocketSpyFunctions.constructorSpy).not.toHaveBeenCalled();
        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.addEventListener("webRtcDisconnected", disconnectedSpy);
        expect(webSocketSpyFunctions.constructorSpy).toHaveBeenCalledWith(mockUrl);
        expect(webSocketSpyFunctions.closeSpy).not.toHaveBeenCalled();
        pixelStreaming.disconnect();
        expect(webSocketSpyFunctions.closeSpy).toHaveBeenCalled();
        expect(disconnectedSpy).toHaveBeenCalled();
    });

    it('should connect immediately to signalling server if reconnect is called and connection is not up', () => {
        const mockUrl = 'ws://localhost:24680/';
        const config = new Config({ initialSettings: {ss: mockUrl}});

        const pixelStreaming = new PixelStreaming(config);
        expect(webSocketSpyFunctions.constructorSpy).not.toHaveBeenCalled();
        pixelStreaming.reconnect();
        expect(webSocketSpyFunctions.closeSpy).not.toHaveBeenCalled();
        expect(webSocketSpyFunctions.constructorSpy).toHaveBeenCalledWith(mockUrl);
    });

    it('should disconnect and reconnect to signalling server if reconnect is called and connection is up', () => {
        const mockUrl = 'ws://localhost:24680/';
        const config = new Config({ initialSettings: {ss: mockUrl, AutoConnect: true}});
        const autoconnectedSpy = jest.fn();

        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.addEventListener("webRtcAutoConnect", autoconnectedSpy);
        expect(webSocketSpyFunctions.constructorSpy).toHaveBeenCalledWith(mockUrl);
        expect(webSocketSpyFunctions.constructorSpy).toHaveBeenCalledTimes(1);
        expect(webSocketSpyFunctions.closeSpy).not.toHaveBeenCalled();
        pixelStreaming.reconnect();
        expect(webSocketSpyFunctions.closeSpy).toHaveBeenCalled();

        // delayed reconnect after 3 seconds
        jest.advanceTimersByTime(3000);
        expect(webSocketSpyFunctions.constructorSpy).toHaveBeenCalledWith(mockUrl);
        expect(webSocketSpyFunctions.constructorSpy).toHaveBeenCalledTimes(2);
        expect(autoconnectedSpy).toHaveBeenCalled();
    });
});

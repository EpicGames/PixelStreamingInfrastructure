import { mockRTCRtpReceiver, unmockRTCRtpReceiver } from '../__test__/mockRTCRtpReceiver';
import {
    Config,
    NumericParameters,
} from '../Config/Config';
import { PixelStreaming } from './PixelStreaming';
import { SettingsChangedEvent, StreamerListMessageEvent, WebRtcConnectedEvent } from '../Util/EventEmitter';
import { mockWebSocket, MockWebSocketSpyFunctions, MockWebSocketTriggerFunctions, unmockWebSocket } from '../__test__/mockWebSocket';
import { MessageRecvTypes } from '../WebSockets/MessageReceive';
import { mockRTCPeerConnection, MockRTCPeerConnectionSpyFunctions, MockRTCPeerConnectionTriggerFunctions, unmockRTCPeerConnection } from '../__test__/mockRTCPeerConnection';

describe('PixelStreaming', () => {
    let webSocketSpyFunctions: MockWebSocketSpyFunctions;
    let webSocketTriggerFunctions: MockWebSocketTriggerFunctions;
    let rtcPeerConnectionSpyFunctions: MockRTCPeerConnectionSpyFunctions;
    let rtcPeerConnectionTriggerFunctions: MockRTCPeerConnectionTriggerFunctions;
    const mockSignallingUrl = 'ws://localhost:24680/';

    beforeEach(() => {
        mockRTCRtpReceiver();
        [webSocketSpyFunctions, webSocketTriggerFunctions] = mockWebSocket();
        [rtcPeerConnectionSpyFunctions, rtcPeerConnectionTriggerFunctions] = mockRTCPeerConnection();
        jest.useFakeTimers();
    });

    afterEach(() => {
        unmockRTCRtpReceiver();
        unmockWebSocket();
        unmockRTCPeerConnection();
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
        const config = new Config({ initialSettings: {ss: mockSignallingUrl}});

        const pixelStreaming = new PixelStreaming(config);
        expect(webSocketSpyFunctions.constructorSpy).not.toHaveBeenCalled();
        pixelStreaming.connect();
        expect(webSocketSpyFunctions.constructorSpy).toHaveBeenCalledWith(mockSignallingUrl);
    });

    it('should autoconnect to signalling server if autoconnect setting is enabled', () => {
        const config = new Config({ initialSettings: {ss: mockSignallingUrl, AutoConnect: true}});

        expect(webSocketSpyFunctions.constructorSpy).not.toHaveBeenCalled();
        const pixelStreaming = new PixelStreaming(config);
        expect(webSocketSpyFunctions.constructorSpy).toHaveBeenCalledWith(mockSignallingUrl);
    });

    it('should disconnect from signalling server if disconnect is called', () => {
        const config = new Config({ initialSettings: {ss: mockSignallingUrl, AutoConnect: true}});
        const disconnectedSpy = jest.fn();

        expect(webSocketSpyFunctions.constructorSpy).not.toHaveBeenCalled();
        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.addEventListener("webRtcDisconnected", disconnectedSpy);
        expect(webSocketSpyFunctions.constructorSpy).toHaveBeenCalledWith(mockSignallingUrl);
        expect(webSocketSpyFunctions.closeSpy).not.toHaveBeenCalled();
        pixelStreaming.disconnect();
        expect(webSocketSpyFunctions.closeSpy).toHaveBeenCalled();
        expect(disconnectedSpy).toHaveBeenCalled();
    });

    it('should connect immediately to signalling server if reconnect is called and connection is not up', () => {
        const config = new Config({ initialSettings: {ss: mockSignallingUrl}});

        const pixelStreaming = new PixelStreaming(config);
        expect(webSocketSpyFunctions.constructorSpy).not.toHaveBeenCalled();
        pixelStreaming.reconnect();
        expect(webSocketSpyFunctions.closeSpy).not.toHaveBeenCalled();
        expect(webSocketSpyFunctions.constructorSpy).toHaveBeenCalledWith(mockSignallingUrl);
    });

    it('should disconnect and reconnect to signalling server if reconnect is called and connection is up', () => {
        const config = new Config({ initialSettings: {ss: mockSignallingUrl, AutoConnect: true}});
        const autoconnectedSpy = jest.fn();

        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.addEventListener("webRtcAutoConnect", autoconnectedSpy);
        expect(webSocketSpyFunctions.constructorSpy).toHaveBeenCalledWith(mockSignallingUrl);
        expect(webSocketSpyFunctions.constructorSpy).toHaveBeenCalledTimes(1);
        expect(webSocketSpyFunctions.closeSpy).not.toHaveBeenCalled();
        pixelStreaming.reconnect();
        expect(webSocketSpyFunctions.closeSpy).toHaveBeenCalled();

        // delayed reconnect after 3 seconds
        jest.advanceTimersByTime(3000);
        expect(webSocketSpyFunctions.constructorSpy).toHaveBeenCalledWith(mockSignallingUrl);
        expect(webSocketSpyFunctions.constructorSpy).toHaveBeenCalledTimes(2);
        expect(autoconnectedSpy).toHaveBeenCalled();
    });

    it('should request streamer list when connected to the signalling server', () => {
        const config = new Config({ initialSettings: {ss: mockSignallingUrl, AutoConnect: true}});

        const pixelStreaming = new PixelStreaming(config);
        webSocketTriggerFunctions.triggerOnOpen?.();
        expect(webSocketSpyFunctions.sendSpy).toHaveBeenCalledWith(
            expect.stringMatching(/"type":"listStreamers"/)
        );
    });

    it('should emit webRtcConnected event when ICE connection state is connected', () => {
        const config = new Config({ initialSettings: {ss: mockSignallingUrl, AutoConnect: true}});
        const peerConnectionOptions: RTCConfiguration = {};
        const candidate: RTCIceCandidateInit = {};
        const connectedSpy = jest.fn();

        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.addEventListener("webRtcConnected", connectedSpy);

        webSocketTriggerFunctions.triggerOnOpen?.();
        expect(rtcPeerConnectionSpyFunctions.constructorSpy).not.toHaveBeenCalled();
        webSocketTriggerFunctions.triggerOnMessage?.({
            type: MessageRecvTypes.CONFIG,
            peerConnectionOptions
        });
        expect(rtcPeerConnectionSpyFunctions.constructorSpy).toHaveBeenCalled();
        webSocketTriggerFunctions.triggerOnMessage?.({
            type: MessageRecvTypes.ICE_CANDIDATE,
            candidate
        });
        rtcPeerConnectionTriggerFunctions.triggerIceConnectionStateChange?.("connected");
        expect(connectedSpy).toHaveBeenCalledWith(new WebRtcConnectedEvent());
    });

    it('should autoselect a streamer if receiving only one streamer in streamerList message', () => {
        const config = new Config({ initialSettings: {ss: mockSignallingUrl, AutoConnect: true}});
        const streamerId = "MOCK_PIXEL_STREAMING";
        const streamerIdList = [streamerId];
        const streamerListSpy = jest.fn();
        const peerConnectionOptions: RTCConfiguration = {};

        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.addEventListener("streamerListMessage", streamerListSpy);

        webSocketTriggerFunctions.triggerOnOpen?.();
        webSocketTriggerFunctions.triggerOnMessage?.({
            type: MessageRecvTypes.CONFIG,
            peerConnectionOptions
        });
        webSocketTriggerFunctions.triggerOnMessage?.({
            type: MessageRecvTypes.STREAMER_LIST,
            ids: streamerIdList
        });
        expect(streamerListSpy).toHaveBeenCalledWith(new StreamerListMessageEvent({
            messageStreamerList: expect.objectContaining({
                type: MessageRecvTypes.STREAMER_LIST,
                ids: streamerIdList
            }),
            autoSelectedStreamerId: streamerId
        }));
    });

    it('should call RTCPeerConnection close when disconnect is called', () => {
        const config = new Config({ initialSettings: {ss: mockSignallingUrl, AutoConnect: true}});
        const peerConnectionOptions: RTCConfiguration = {};
        const candidate: RTCIceCandidateInit = {};

        const pixelStreaming = new PixelStreaming(config);

        webSocketTriggerFunctions.triggerOnOpen?.();
        expect(rtcPeerConnectionSpyFunctions.constructorSpy).not.toHaveBeenCalled();
        webSocketTriggerFunctions.triggerOnMessage?.({
            type: MessageRecvTypes.CONFIG,
            peerConnectionOptions
        });
        expect(rtcPeerConnectionSpyFunctions.constructorSpy).toHaveBeenCalled();
        webSocketTriggerFunctions.triggerOnMessage?.({
            type: MessageRecvTypes.ICE_CANDIDATE,
            candidate
        });
        rtcPeerConnectionTriggerFunctions.triggerIceConnectionStateChange?.("connected");
        expect(rtcPeerConnectionSpyFunctions.closeSpy).not.toHaveBeenCalled();
        pixelStreaming.disconnect();
        expect(rtcPeerConnectionSpyFunctions.closeSpy).toHaveBeenCalled();
    });

});

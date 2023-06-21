import { mockRTCRtpReceiver, unmockRTCRtpReceiver } from '../__test__/mockRTCRtpReceiver';
import {
    Config,
    NumericParameters,
} from '../Config/Config';
import { PixelStreaming } from './PixelStreaming';
import { SettingsChangedEvent, StreamerListMessageEvent, WebRtcConnectedEvent, WebRtcSdpEvent } from '../Util/EventEmitter';
import { mockWebSocket, MockWebSocketSpyFunctions, MockWebSocketTriggerFunctions, unmockWebSocket } from '../__test__/mockWebSocket';
import { MessageRecvTypes } from '../WebSockets/MessageReceive';
import { mockRTCPeerConnection, MockRTCPeerConnectionSpyFunctions, MockRTCPeerConnectionTriggerFunctions, unmockRTCPeerConnection } from '../__test__/mockRTCPeerConnection';
import { mockHTMLMediaElement, mockMediaStream, unmockMediaStream } from '../__test__/mockMediaStream';
import { InitialSettings } from '../DataChannel/InitialSettings';

const flushPromises = () => new Promise(jest.requireActual("timers").setImmediate);

describe('PixelStreaming', () => {
    let webSocketSpyFunctions: MockWebSocketSpyFunctions;
    let webSocketTriggerFunctions: MockWebSocketTriggerFunctions;
    let rtcPeerConnectionSpyFunctions: MockRTCPeerConnectionSpyFunctions;
    let rtcPeerConnectionTriggerFunctions: MockRTCPeerConnectionTriggerFunctions;
    
    const mockSignallingUrl = 'ws://localhost:24680/';
    const streamerId = "MOCK_PIXEL_STREAMING";
    const streamerIdList = [streamerId];
    const sdp = "v=0\r\no=- 974006863270230083 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0 1 2\r\na=extmap-allow-mixed\r\na=msid-semantic: WMS pixelstreaming_audio_stream_id pixelstreaming_video_stream_id\r\nm=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:+JE1\r\na=ice-pwd:R2dKmHqM47E++7TRKKkHMyHj\r\na=ice-options:trickle\r\na=fingerprint:sha-256 20:EE:85:F0:DA:F4:90:F3:0D:13:2E:A9:1E:36:8C:81:E1:BD:38:78:20:AA:38:F3:FC:65:3F:8E:06:1D:A7:53\r\na=setup:actpass\r\na=mid:0\r\na=extmap:1 urn:ietf:params:rtp-hdrext:toffset\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:3 urn:3gpp:video-orientation\r\na=extmap:4 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r\na=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r\na=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r\na=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r\na=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=extmap:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id\r\na=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id\r\na=sendonly\r\na=msid:pixelstreaming_video_stream_id pixelstreaming_video_track_label\r\na=rtcp-mux\r\na=rtcp-rsize\r\na=rtpmap:96 H264/90000\r\na=rtcp-fb:96 goog-remb\r\na=rtcp-fb:96 transport-cc\r\na=rtcp-fb:96 ccm fir\r\na=rtcp-fb:96 nack\r\na=rtcp-fb:96 nack pli\r\na=fmtp:96 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\na=rtpmap:97 rtx/90000\r\na=fmtp:97 apt=96\r\na=rtpmap:98 H264/90000\r\na=rtcp-fb:98 goog-remb\r\na=rtcp-fb:98 transport-cc\r\na=rtcp-fb:98 ccm fir\r\na=rtcp-fb:98 nack\r\na=rtcp-fb:98 nack pli\r\na=fmtp:98 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r\na=rtpmap:99 rtx/90000\r\na=fmtp:99 apt=98\r\na=rtpmap:100 red/90000\r\na=rtpmap:101 rtx/90000\r\na=fmtp:101 apt=100\r\na=rtpmap:102 ulpfec/90000\r\na=ssrc-group:FID 3702690738 1574960745\r\na=ssrc:3702690738 cname:I/iLZxsY4mZ0aoNG\r\na=ssrc:3702690738 msid:pixelstreaming_video_stream_id pixelstreaming_video_track_label\r\na=ssrc:3702690738 mslabel:pixelstreaming_video_stream_id\r\na=ssrc:3702690738 label:pixelstreaming_video_track_label\r\na=ssrc:1574960745 cname:I/iLZxsY4mZ0aoNG\r\na=ssrc:1574960745 msid:pixelstreaming_video_stream_id pixelstreaming_video_track_label\r\na=ssrc:1574960745 mslabel:pixelstreaming_video_stream_id\r\na=ssrc:1574960745 label:pixelstreaming_video_track_label\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111 63 110\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:+JE1\r\na=ice-pwd:R2dKmHqM47E++7TRKKkHMyHj\r\na=ice-options:trickle\r\na=fingerprint:sha-256 20:EE:85:F0:DA:F4:90:F3:0D:13:2E:A9:1E:36:8C:81:E1:BD:38:78:20:AA:38:F3:FC:65:3F:8E:06:1D:A7:53\r\na=setup:actpass\r\na=mid:1\r\na=extmap:14 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\na=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=extmap:4 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r\na=extmap:9 urn:ietf:params:rtp-hdrext:sdes:mid\r\na=extmap:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id\r\na=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id\r\na=sendrecv\r\na=msid:pixelstreaming_audio_stream_id pixelstreaming_audio_track_label\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 maxaveragebitrate=510000;maxplaybackrate=48000;minptime=3;sprop-stereo=1;stereo=1;usedtx=0;useinbandfec=1\r\na=rtpmap:63 red/48000/2\r\na=fmtp:63 111/111\r\na=rtpmap:110 telephone-event/48000\r\na=maxptime:120\r\na=ptime:20\r\na=ssrc:2587776314 cname:I/iLZxsY4mZ0aoNG\r\na=ssrc:2587776314 msid:pixelstreaming_audio_stream_id pixelstreaming_audio_track_label\r\na=ssrc:2587776314 mslabel:pixelstreaming_audio_stream_id\r\na=ssrc:2587776314 label:pixelstreaming_audio_track_label\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\nc=IN IP4 0.0.0.0\r\na=ice-ufrag:+JE1\r\na=ice-pwd:R2dKmHqM47E++7TRKKkHMyHj\r\na=ice-options:trickle\r\na=fingerprint:sha-256 20:EE:85:F0:DA:F4:90:F3:0D:13:2E:A9:1E:36:8C:81:E1:BD:38:78:20:AA:38:F3:FC:65:3F:8E:06:1D:A7:53\r\na=setup:actpass\r\na=mid:2\r\na=sctp-port:5000\r\na=max-message-size:262144\r\n";
    const iceCandidate: RTCIceCandidateInit = {
        sdpMid: "0",
        sdpMLineIndex: null,
        usernameFragment: null,
        candidate:"candidate:2199032595 1 udp 2122260223 192.168.1.89 64674 typ host generation 0 ufrag +JE1 network-id 1"
    };

    const triggerWebSocketOpen = () =>
        webSocketTriggerFunctions.triggerOnOpen?.();
    const triggerConfigMessage = () =>
        webSocketTriggerFunctions.triggerOnMessage?.({
            type: MessageRecvTypes.CONFIG,
            peerConnectionOptions: {}
        });
    const triggerStreamerListMessage = (streamerIdList: string[]) =>
        webSocketTriggerFunctions.triggerOnMessage?.({
            type: MessageRecvTypes.STREAMER_LIST,
            ids: streamerIdList
        });
    const triggerSdpOfferMessage = () =>
        webSocketTriggerFunctions.triggerOnMessage?.({
            type: MessageRecvTypes.OFFER,
            sdp
        });
    const triggerIceCandidateMessage = () =>
        webSocketTriggerFunctions.triggerOnMessage?.({
            type: MessageRecvTypes.ICE_CANDIDATE,
            candidate: iceCandidate
        });
    const triggerIceConnectionState = (state: RTCIceConnectionState) =>
        rtcPeerConnectionTriggerFunctions.triggerIceConnectionStateChange?.(
            state
        );
    const triggerAddTrack = () => {
        const stream = new MediaStream();
        const track = new MediaStreamTrack();
        rtcPeerConnectionTriggerFunctions.triggerOnTrack?.({
            track,
            streams: [stream]
        } as RTCTrackEventInit);
        return { stream, track };
    };
    const triggerOpenDataChannel = () => {
        const channel = new RTCDataChannel();
        rtcPeerConnectionTriggerFunctions.triggerOnDataChannel?.({
            channel
        });
        channel.onopen?.(new Event('open'));
        return { channel };
    };
    const establishMockedPixelStreamingConnection = (
        streamerIds = streamerIdList,
        iceConnectionState: RTCIceConnectionState = 'connected'
    ) => {
        triggerWebSocketOpen();
        triggerConfigMessage();
        triggerStreamerListMessage(streamerIds);
        triggerSdpOfferMessage();
        triggerIceCandidateMessage();
        triggerIceConnectionState(iceConnectionState);
        const { stream, track } = triggerAddTrack();
        const { channel } = triggerOpenDataChannel();
        return { channel, stream, track };
    };

    beforeEach(() => {
        mockRTCRtpReceiver();
        mockMediaStream();
        [webSocketSpyFunctions, webSocketTriggerFunctions] = mockWebSocket();
        [rtcPeerConnectionSpyFunctions, rtcPeerConnectionTriggerFunctions] = mockRTCPeerConnection();
        mockHTMLMediaElement({ ableToPlay: true });
        jest.useFakeTimers();
    });

    afterEach(() => {
        unmockRTCRtpReceiver();
        unmockMediaStream();
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
        // We explicitly set the max reconnect attempts to 0 to stop the auto-reconnect flow as that is tested separate
        const config = new Config({ initialSettings: {ss: mockSignallingUrl, AutoConnect: true, MaxReconnectAttempts: 0}});
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

    it('should automatically reconnect and request streamer list N times on websocket close', () => {
        const config = new Config({ initialSettings: {ss: mockSignallingUrl, AutoConnect: true, MaxReconnectAttempts: 3}});
        const autoconnectedSpy = jest.fn();

        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.addEventListener("webRtcAutoConnect", autoconnectedSpy);

        expect(webSocketSpyFunctions.constructorSpy).toHaveBeenCalledWith(mockSignallingUrl);
        expect(webSocketSpyFunctions.constructorSpy).toHaveBeenCalledTimes(1);
        expect(webSocketSpyFunctions.closeSpy).not.toHaveBeenCalled();

        pixelStreaming.webSocketController.close();

        expect(webSocketSpyFunctions.closeSpy).toHaveBeenCalled();

        // wait 2 seconds
        jest.advanceTimersByTime(2000);

        // we should have attempted a reconnection
        expect(webSocketSpyFunctions.constructorSpy).toHaveBeenCalledWith(mockSignallingUrl);
        expect(webSocketSpyFunctions.constructorSpy).toHaveBeenCalledTimes(2);
        // Reconnect triggers the first list streamer message
        triggerWebSocketOpen();
        expect(webSocketSpyFunctions.sendSpy).toHaveBeenCalledWith(
            expect.stringMatching(/"type":"listStreamers"/)
        );
        // We don't have a signalling server to respond with data so lets just fake a response with no streamers
        triggerStreamerListMessage([]);
        // Wait 2 seconds. This delay waits for the WebRtcPlayerController to realise the previously received list doesn't contain
        // the streamer is was preiously subscribed to, so it'll request the list again
        jest.advanceTimersByTime(2000);

        // Same as above but repeated for the second call
        expect(webSocketSpyFunctions.sendSpy).toHaveBeenCalledWith(
            expect.stringMatching(/"type":"listStreamers"/)
        );
        triggerStreamerListMessage([]);
        jest.advanceTimersByTime(2000);

        // Expect the third call
        expect(webSocketSpyFunctions.sendSpy).toHaveBeenCalledWith(
            expect.stringMatching(/"type":"listStreamers"/)
        );
        triggerStreamerListMessage([]);
        jest.advanceTimersByTime(2000);

        // We should expect only 3 calls based on our config
        expect(webSocketSpyFunctions.sendSpy).toHaveBeenCalledTimes(3);
    });

    it('should request streamer list when connected to the signalling server', () => {
        const config = new Config({ initialSettings: {ss: mockSignallingUrl, AutoConnect: true}});
        const pixelStreaming = new PixelStreaming(config);

        triggerWebSocketOpen();
        
        expect(webSocketSpyFunctions.sendSpy).toHaveBeenCalledWith(
            expect.stringMatching(/"type":"listStreamers"/)
        );
    });

    it('should autoselect a streamer if receiving only one streamer in streamerList message', () => {
        const config = new Config({ initialSettings: {ss: mockSignallingUrl, AutoConnect: true}});
        const streamerListSpy = jest.fn();
        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.addEventListener("streamerListMessage", streamerListSpy);

        triggerWebSocketOpen();
        triggerConfigMessage();
        triggerStreamerListMessage(streamerIdList);
        
        expect(streamerListSpy).toHaveBeenCalledWith(new StreamerListMessageEvent({
            messageStreamerList: expect.objectContaining({
                type: MessageRecvTypes.STREAMER_LIST,
                ids: streamerIdList
            }),
            autoSelectedStreamerId: streamerId
        }));
        expect(webSocketSpyFunctions.sendSpy).toHaveBeenCalledWith(
            expect.stringMatching(/"type":"subscribe".*MOCK_PIXEL_STREAMING/)
        );
    });

    it('should not autoselect a streamer if receiving multiple streamers in streamerList message', () => {
        const config = new Config({ initialSettings: {ss: mockSignallingUrl, AutoConnect: true}});
        const streamerId2 = "MOCK_2_PIXEL_STREAMING";
        const extendedStreamerIdList = [streamerId, streamerId2];
        const streamerListSpy = jest.fn();
        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.addEventListener("streamerListMessage", streamerListSpy);

        triggerWebSocketOpen();
        triggerConfigMessage();
        triggerStreamerListMessage(extendedStreamerIdList);
        
        expect(streamerListSpy).toHaveBeenCalledWith(new StreamerListMessageEvent({
            messageStreamerList: expect.objectContaining({
                type: MessageRecvTypes.STREAMER_LIST,
                ids: extendedStreamerIdList
            }),
            autoSelectedStreamerId: null
        }));
        expect(webSocketSpyFunctions.sendSpy).not.toHaveBeenCalledWith(
            expect.stringMatching(/"type":"subscribe"/)
        );
    });

    it('should set remoteDescription and emit webRtcSdp event when an offer is received', () => {
        const config = new Config({ initialSettings: {ss: mockSignallingUrl, AutoConnect: true}});
        const eventSpy = jest.fn();
        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.addEventListener("webRtcSdp", eventSpy);

        triggerWebSocketOpen();
        triggerConfigMessage();
        triggerStreamerListMessage(streamerIdList);
        
        expect(eventSpy).not.toHaveBeenCalled();
        
        triggerSdpOfferMessage();
        
        expect(rtcPeerConnectionSpyFunctions.setRemoteDescriptionSpy).toHaveBeenCalledWith(expect.objectContaining({
            sdp
        }));
        expect(eventSpy).toHaveBeenCalledWith(new WebRtcSdpEvent());
    });

    it('should add an ICE candidate when receiving a iceCandidate message', () => {
        const config = new Config({ initialSettings: {ss: mockSignallingUrl, AutoConnect: true}});
        const pixelStreaming = new PixelStreaming(config);

        triggerWebSocketOpen();
        triggerConfigMessage();
        triggerStreamerListMessage(streamerIdList);
        triggerSdpOfferMessage();
        triggerIceCandidateMessage();

        expect(rtcPeerConnectionSpyFunctions.addIceCandidateSpy).toHaveBeenCalledWith(iceCandidate)
    });

    it('should emit webRtcConnected event when ICE connection state is connected', () => {
        const config = new Config({ initialSettings: {ss: mockSignallingUrl, AutoConnect: true}});
        const connectedSpy = jest.fn();
        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.addEventListener("webRtcConnected", connectedSpy);

        triggerWebSocketOpen();

        expect(rtcPeerConnectionSpyFunctions.constructorSpy).not.toHaveBeenCalled();

        triggerConfigMessage();

        expect(rtcPeerConnectionSpyFunctions.constructorSpy).toHaveBeenCalled();

        triggerIceCandidateMessage();
        triggerIceConnectionState('connected')

        expect(connectedSpy).toHaveBeenCalledWith(new WebRtcConnectedEvent());
    });


    it('should call RTCPeerConnection close and emit webRtcDisconnected when disconnect is called', () => {
        const config = new Config({ initialSettings: {ss: mockSignallingUrl}});
        const disconnectedSpy = jest.fn();
        const dataChannelSpy = jest.fn();
        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.addEventListener("webRtcDisconnected", disconnectedSpy);
        pixelStreaming.addEventListener("dataChannelClose", dataChannelSpy);
        pixelStreaming.connect();

        establishMockedPixelStreamingConnection();

        pixelStreaming.disconnect();
        
        expect(rtcPeerConnectionSpyFunctions.closeSpy).toHaveBeenCalled();
        expect(disconnectedSpy).toHaveBeenCalled();
        expect(dataChannelSpy).toHaveBeenCalled();
    });

    it('should emit statistics when connected', async () => {
        const config = new Config({ initialSettings: {ss: mockSignallingUrl, AutoConnect: true}});
        const statsSpy = jest.fn();
        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.addEventListener("statsReceived", statsSpy);

        establishMockedPixelStreamingConnection();

        expect(statsSpy).not.toHaveBeenCalled();
        
        // New stats sent at 1s intervals
        jest.advanceTimersByTime(1000);
        await flushPromises();
        
        expect(statsSpy).toHaveBeenCalledTimes(1);
        expect(statsSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                data: {
                    aggregatedStats: expect.objectContaining({
                        candidatePair: expect.objectContaining({
                            bytesReceived: 123
                        }),
                        localCandidates: [
                            expect.objectContaining({ address: 'mock-address' })
                        ]
                    })
                }
            })
        );

        jest.advanceTimersByTime(1000);
        
        await flushPromises();
        expect(statsSpy).toHaveBeenCalledTimes(2);
    });

    it('should emit dataChannelOpen when data channel is opened', () => {
        const config = new Config({ initialSettings: {ss: mockSignallingUrl}});
        const dataChannelSpy = jest.fn();
        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.addEventListener("dataChannelOpen", dataChannelSpy);
        pixelStreaming.connect();

        establishMockedPixelStreamingConnection();

        expect(dataChannelSpy).toHaveBeenCalled();
    });

    it('should emit playStream when video play is called', () => {
        const config = new Config({ initialSettings: {ss: mockSignallingUrl}});
        const streamSpy = jest.fn();
        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.addEventListener("playStream", streamSpy);
        pixelStreaming.connect();

        establishMockedPixelStreamingConnection();

        pixelStreaming.play();

        expect(streamSpy).toHaveBeenCalled();
    });

    it('should emit playStreamRejected if video play is rejected', async () => {
        mockHTMLMediaElement({ ableToPlay: false });
        
        const config = new Config({ initialSettings: {ss: mockSignallingUrl}});
        const streamRejectedSpy = jest.fn();
        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.addEventListener("playStreamRejected", streamRejectedSpy);
        pixelStreaming.connect();

        establishMockedPixelStreamingConnection();

        pixelStreaming.play();
        await flushPromises();

        expect(streamRejectedSpy).toHaveBeenCalled();
    });

    it('should send data through the data channel when emitCommand is called', () => {
        mockHTMLMediaElement({ ableToPlay: true, readyState: 2 });
        
        const config = new Config({ initialSettings: {ss: mockSignallingUrl}});
        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.connect();

        establishMockedPixelStreamingConnection();

        pixelStreaming.play();

        expect(rtcPeerConnectionSpyFunctions.sendDataSpy).not.toHaveBeenCalled();
        
        const commandSent = pixelStreaming.emitCommand({
            'Resolution.Width': 123,
            'Resolution.Height': 456
        });
        
        expect(commandSent).toEqual(true);
        expect(rtcPeerConnectionSpyFunctions.sendDataSpy).toHaveBeenCalled();
    });

    it('should prevent sending console commands unless permitted by streamer', () => {
        mockHTMLMediaElement({ ableToPlay: true, readyState: 2 });
        
        const config = new Config({ initialSettings: {ss: mockSignallingUrl}});
        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.connect();

        establishMockedPixelStreamingConnection();

        pixelStreaming.play();

        expect(rtcPeerConnectionSpyFunctions.sendDataSpy).not.toHaveBeenCalled();
        
        const commandSent = pixelStreaming.emitConsoleCommand("console command");
        
        expect(commandSent).toEqual(false);
        expect(rtcPeerConnectionSpyFunctions.sendDataSpy).not.toHaveBeenCalled();
    });

    it('should allow sending console commands if permitted by streamer', () => {
        mockHTMLMediaElement({ ableToPlay: true, readyState: 2 });
        
        const config = new Config({ initialSettings: {ss: mockSignallingUrl}});
        const initialSettingsSpy = jest.fn();
        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.addEventListener("initialSettings", initialSettingsSpy);
        pixelStreaming.connect();

        establishMockedPixelStreamingConnection();

        pixelStreaming.play();
        
        expect(rtcPeerConnectionSpyFunctions.sendDataSpy).not.toHaveBeenCalled();
        expect(initialSettingsSpy).not.toHaveBeenCalled();
        
        const initialSettings = new InitialSettings();
        initialSettings.PixelStreamingSettings.AllowPixelStreamingCommands = true;
        pixelStreaming._onInitialSettings(initialSettings);
        
        expect(initialSettingsSpy).toHaveBeenCalled();

        const commandSent = pixelStreaming.emitConsoleCommand("console command");
        
        expect(commandSent).toEqual(true);
        expect(rtcPeerConnectionSpyFunctions.sendDataSpy).toHaveBeenCalled();
    });

    it('should send data through the data channel when emitUIInteraction is called', () => {
        mockHTMLMediaElement({ ableToPlay: true, readyState: 2 });
        
        const config = new Config({ initialSettings: {ss: mockSignallingUrl}});
        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.connect();

        establishMockedPixelStreamingConnection();

        pixelStreaming.play();

        expect(rtcPeerConnectionSpyFunctions.sendDataSpy).not.toHaveBeenCalled();
        
        const commandSent = pixelStreaming.emitUIInteraction({ custom: "descriptor" });
        
        expect(commandSent).toEqual(true);
        expect(rtcPeerConnectionSpyFunctions.sendDataSpy).toHaveBeenCalled();
    });

    it('should call user-provided callback if receiving a data channel Response message from the streamer', () => {
        mockHTMLMediaElement({ ableToPlay: true, readyState: 2 });
        
        const config = new Config({ initialSettings: {ss: mockSignallingUrl}});
        const responseListenerSpy = jest.fn();
        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.addResponseEventListener('responseListener', responseListenerSpy);
        pixelStreaming.connect();

        const { channel } = establishMockedPixelStreamingConnection();

        pixelStreaming.play();

        expect(responseListenerSpy).not.toHaveBeenCalled();

        const testMessageContents = JSON.stringify({ test: "mock-data" });
        const data = new DataView(new ArrayBuffer(1 + 2 * testMessageContents.length));
        data.setUint8(0, 1); // type 1 == Response
        let byteIdx = 1;
        for (let i = 0; i < testMessageContents.length; i++) {
            data.setUint16(byteIdx, testMessageContents.charCodeAt(i), true);
            byteIdx += 2;
        }
        channel.dispatchEvent(new MessageEvent('message', { data: data.buffer }));

        expect(responseListenerSpy).toHaveBeenCalledWith(testMessageContents);
    });

    it('should emit StreamConnectEvent when streamer connects', () => {
        const config = new Config({ initialSettings: {ss: mockSignallingUrl}});
        const streamConnectSpy = jest.fn();
        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.addEventListener("streamConnect", streamConnectSpy);
        pixelStreaming.connect();

        establishMockedPixelStreamingConnection();

        expect(streamConnectSpy).toHaveBeenCalled();
    });

    it('should emit StreamDisconnectEvent when streamer disconnects', () => {
        const config = new Config({ initialSettings: {ss: mockSignallingUrl}});
        const streamDisconnectSpy = jest.fn();
        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.addEventListener("streamDisconnect", streamDisconnectSpy);
        pixelStreaming.connect();

        establishMockedPixelStreamingConnection();

        expect(streamDisconnectSpy).not.toHaveBeenCalled();

        pixelStreaming.disconnect();

        expect(streamDisconnectSpy).toHaveBeenCalled();
    });

    it('should emit StreamReconnectEvent when streamer reconnects', () => {
        const config = new Config({ initialSettings: {ss: mockSignallingUrl}});
        const streamReconnectSpy = jest.fn();
        const pixelStreaming = new PixelStreaming(config);
        pixelStreaming.addEventListener("streamReconnect", streamReconnectSpy);
        pixelStreaming.connect();
        
        establishMockedPixelStreamingConnection();

        expect(streamReconnectSpy).not.toHaveBeenCalled();

        pixelStreaming.reconnect();

        expect(streamReconnectSpy).toHaveBeenCalled();

        pixelStreaming.disconnect();

        expect(streamReconnectSpy).toHaveBeenCalledTimes(1);
    });
});

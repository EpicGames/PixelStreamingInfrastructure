import { Config, Flags, OptionParameters } from '../Config/Config';
import { PeerConnectionController } from './PeerConnectionController';
import { getCodecOption } from '../Util/CodecUtils';
import { mockRTCPeerConnection, unmockRTCPeerConnection } from '../__test__/mockRTCPeerConnection';

const flushPromises = () => new Promise(jest.requireActual('timers').setImmediate);

const h264ConstrainedBaseline = 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f';
const h264Baseline = 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f';

// What Chrome reports, in Chrome's order. Its first H264 profile is baseline, which the frontend picks as its default.
const browserCapabilities: RTCRtpCodec[] = [
    { mimeType: 'video/VP8', clockRate: 90000 },
    { mimeType: 'video/rtx', clockRate: 90000, sdpFmtpLine: 'apt=96' },
    { mimeType: 'video/VP9', clockRate: 90000, sdpFmtpLine: 'profile-id=0' },
    { mimeType: 'video/VP9', clockRate: 90000, sdpFmtpLine: 'profile-id=2' },
    { mimeType: 'video/H264', clockRate: 90000, sdpFmtpLine: h264Baseline },
    {
        mimeType: 'video/H264',
        clockRate: 90000,
        sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f'
    },
    { mimeType: 'video/H264', clockRate: 90000, sdpFmtpLine: h264ConstrainedBaseline },
    {
        mimeType: 'video/H264',
        clockRate: 90000,
        sdpFmtpLine: 'level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f'
    },
    { mimeType: 'video/AV1', clockRate: 90000, sdpFmtpLine: 'level-idx=5;profile=0;tier=0' },
    { mimeType: 'video/red', clockRate: 90000 },
    { mimeType: 'video/ulpfec', clockRate: 90000 }
];

interface OfferedCodec {
    payloadType: number;
    name: string;
    fmtp?: string;
}

// What UE offers with negotiate codecs on and its default codec preferences, before EpicRtc offered every H264
// profile: a single H264 profile, and not the one the browser lists first.
const ueOfferedCodecs: OfferedCodec[] = [
    { payloadType: 96, name: 'AV1' },
    { payloadType: 97, name: 'H264', fmtp: h264ConstrainedBaseline },
    { payloadType: 98, name: 'VP9', fmtp: 'profile-id=0' },
    { payloadType: 99, name: 'VP8' }
];

const createOffer = (codecs: OfferedCodec[]): RTCSessionDescriptionInit => ({
    type: 'offer',
    sdp: [
        'v=0',
        'o=- 0 2 IN IP4 127.0.0.1',
        's=-',
        't=0 0',
        `m=video 9 UDP/TLS/RTP/SAVPF ${codecs.map((codec) => codec.payloadType).join(' ')}`,
        'c=IN IP4 0.0.0.0',
        'a=mid:0',
        'a=sendonly',
        ...codecs.flatMap((codec) => [
            `a=rtpmap:${codec.payloadType} ${codec.name}/90000`,
            ...(codec.fmtp ? [`a=fmtp:${codec.payloadType} ${codec.fmtp}`] : [])
        ]),
        ''
    ].join('\r\n')
});

// Offered codecs that the browser treats as one of its own codecs despite a different fmtp line, as libwebrtc compares
// them. This is spelled out rather than derived from getCodecIdentity so that the tests catch getCodecIdentity
// disagreeing with the browser.
const browserCodecMatches: Record<string, string[]> = {
    // AV1 is only compared on its profile, which defaults to 0
    'AV1 level-idx=5;profile=0;tier=0': ['AV1 ', 'AV1 level-idx=8;profile=0;tier=0']
};

// The browser answers with its first codec preference that the offer contains
const getAnsweredCodec = (codecPreferences: RTCRtpCodec[], offeredCodecs: OfferedCodec[]) => {
    const offeredCodecOptions = offeredCodecs.map((codec) => `${codec.name} ${codec.fmtp ?? ''}`);
    return codecPreferences
        .map(getCodecOption)
        .find((codec) =>
            offeredCodecOptions.some(
                (offeredCodec) => offeredCodec === codec || browserCodecMatches[codec]?.includes(offeredCodec)
            )
        );
};

describe('PeerConnectionController', () => {
    const originalRTCRtpReceiver = global.RTCRtpReceiver;
    let setCodecPreferencesSpy: jest.Mock;

    // Mirrors the frontend's startup: the preferred codec is picked from the browser's codecs before any offer arrives
    const createPeerConnectionController = (config: Config, preferredCodec: string) => {
        const peerConnectionController = new PeerConnectionController({}, config, preferredCodec);
        const videoTransceiver = {
            receiver: { track: { kind: 'video' } },
            setCodecPreferences: setCodecPreferencesSpy
        } as unknown as RTCRtpTransceiver;
        jest.spyOn(peerConnectionController.peerConnection, 'getTransceivers').mockReturnValue([
            videoTransceiver
        ]);
        return peerConnectionController;
    };

    const receiveOffer = async (
        peerConnectionController: PeerConnectionController,
        config: Config,
        offeredCodecs: OfferedCodec[]
    ) => {
        peerConnectionController.receiveOffer(createOffer(offeredCodecs), config);
        await flushPromises();
    };

    beforeEach(() => {
        mockRTCPeerConnection();
        global.RTCRtpReceiver = {
            getCapabilities: (): RTCRtpCapabilities => ({ codecs: browserCapabilities, headerExtensions: [] })
        } as unknown as typeof global.RTCRtpReceiver;
        setCodecPreferencesSpy = jest.fn();
    });

    afterEach(() => {
        unmockRTCPeerConnection();
        global.RTCRtpReceiver = originalRTCRtpReceiver;
        jest.resetAllMocks();
    });

    it("should answer with the offered H264 profile when the default H264 profile wasn't offered", async () => {
        const config = new Config();
        const defaultCodec = config.getSettingOption(OptionParameters.PreferredCodec).selected;
        expect(defaultCodec).toEqual(`H264 ${h264Baseline}`);

        const peerConnectionController = createPeerConnectionController(config, defaultCodec);
        await receiveOffer(peerConnectionController, config, ueOfferedCodecs);

        expect(setCodecPreferencesSpy).toHaveBeenCalledTimes(1);
        // This used to answer with VP8, the first codec in the browser's order
        expect(getAnsweredCodec(setCodecPreferencesSpy.mock.calls[0][0], ueOfferedCodecs)).toEqual(
            `H264 ${h264ConstrainedBaseline}`
        );
    });

    it("should fall back to the streamer's codec order when no codec of the preferred family was offered", async () => {
        const config = new Config();
        const peerConnectionController = createPeerConnectionController(
            config,
            'H265 level-id=180;profile-id=1;tier-flag=0;tx-mode=SRST'
        );
        await receiveOffer(peerConnectionController, config, ueOfferedCodecs);

        expect(setCodecPreferencesSpy).toHaveBeenCalledTimes(1);
        // This used to answer with VP8, the first codec in the browser's order
        expect(getAnsweredCodec(setCodecPreferencesSpy.mock.calls[0][0], ueOfferedCodecs)).toEqual(
            'AV1 level-idx=5;profile=0;tier=0'
        );
    });

    it('should answer with the preferred codec when it was offered', async () => {
        const config = new Config();
        const peerConnectionController = createPeerConnectionController(config, 'VP9 profile-id=0');
        await receiveOffer(peerConnectionController, config, ueOfferedCodecs);

        expect(setCodecPreferencesSpy).toHaveBeenCalledTimes(1);
        expect(getAnsweredCodec(setCodecPreferencesSpy.mock.calls[0][0], ueOfferedCodecs)).toEqual(
            'VP9 profile-id=0'
        );
    });

    it('should answer with the preferred H264 profile when every H264 profile was offered', async () => {
        const offeredCodecs: OfferedCodec[] = [
            { payloadType: 96, name: 'AV1' },
            { payloadType: 97, name: 'H264', fmtp: h264ConstrainedBaseline },
            { payloadType: 98, name: 'H264', fmtp: h264Baseline },
            { payloadType: 99, name: 'VP8' }
        ];
        const config = new Config();
        const peerConnectionController = createPeerConnectionController(config, `H264 ${h264Baseline}`);
        await receiveOffer(peerConnectionController, config, offeredCodecs);

        expect(setCodecPreferencesSpy).toHaveBeenCalledTimes(1);
        expect(getAnsweredCodec(setCodecPreferencesSpy.mock.calls[0][0], offeredCodecs)).toEqual(
            `H264 ${h264Baseline}`
        );
    });

    it('should answer with the preferred AV1 when it was offered at a different level', async () => {
        // AV1 comes after VP8 so that falling back to the streamer's codec order wouldn't pick it
        const offeredCodecs: OfferedCodec[] = [
            { payloadType: 96, name: 'VP8' },
            { payloadType: 97, name: 'AV1', fmtp: 'level-idx=8;profile=0;tier=0' }
        ];
        const config = new Config();
        const peerConnectionController = createPeerConnectionController(
            config,
            'AV1 level-idx=5;profile=0;tier=0'
        );
        await receiveOffer(peerConnectionController, config, offeredCodecs);

        expect(config.getSettingOption(OptionParameters.PreferredCodec).options).toContain(
            'AV1 level-idx=5;profile=0;tier=0'
        );
        expect(setCodecPreferencesSpy).toHaveBeenCalledTimes(1);
        expect(getAnsweredCodec(setCodecPreferencesSpy.mock.calls[0][0], offeredCodecs)).toEqual(
            'AV1 level-idx=5;profile=0;tier=0'
        );
    });

    it('should only prefer codecs the browser supports and keep all of them', async () => {
        const config = new Config();
        const peerConnectionController = createPeerConnectionController(
            config,
            'H265 level-id=180;profile-id=1;tier-flag=0;tx-mode=SRST'
        );
        await receiveOffer(peerConnectionController, config, ueOfferedCodecs);

        expect(setCodecPreferencesSpy).toHaveBeenCalledTimes(1);
        // setCodecPreferences throws for codecs that aren't the browser's own, and dropping rtx, red or ulpfec would
        // disable retransmissions and forward error correction
        const codecPreferences: RTCRtpCodec[] = setCodecPreferencesSpy.mock.calls[0][0];
        expect(codecPreferences).toHaveLength(browserCapabilities.length);
        expect(codecPreferences).toEqual(expect.arrayContaining(browserCapabilities));
    });

    it('should not set codec preferences without a preferred codec', async () => {
        // e.g. when connected to the SFU, which only supports one codec at a time
        const config = new Config();
        const peerConnectionController = createPeerConnectionController(config, '');
        await receiveOffer(peerConnectionController, config, ueOfferedCodecs);

        expect(setCodecPreferencesSpy).not.toHaveBeenCalled();
    });

    describe('Microphone and SDP munging', () => {
        const originalMediaDevices = Object.getOwnPropertyDescriptor(global.navigator, 'mediaDevices');
        let getUserMediaSpy: jest.Mock;

        const stubGetUserMedia = (result: MediaStream | null) => {
            getUserMediaSpy = jest.fn().mockResolvedValue(result);
            Object.defineProperty(global.navigator, 'mediaDevices', {
                value: { getUserMedia: getUserMediaSpy },
                configurable: true
            });
        };

        afterEach(() => {
            if (originalMediaDevices) {
                Object.defineProperty(global.navigator, 'mediaDevices', originalMediaDevices);
            } else {
                delete (global.navigator as { mediaDevices?: MediaDevices }).mediaDevices;
            }
        });

        const sampleSDP = [
            'v=0',
            'o=- 123456 2 IN IP4 127.0.0.1',
            's=-',
            't=0 0',
            'm=audio 9 UDP/TLS/RTP/SAVPF 111',
            'c=IN IP4 0.0.0.0',
            'a=rtpmap:111 opus/48000/2',
            'a=fmtp:111 minptime=10;useinbandfec=1',
            'm=video 9 UDP/TLS/RTP/SAVPF 96',
            'c=IN IP4 0.0.0.0',
            'a=fmtp:96 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f'
        ].join('\r\n') + '\r\n';

        it('should append sprop-maxcapturerate when useMic is enabled', () => {
            const config = new Config();
            const peerConnectionController = new PeerConnectionController({}, config, '');
            const munged = peerConnectionController.mungeSDP(sampleSDP, true);

            expect(munged).toContain(
                'a=fmtp:111 minptime=10;maxaveragebitrate=510000;sprop-maxcapturerate=48000;stereo=1;useinbandfec=1'
            );
            expect(munged).toContain('x-google-start-bitrate=10000;x-google-max-bitrate=100000');
        });

        it('should not append sprop-maxcapturerate when useMic is disabled', () => {
            const config = new Config();
            const peerConnectionController = new PeerConnectionController({}, config, '');
            const munged = peerConnectionController.mungeSDP(sampleSDP, false);

            expect(munged).toContain(
                'a=fmtp:111 minptime=10;maxaveragebitrate=510000;stereo=1;useinbandfec=1'
            );
            expect(munged).not.toContain('sprop-maxcapturerate');
        });

        it('should force mono audio in SDP when ForceMonoAudio flag is enabled', () => {
            const config = new Config();
            config.setFlagEnabled(Flags.ForceMonoAudio, true);
            const peerConnectionController = new PeerConnectionController({}, config, '');
            const munged = peerConnectionController.mungeSDP(sampleSDP, false);

            expect(munged).toContain(
                'a=fmtp:111 minptime=10;maxaveragebitrate=510000;stereo=0;useinbandfec=1'
            );
        });

        it('should configure audio transceiver as recvonly when useMic is disabled', async () => {
            const config = new Config();
            const peerConnectionController = new PeerConnectionController({}, config, '');
            const addTransceiverSpy = jest.spyOn(peerConnectionController.peerConnection, 'addTransceiver');

            await peerConnectionController.setupTransceiversAsync(false, false);

            expect(addTransceiverSpy).toHaveBeenCalledWith('audio', { direction: 'recvonly' });
        });

        it('should set audio transceiver direction to sendrecv when useMic is enabled and audio receiver exists', async () => {
            const config = new Config();
            const peerConnectionController = new PeerConnectionController({}, config, '');

            const mockTrack = {
                kind: 'audio',
                stop: jest.fn()
            } as unknown as MediaStreamTrack;

            const mockStream = {
                getTracks: () => [mockTrack]
            } as unknown as MediaStream;

            const mockTransceiver = {
                receiver: { track: { kind: 'audio' } },
                sender: { replaceTrack: jest.fn().mockResolvedValue(undefined) },
                direction: 'recvonly'
            } as unknown as RTCRtpTransceiver;

            jest.spyOn(peerConnectionController.peerConnection, 'getTransceivers').mockReturnValue([mockTransceiver]);
            stubGetUserMedia(mockStream);

            await peerConnectionController.setupTransceiversAsync(true, false);

            expect(getUserMediaSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    video: false,
                    audio: expect.objectContaining({
                        sampleRate: 48000,
                        channelCount: 1
                    })
                })
            );
            expect(mockTransceiver.direction).toBe('sendrecv');
            expect(mockTransceiver.sender.replaceTrack).toHaveBeenCalledWith(mockTrack);
        });

        it('should add sendrecv audio transceiver when useMic is enabled and no audio receiver exists', async () => {
            const config = new Config();
            const peerConnectionController = new PeerConnectionController({}, config, '');

            const mockTrack = {
                kind: 'audio',
                stop: jest.fn()
            } as unknown as MediaStreamTrack;

            const mockStream = {
                getTracks: () => [mockTrack]
            } as unknown as MediaStream;

            jest.spyOn(peerConnectionController.peerConnection, 'getTransceivers').mockReturnValue([]);
            const addTransceiverSpy = jest.spyOn(peerConnectionController.peerConnection, 'addTransceiver');
            stubGetUserMedia(mockStream);

            await peerConnectionController.setupTransceiversAsync(true, false);

            expect(addTransceiverSpy).toHaveBeenCalledWith(mockTrack, { direction: 'sendrecv' });
        });

        it('should fall back to recvonly audio when microphone getUserMedia returns null', async () => {
            const config = new Config();
            const peerConnectionController = new PeerConnectionController({}, config, '');

            jest.spyOn(peerConnectionController.peerConnection, 'getTransceivers').mockReturnValue([]);
            const addTransceiverSpy = jest.spyOn(peerConnectionController.peerConnection, 'addTransceiver');
            stubGetUserMedia(null);

            await peerConnectionController.setupTransceiversAsync(true, false);

            expect(addTransceiverSpy).toHaveBeenCalledWith('audio', { direction: 'recvonly' });
        });
    });
});

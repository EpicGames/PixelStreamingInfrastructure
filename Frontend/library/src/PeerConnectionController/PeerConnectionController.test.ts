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

    describe('with PreferHardwareAV1', () => {
        const av1 = 'AV1 level-idx=5;profile=0;tier=0';
        let decodingInfo: jest.Mock;

        // What navigator.mediaCapabilities says about decoding AV1 from WebRTC
        const mockAV1DecodingInfo = (info: { supported: boolean; powerEfficient: boolean }) => {
            decodingInfo = jest.fn(() => Promise.resolve(info));
            Object.defineProperty(navigator, 'mediaCapabilities', {
                configurable: true,
                value: { decodingInfo }
            });
        };

        // A connection preferring the default codec, the browser's first H264 profile, with the flag on by default
        const receiveOfferPreferringHardwareAV1 = async (
            offeredCodecs: OfferedCodec[],
            flagEnabled = true
        ) => {
            const config = new Config();
            config.setFlagEnabled(Flags.PreferHardwareAV1, flagEnabled);
            const defaultCodec = config.getSettingOption(OptionParameters.PreferredCodec).selected;
            const peerConnectionController = createPeerConnectionController(config, defaultCodec);
            await receiveOffer(peerConnectionController, config, offeredCodecs);
            expect(setCodecPreferencesSpy).toHaveBeenCalledTimes(1);
            return getAnsweredCodec(setCodecPreferencesSpy.mock.calls[0][0], offeredCodecs);
        };

        afterEach(() => {
            delete (navigator as unknown as { mediaCapabilities?: unknown }).mediaCapabilities;
        });

        it('should answer with AV1 when the browser decodes it in hardware', async () => {
            mockAV1DecodingInfo({ supported: true, powerEfficient: true });

            expect(await receiveOfferPreferringHardwareAV1(ueOfferedCodecs)).toEqual(av1);
            expect(decodingInfo).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'webrtc',
                    video: expect.objectContaining({ contentType: 'video/AV1' })
                })
            );
        });

        it('should keep the preferred codec when the browser would decode AV1 in software', async () => {
            mockAV1DecodingInfo({ supported: true, powerEfficient: false });

            expect(await receiveOfferPreferringHardwareAV1(ueOfferedCodecs)).toEqual(
                `H264 ${h264ConstrainedBaseline}`
            );
        });

        it('should keep the preferred codec when AV1 was not offered', async () => {
            mockAV1DecodingInfo({ supported: true, powerEfficient: true });
            const offeredCodecs = ueOfferedCodecs.filter((codec) => codec.name !== 'AV1');

            expect(await receiveOfferPreferringHardwareAV1(offeredCodecs)).toEqual(
                `H264 ${h264ConstrainedBaseline}`
            );
            expect(decodingInfo).not.toHaveBeenCalled();
        });

        it('should keep the preferred codec when the browser cannot tell', async () => {
            expect(await receiveOfferPreferringHardwareAV1(ueOfferedCodecs)).toEqual(
                `H264 ${h264ConstrainedBaseline}`
            );
        });

        it('should be on by default', () => {
            expect(new Config().isFlagEnabled(Flags.PreferHardwareAV1)).toBe(true);
        });

        it('should keep the preferred codec when the flag is off', async () => {
            mockAV1DecodingInfo({ supported: true, powerEfficient: true });

            expect(await receiveOfferPreferringHardwareAV1(ueOfferedCodecs, false)).toEqual(
                `H264 ${h264ConstrainedBaseline}`
            );
            expect(decodingInfo).not.toHaveBeenCalled();
        });
    });
});

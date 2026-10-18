import {
    getCodecIdentity,
    getCodecOption,
    orderCodecCapabilities,
    resolvePreferredCodec
} from './CodecUtils';

const h264ConstrainedBaseline = 'H264 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f';
const h264Baseline = 'H264 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f';
const h264BaselineSingleNal = 'H264 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f';

// A subset of what Chrome reports, in Chrome's order
const browserCapabilities: RTCRtpCodec[] = [
    { mimeType: 'video/VP8', clockRate: 90000 },
    { mimeType: 'video/rtx', clockRate: 90000 },
    { mimeType: 'video/VP9', clockRate: 90000, sdpFmtpLine: 'profile-id=0' },
    { mimeType: 'video/H264', clockRate: 90000, sdpFmtpLine: h264Baseline.split(' ')[1] },
    { mimeType: 'video/H264', clockRate: 90000, sdpFmtpLine: h264BaselineSingleNal.split(' ')[1] },
    { mimeType: 'video/H264', clockRate: 90000, sdpFmtpLine: h264ConstrainedBaseline.split(' ')[1] },
    { mimeType: 'video/AV1', clockRate: 90000, sdpFmtpLine: 'level-idx=5;profile=0;tier=0' }
];

describe('resolvePreferredCodec', () => {
    const supportedCodecs = [
        'AV1 level-idx=5;profile=0;tier=0',
        h264ConstrainedBaseline,
        'VP9 profile-id=0',
        'VP8 '
    ];

    it('should keep a preferred codec that is supported', () => {
        expect(resolvePreferredCodec('VP9 profile-id=0', supportedCodecs)).toEqual('VP9 profile-id=0');
    });

    it('should resolve to the same codec described differently', () => {
        expect(
            resolvePreferredCodec('H264 packetization-mode=1;profile-level-id=42e034', supportedCodecs)
        ).toEqual(h264ConstrainedBaseline);
    });

    it('should resolve an unsupported profile to a supported profile of the same codec', () => {
        expect(resolvePreferredCodec(h264Baseline, supportedCodecs)).toEqual(h264ConstrainedBaseline);
    });

    it('should resolve to nothing when no codec of the same family is supported', () => {
        expect(resolvePreferredCodec('H265 profile-id=1', supportedCodecs)).toBeUndefined();
    });
});

describe('orderCodecCapabilities', () => {
    it('should put the ordered codecs first and keep every other capability in browser order', () => {
        const ordered = orderCodecCapabilities(browserCapabilities, [h264ConstrainedBaseline, 'VP8 ']).map(
            getCodecOption
        );
        expect(ordered).toEqual([
            h264ConstrainedBaseline,
            'VP8 ',
            'rtx ',
            'VP9 profile-id=0',
            h264Baseline,
            h264BaselineSingleNal,
            'AV1 level-idx=5;profile=0;tier=0'
        ]);
    });

    it('should ignore ordered codecs the browser does not support', () => {
        expect(orderCodecCapabilities(browserCapabilities, ['H265 profile-id=1'])).toEqual(
            browserCapabilities
        );
    });

    it("should not fall back to VP8 when the preferred H264 profile wasn't offered", () => {
        // UE offered a single H264 profile that isn't the browser's default (first) one
        const supportedCodecs = [
            'AV1 level-idx=5;profile=0;tier=0',
            h264ConstrainedBaseline,
            'VP9 profile-id=0',
            'VP8 '
        ];
        const preferredCodec = resolvePreferredCodec(h264Baseline, supportedCodecs);
        const ordered = orderCodecCapabilities(browserCapabilities, [preferredCodec!, ...supportedCodecs]);
        // The answer picks the first preference the offer contains
        const answered = ordered.map(getCodecOption).find((codec) => supportedCodecs.includes(codec));
        expect(answered).toEqual(h264ConstrainedBaseline);
    });

    it('should fall back to the remote order rather than the browser order without a preferred codec', () => {
        const supportedCodecs = [
            'AV1 level-idx=5;profile=0;tier=0',
            h264ConstrainedBaseline,
            'VP9 profile-id=0',
            'VP8 '
        ];
        const preferredCodec = resolvePreferredCodec('H265 profile-id=1', supportedCodecs);
        expect(preferredCodec).toBeUndefined();
        const ordered = orderCodecCapabilities(browserCapabilities, supportedCodecs);
        expect(getCodecOption(ordered[0])).toEqual('AV1 level-idx=5;profile=0;tier=0');
    });
});

describe('getCodecIdentity', () => {
    it('should treat H265 profiles as different codecs', () => {
        expect(getCodecIdentity('H265 level-id=180;profile-id=1;tier-flag=0;tx-mode=SRST')).not.toEqual(
            getCodecIdentity('H265 level-id=180;profile-id=2;tier-flag=0;tx-mode=SRST')
        );
    });

    it('should ignore the H265 level, parameter order and a missing tx-mode', () => {
        expect(getCodecIdentity('H265 profile-id=2;tier-flag=0;level-id=153;tx-mode=SRST')).toEqual(
            getCodecIdentity('H265 level-id=180;profile-id=2;tier-flag=0')
        );
    });

    it('should default a missing H265 profile-id to Main', () => {
        expect(getCodecIdentity('H265')).toEqual(
            getCodecIdentity('H265 level-id=180;profile-id=1;tier-flag=0')
        );
    });

    it('should ignore the H264 level but not the profile or packetization mode', () => {
        const constrainedBaseline =
            'H264 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f';
        expect(getCodecIdentity(constrainedBaseline)).toEqual(
            getCodecIdentity('H264 packetization-mode=1;profile-level-id=42e034')
        );
        expect(getCodecIdentity(constrainedBaseline)).not.toEqual(
            getCodecIdentity('H264 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f')
        );
        expect(getCodecIdentity(constrainedBaseline)).not.toEqual(
            getCodecIdentity('H264 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f')
        );
    });

    it('should default a missing VP9 profile-id to profile 0', () => {
        expect(getCodecIdentity('VP9')).toEqual(getCodecIdentity('VP9 profile-id=0'));
        expect(getCodecIdentity('VP9')).not.toEqual(getCodecIdentity('VP9 profile-id=2'));
    });

    it('should apply AV1 defaults', () => {
        expect(getCodecIdentity('AV1')).toEqual(getCodecIdentity('AV1 level-idx=5;profile=0;tier=0'));
    });

    it('should identify codecs without identifying parameters by name', () => {
        expect(getCodecIdentity('VP8')).toEqual(getCodecIdentity('VP8 '));
    });
});

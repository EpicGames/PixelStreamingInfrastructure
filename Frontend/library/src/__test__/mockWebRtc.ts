export const MockRTCRtpReceiver = {
    prototype: jest.fn(),
    getCapabilities: () => ({
        codecs: [
            {
                clockRate: 60,
                mimeType: "testMimeType",
                sdpFmtpLine: "AV1"
            }
        ] as RTCRtpCodecCapability[],
        headerExtensions: [] as RTCRtpHeaderExtensionCapability[]
    })
} as any as typeof global.RTCRtpReceiver;

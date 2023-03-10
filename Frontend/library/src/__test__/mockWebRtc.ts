export const MockRTCRtpReceiver = {
    prototype: jest.fn(),
    getCapabilities: () => ({
        codecs: [] as RTCRtpCodecCapability[],
        headerExtensions: [] as RTCRtpHeaderExtensionCapability[]
    })
} as any as typeof global.RTCRtpReceiver;

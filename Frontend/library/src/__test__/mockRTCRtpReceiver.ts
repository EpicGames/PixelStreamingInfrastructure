export const mockRTCRtpReceiverImpl = {
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

const originalRTCRtpReceiver = global.RTCRtpReceiver;
export const mockRTCRtpReceiver = () => {
    global.RTCRtpReceiver = mockRTCRtpReceiverImpl;
}

export const unmockRTCRtpReceiver = () => {
    global.RTCRtpReceiver = originalRTCRtpReceiver;
}

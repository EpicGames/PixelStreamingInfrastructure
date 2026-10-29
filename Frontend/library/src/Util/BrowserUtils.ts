// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.8';
import { getCodecOption } from './CodecUtils';

export class BrowserUtils {
    static getSupportedVideoCodecs(): Array<string> {
        const browserSupportedCodecs: Array<string> = [];
        // Try get the info needed from the RTCRtpReceiver. This is only available on chrome
        if (!RTCRtpReceiver.getCapabilities) {
            Logger.Warning(
                'RTCRtpReceiver.getCapabilities API is not available in your browser, defaulting to guess that we support H.264.'
            );
            browserSupportedCodecs.push(
                'H264 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f'
            );
            return browserSupportedCodecs;
        }

        const matcher = /(VP\d|H26\d|AV1).*/;
        const capabilities = RTCRtpReceiver.getCapabilities('video');
        if (!capabilities) {
            browserSupportedCodecs.push(
                'H264 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f'
            );
            return browserSupportedCodecs;
        }
        capabilities.codecs.forEach((codec) => {
            const str = getCodecOption(codec);
            const match = matcher.exec(str);
            if (match !== null) {
                browserSupportedCodecs.push(str);
            }
        });
        return browserSupportedCodecs;
    }

    /**
     * Whether the browser reports that it can decode AV1 from WebRTC power-efficiently, which in practice means in
     * hardware. Decoding AV1 in software at streaming resolutions and frame rates drops frames on many devices.
     * @returns false when the browser cannot tell
     */
    static async canDecodeAV1InHardware(): Promise<boolean> {
        if (!navigator.mediaCapabilities?.decodingInfo) {
            return false;
        }
        try {
            const decodingInfo = await navigator.mediaCapabilities.decodingInfo({
                type: 'webrtc',
                video: {
                    contentType: 'video/AV1',
                    width: 1920,
                    height: 1080,
                    bitrate: 10000000,
                    framerate: 60
                }
            });
            return decodingInfo.supported && decodingInfo.powerEfficient;
        } catch (error) {
            Logger.Warning(`Could not check whether AV1 is decoded in hardware - ${error}`);
            return false;
        }
    }
}

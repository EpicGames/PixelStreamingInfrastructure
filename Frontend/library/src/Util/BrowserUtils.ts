// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.8';

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
            const str = codec.mimeType.split('/')[1] + ' ' + (codec.sdpFmtpLine || '');
            const match = matcher.exec(str);
            if (match !== null) {
                browserSupportedCodecs.push(str);
            }
        });
        return browserSupportedCodecs;
    }
}

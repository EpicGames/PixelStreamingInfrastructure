// RtpCapabilities from Web Browsers.
//
// This file contains RtpCapabilities objects tha represent what each browser
// is capable of, in terms of WebRTC encodings and other features. This is used
// by mediasoup to perform negotiation of RtpParameters.
//
// These objects are obtained from the SDP Answer that each browser generates
// in response to its own default SDP Offer. For convenience, the tool
// "browser-rtpcapabilities" is included in this project, which can be used
// to easily extract the RtpCapabilities from a web browser.
//
// Last update: 2023-08-30
// * Firefox 116.
// * Chrome 116.
// * Safari 14.1.1 (macOS).

import { RtpCapabilities, RtpHeaderExtensionUri } from "mediasoup/types";

export const firefox: RtpCapabilities = {
  codecs: [
    {
      kind: "audio",
      mimeType: "audio/opus",
      preferredPayloadType: 109,
      clockRate: 48000,
      channels: 2,
      parameters: {
        maxplaybackrate: 48000,
        stereo: 1,
        useinbandfec: 1,
      },
      rtcpFeedback: [],
    },
    {
      kind: "audio",
      mimeType: "audio/G722",
      preferredPayloadType: 9,
      clockRate: 8000,
      channels: 1,
      parameters: {},
      rtcpFeedback: [],
    },
    {
      kind: "audio",
      mimeType: "audio/PCMU",
      preferredPayloadType: 0,
      clockRate: 8000,
      parameters: {},
      rtcpFeedback: [],
    },
    {
      kind: "audio",
      mimeType: "audio/PCMA",
      preferredPayloadType: 8,
      clockRate: 8000,
      parameters: {},
      rtcpFeedback: [],
    },
    {
      kind: "audio",
      mimeType: "audio/telephone-event",
      preferredPayloadType: 101,
      clockRate: 8000,
      channels: 1,
      parameters: {},
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/VP8",
      preferredPayloadType: 120,
      clockRate: 90000,
      parameters: {
        "max-fs": 12288,
        "max-fr": 60,
      },
      rtcpFeedback: [
        {
          type: "nack",
        },
        {
          type: "nack",
          parameter: "pli",
        },
        {
          type: "ccm",
          parameter: "fir",
        },
        {
          type: "goog-remb",
        },
        {
          type: "transport-cc",
        },
      ],
    },
    {
      kind: "video",
      mimeType: "video/rtx",
      preferredPayloadType: 124,
      clockRate: 90000,
      parameters: {
        apt: 120,
      },
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/VP9",
      preferredPayloadType: 121,
      clockRate: 90000,
      parameters: {
        "max-fs": 12288,
        "max-fr": 60,
      },
      rtcpFeedback: [
        {
          type: "nack",
        },
        {
          type: "nack",
          parameter: "pli",
        },
        {
          type: "ccm",
          parameter: "fir",
        },
        {
          type: "goog-remb",
        },
        {
          type: "transport-cc",
        },
      ],
    },
    {
      kind: "video",
      mimeType: "video/rtx",
      preferredPayloadType: 125,
      clockRate: 90000,
      parameters: {
        apt: 121,
      },
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/H264",
      preferredPayloadType: 126,
      clockRate: 90000,
      parameters: {
        "profile-level-id": "42e01f",
        "level-asymmetry-allowed": 1,
        "packetization-mode": 1,
      },
      rtcpFeedback: [
        {
          type: "nack",
        },
        {
          type: "nack",
          parameter: "pli",
        },
        {
          type: "ccm",
          parameter: "fir",
        },
        {
          type: "goog-remb",
        },
        {
          type: "transport-cc",
        },
      ],
    },
    {
      kind: "video",
      mimeType: "video/rtx",
      preferredPayloadType: 127,
      clockRate: 90000,
      parameters: {
        apt: 126,
      },
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/H264",
      preferredPayloadType: 97,
      clockRate: 90000,
      parameters: {
        "profile-level-id": "42e01f",
        "level-asymmetry-allowed": 1,
      },
      rtcpFeedback: [
        {
          type: "nack",
        },
        {
          type: "nack",
          parameter: "pli",
        },
        {
          type: "ccm",
          parameter: "fir",
        },
        {
          type: "goog-remb",
        },
        {
          type: "transport-cc",
        },
      ],
    },
    {
      kind: "video",
      mimeType: "video/rtx",
      preferredPayloadType: 98,
      clockRate: 90000,
      parameters: {
        apt: 97,
      },
      rtcpFeedback: [],
    },
  ],
  headerExtensions: [
    {
      kind: "audio",
      uri: "urn:ietf:params:rtp-hdrext:ssrc-audio-level",
      preferredId: 1,
    },
    {
      kind: "audio",
      uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
      preferredId: 3,
    },
    {
      kind: "video",
      uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
      preferredId: 3,
    },
    {
      kind: "video",
      uri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
      preferredId: 4,
    },
    {
      kind: "video",
      uri: "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",
      preferredId: 7,
    },
  ],
};

export const chrome: RtpCapabilities = {
  codecs: [
    {
      kind: "audio",
      mimeType: "audio/opus",
      preferredPayloadType: 111,
      clockRate: 48000,
      channels: 2,
      parameters: {
        minptime: 10,
        useinbandfec: 1,
      },
      rtcpFeedback: [
        {
          type: "transport-cc",
        },
      ],
    },
    {
      kind: "audio",
      mimeType: "audio/red",
      preferredPayloadType: 63,
      clockRate: 48000,
      channels: 2,
      parameters: {},
      rtcpFeedback: [],
    },
    {
      kind: "audio",
      mimeType: "audio/G722",
      preferredPayloadType: 9,
      clockRate: 8000,
      parameters: {},
      rtcpFeedback: [],
    },
    {
      kind: "audio",
      mimeType: "audio/PCMU",
      preferredPayloadType: 0,
      clockRate: 8000,
      parameters: {},
      rtcpFeedback: [],
    },
    {
      kind: "audio",
      mimeType: "audio/PCMA",
      preferredPayloadType: 8,
      clockRate: 8000,
      parameters: {},
      rtcpFeedback: [],
    },
    {
      kind: "audio",
      mimeType: "audio/CN",
      preferredPayloadType: 13,
      clockRate: 8000,
      parameters: {},
      rtcpFeedback: [],
    },
    {
      kind: "audio",
      mimeType: "audio/telephone-event",
      preferredPayloadType: 110,
      clockRate: 48000,
      parameters: {},
      rtcpFeedback: [],
    },
    {
      kind: "audio",
      mimeType: "audio/telephone-event",
      preferredPayloadType: 126,
      clockRate: 8000,
      parameters: {},
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/VP8",
      preferredPayloadType: 96,
      clockRate: 90000,
      parameters: {},
      rtcpFeedback: [
        {
          type: "goog-remb",
        },
        {
          type: "transport-cc",
        },
        {
          type: "ccm",
          parameter: "fir",
        },
        {
          type: "nack",
        },
        {
          type: "nack",
          parameter: "pli",
        },
      ],
    },
    {
      kind: "video",
      mimeType: "video/rtx",
      preferredPayloadType: 97,
      clockRate: 90000,
      parameters: {
        apt: 96,
      },
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/H264",
      preferredPayloadType: 102,
      clockRate: 90000,
      parameters: {
        "level-asymmetry-allowed": 1,
        "packetization-mode": 1,
        "profile-level-id": "42001f",
      },
      rtcpFeedback: [
        {
          type: "goog-remb",
        },
        {
          type: "transport-cc",
        },
        {
          type: "ccm",
          parameter: "fir",
        },
        {
          type: "nack",
        },
        {
          type: "nack",
          parameter: "pli",
        },
      ],
    },
    {
      kind: "video",
      mimeType: "video/rtx",
      preferredPayloadType: 103,
      clockRate: 90000,
      parameters: {
        apt: 102,
      },
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/H264",
      preferredPayloadType: 104,
      clockRate: 90000,
      parameters: {
        "level-asymmetry-allowed": 1,
        "packetization-mode": 0,
        "profile-level-id": "42001f",
      },
      rtcpFeedback: [
        {
          type: "goog-remb",
        },
        {
          type: "transport-cc",
        },
        {
          type: "ccm",
          parameter: "fir",
        },
        {
          type: "nack",
        },
        {
          type: "nack",
          parameter: "pli",
        },
      ],
    },
    {
      kind: "video",
      mimeType: "video/rtx",
      preferredPayloadType: 105,
      clockRate: 90000,
      parameters: {
        apt: 104,
      },
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/H264",
      preferredPayloadType: 106,
      clockRate: 90000,
      parameters: {
        "level-asymmetry-allowed": 1,
        "packetization-mode": 1,
        "profile-level-id": "42e01f",
      },
      rtcpFeedback: [
        {
          type: "goog-remb",
        },
        {
          type: "transport-cc",
        },
        {
          type: "ccm",
          parameter: "fir",
        },
        {
          type: "nack",
        },
        {
          type: "nack",
          parameter: "pli",
        },
      ],
    },
    {
      kind: "video",
      mimeType: "video/rtx",
      preferredPayloadType: 107,
      clockRate: 90000,
      parameters: {
        apt: 106,
      },
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/H264",
      preferredPayloadType: 108,
      clockRate: 90000,
      parameters: {
        "level-asymmetry-allowed": 1,
        "packetization-mode": 0,
        "profile-level-id": "42e01f",
      },
      rtcpFeedback: [
        {
          type: "goog-remb",
        },
        {
          type: "transport-cc",
        },
        {
          type: "ccm",
          parameter: "fir",
        },
        {
          type: "nack",
        },
        {
          type: "nack",
          parameter: "pli",
        },
      ],
    },
    {
      kind: "video",
      mimeType: "video/rtx",
      preferredPayloadType: 109,
      clockRate: 90000,
      parameters: {
        apt: 108,
      },
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/H264",
      preferredPayloadType: 127,
      clockRate: 90000,
      parameters: {
        "level-asymmetry-allowed": 1,
        "packetization-mode": 1,
        "profile-level-id": "4d001f",
      },
      rtcpFeedback: [
        {
          type: "goog-remb",
        },
        {
          type: "transport-cc",
        },
        {
          type: "ccm",
          parameter: "fir",
        },
        {
          type: "nack",
        },
        {
          type: "nack",
          parameter: "pli",
        },
      ],
    },
    {
      kind: "video",
      mimeType: "video/rtx",
      preferredPayloadType: 125,
      clockRate: 90000,
      parameters: {
        apt: 127,
      },
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/H264",
      preferredPayloadType: 39,
      clockRate: 90000,
      parameters: {
        "level-asymmetry-allowed": 1,
        "packetization-mode": 0,
        "profile-level-id": "4d001f",
      },
      rtcpFeedback: [
        {
          type: "goog-remb",
        },
        {
          type: "transport-cc",
        },
        {
          type: "ccm",
          parameter: "fir",
        },
        {
          type: "nack",
        },
        {
          type: "nack",
          parameter: "pli",
        },
      ],
    },
    {
      kind: "video",
      mimeType: "video/rtx",
      preferredPayloadType: 40,
      clockRate: 90000,
      parameters: {
        apt: 39,
      },
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/AV1",
      preferredPayloadType: 45,
      clockRate: 90000,
      parameters: {},
      rtcpFeedback: [
        {
          type: "goog-remb",
        },
        {
          type: "transport-cc",
        },
        {
          type: "ccm",
          parameter: "fir",
        },
        {
          type: "nack",
        },
        {
          type: "nack",
          parameter: "pli",
        },
      ],
    },
    {
      kind: "video",
      mimeType: "video/rtx",
      preferredPayloadType: 46,
      clockRate: 90000,
      parameters: {
        apt: 45,
      },
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/VP9",
      preferredPayloadType: 98,
      clockRate: 90000,
      parameters: {
        "profile-id": 0,
      },
      rtcpFeedback: [
        {
          type: "goog-remb",
        },
        {
          type: "transport-cc",
        },
        {
          type: "ccm",
          parameter: "fir",
        },
        {
          type: "nack",
        },
        {
          type: "nack",
          parameter: "pli",
        },
      ],
    },
    {
      kind: "video",
      mimeType: "video/rtx",
      preferredPayloadType: 99,
      clockRate: 90000,
      parameters: {
        apt: 98,
      },
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/VP9",
      preferredPayloadType: 100,
      clockRate: 90000,
      parameters: {
        "profile-id": 2,
      },
      rtcpFeedback: [
        {
          type: "goog-remb",
        },
        {
          type: "transport-cc",
        },
        {
          type: "ccm",
          parameter: "fir",
        },
        {
          type: "nack",
        },
        {
          type: "nack",
          parameter: "pli",
        },
      ],
    },
    {
      kind: "video",
      mimeType: "video/rtx",
      preferredPayloadType: 101,
      clockRate: 90000,
      parameters: {
        apt: 100,
      },
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/red",
      preferredPayloadType: 112,
      clockRate: 90000,
      parameters: {},
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/rtx",
      preferredPayloadType: 113,
      clockRate: 90000,
      parameters: {
        apt: 112,
      },
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/ulpfec",
      preferredPayloadType: 114,
      clockRate: 90000,
      parameters: {},
      rtcpFeedback: [],
    },
  ],
  headerExtensions: [
    {
      kind: "audio",
      uri: "urn:ietf:params:rtp-hdrext:ssrc-audio-level",
      preferredId: 1,
    },
    {
      kind: "audio",
      uri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
      preferredId: 2,
    },
    {
      kind: "audio",
      uri: "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",
      preferredId: 3,
    },
    {
      kind: "audio",
      uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
      preferredId: 4,
    },
    {
      kind: "video",
      uri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
      preferredId: 2,
    },
    {
      kind: "video",
      uri: "urn:3gpp:video-orientation",
      preferredId: 13,
    },
    {
      kind: "video",
      uri: "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",
      preferredId: 3,
    },
    {
      kind: "video",
      uri: "http://www.webrtc.org/experiments/rtp-hdrext/playout-delay",
      preferredId: 5,
    },
    {
      kind: "video",
      uri: "http://www.webrtc.org/experiments/rtp-hdrext/video-content-type" as RtpHeaderExtensionUri,
      preferredId: 6,
    },
    {
      kind: "video",
      uri: "http://www.webrtc.org/experiments/rtp-hdrext/video-timing" as RtpHeaderExtensionUri,
      preferredId: 7,
    },
    {
      kind: "video",
      uri: "http://www.webrtc.org/experiments/rtp-hdrext/color-space" as RtpHeaderExtensionUri,
      preferredId: 8,
    },
    {
      kind: "video",
      uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
      preferredId: 4,
    },
    {
      kind: "video",
      uri: "urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id",
      preferredId: 10,
    },
    {
      kind: "video",
      uri: "urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id",
      preferredId: 11,
    },
  ],
};

export const safari: RtpCapabilities = {
  codecs: [
    {
      kind: "audio",
      mimeType: "audio/opus",
      preferredPayloadType: 111,
      clockRate: 48000,
      channels: 2,
      parameters: {
        minptime: 10,
        useinbandfec: 1,
      },
      rtcpFeedback: [
        {
          type: "transport-cc",
        },
      ],
    },
    {
      kind: "audio",
      mimeType: "audio/ISAC",
      preferredPayloadType: 103,
      clockRate: 16000,
      parameters: {},
      rtcpFeedback: [],
    },
    {
      kind: "audio",
      mimeType: "audio/G722",
      preferredPayloadType: 9,
      clockRate: 8000,
      parameters: {},
      rtcpFeedback: [],
    },
    {
      kind: "audio",
      mimeType: "audio/PCMU",
      preferredPayloadType: 0,
      clockRate: 8000,
      parameters: {},
      rtcpFeedback: [],
    },
    {
      kind: "audio",
      mimeType: "audio/PCMA",
      preferredPayloadType: 8,
      clockRate: 8000,
      parameters: {},
      rtcpFeedback: [],
    },
    {
      kind: "audio",
      mimeType: "audio/CN",
      preferredPayloadType: 105,
      clockRate: 16000,
      parameters: {},
      rtcpFeedback: [],
    },
    {
      kind: "audio",
      mimeType: "audio/CN",
      preferredPayloadType: 13,
      clockRate: 8000,
      parameters: {},
      rtcpFeedback: [],
    },
    {
      kind: "audio",
      mimeType: "audio/telephone-event",
      preferredPayloadType: 110,
      clockRate: 48000,
      parameters: {},
      rtcpFeedback: [],
    },
    {
      kind: "audio",
      mimeType: "audio/telephone-event",
      preferredPayloadType: 113,
      clockRate: 16000,
      parameters: {},
      rtcpFeedback: [],
    },
    {
      kind: "audio",
      mimeType: "audio/telephone-event",
      preferredPayloadType: 126,
      clockRate: 8000,
      parameters: {},
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/H264",
      preferredPayloadType: 96,
      clockRate: 90000,
      parameters: {
        "level-asymmetry-allowed": 1,
        "packetization-mode": 1,
        "profile-level-id": "640c1f",
      },
      rtcpFeedback: [
        {
          type: "goog-remb",
        },
        {
          type: "transport-cc",
        },
        {
          type: "ccm",
          parameter: "fir",
        },
        {
          type: "nack",
        },
        {
          type: "nack",
          parameter: "pli",
        },
      ],
    },
    {
      kind: "video",
      mimeType: "video/rtx",
      preferredPayloadType: 97,
      clockRate: 90000,
      parameters: {
        apt: 96,
      },
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/H264",
      preferredPayloadType: 98,
      clockRate: 90000,
      parameters: {
        "level-asymmetry-allowed": 1,
        "packetization-mode": 1,
        "profile-level-id": "42e01f",
      },
      rtcpFeedback: [
        {
          type: "goog-remb",
        },
        {
          type: "transport-cc",
        },
        {
          type: "ccm",
          parameter: "fir",
        },
        {
          type: "nack",
        },
        {
          type: "nack",
          parameter: "pli",
        },
      ],
    },
    {
      kind: "video",
      mimeType: "video/rtx",
      preferredPayloadType: 99,
      clockRate: 90000,
      parameters: {
        apt: 98,
      },
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/H264",
      preferredPayloadType: 100,
      clockRate: 90000,
      parameters: {
        "level-asymmetry-allowed": 1,
        "packetization-mode": 0,
        "profile-level-id": "640c1f",
      },
      rtcpFeedback: [
        {
          type: "goog-remb",
        },
        {
          type: "transport-cc",
        },
        {
          type: "ccm",
          parameter: "fir",
        },
        {
          type: "nack",
        },
        {
          type: "nack",
          parameter: "pli",
        },
      ],
    },
    {
      kind: "video",
      mimeType: "video/rtx",
      preferredPayloadType: 101,
      clockRate: 90000,
      parameters: {
        apt: 100,
      },
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/H264",
      preferredPayloadType: 102,
      clockRate: 90000,
      parameters: {
        "level-asymmetry-allowed": 1,
        "packetization-mode": 0,
        "profile-level-id": "42e01f",
      },
      rtcpFeedback: [
        {
          type: "goog-remb",
        },
        {
          type: "transport-cc",
        },
        {
          type: "ccm",
          parameter: "fir",
        },
        {
          type: "nack",
        },
        {
          type: "nack",
          parameter: "pli",
        },
      ],
    },
    {
      kind: "video",
      mimeType: "video/rtx",
      preferredPayloadType: 127,
      clockRate: 90000,
      parameters: {
        apt: 102,
      },
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/VP8",
      preferredPayloadType: 104,
      clockRate: 90000,
      parameters: {},
      rtcpFeedback: [
        {
          type: "goog-remb",
        },
        {
          type: "transport-cc",
        },
        {
          type: "ccm",
          parameter: "fir",
        },
        {
          type: "nack",
        },
        {
          type: "nack",
          parameter: "pli",
        },
      ],
    },
    {
      kind: "video",
      mimeType: "video/rtx",
      preferredPayloadType: 125,
      clockRate: 90000,
      parameters: {
        apt: 104,
      },
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/red",
      preferredPayloadType: 106,
      clockRate: 90000,
      parameters: {},
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/rtx",
      preferredPayloadType: 107,
      clockRate: 90000,
      parameters: {
        apt: 106,
      },
      rtcpFeedback: [],
    },
    {
      kind: "video",
      mimeType: "video/ulpfec",
      preferredPayloadType: 108,
      clockRate: 90000,
      parameters: {},
      rtcpFeedback: [],
    },
  ],
  headerExtensions: [
    {
      kind: "audio",
      uri: "urn:ietf:params:rtp-hdrext:ssrc-audio-level",
      preferredId: 1,
    },
    {
      kind: "audio",
      uri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
      preferredId: 2,
    },
    {
      kind: "audio",
      uri: "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",
      preferredId: 3,
    },
    {
      kind: "audio",
      uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
      preferredId: 4,
    },
    {
      kind: "audio",
      uri: "urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id",
      preferredId: 5,
    },
    {
      kind: "audio",
      uri: "urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id",
      preferredId: 6,
    },
    {
      kind: "video",
      uri: "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
      preferredId: 2,
    },
    {
      kind: "video",
      uri: "urn:3gpp:video-orientation",
      preferredId: 13,
    },
    {
      kind: "video",
      uri: "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",
      preferredId: 3,
    },
    {
      kind: "video",
      uri: "http://www.webrtc.org/experiments/rtp-hdrext/playout-delay",
      preferredId: 12,
    },
    {
      kind: "video",
      uri: "http://www.webrtc.org/experiments/rtp-hdrext/video-content-type" as RtpHeaderExtensionUri,
      preferredId: 11,
    },
    {
      kind: "video",
      uri: "http://www.webrtc.org/experiments/rtp-hdrext/video-timing" as RtpHeaderExtensionUri,
      preferredId: 7,
    },
    {
      kind: "video",
      uri: "http://www.webrtc.org/experiments/rtp-hdrext/color-space" as RtpHeaderExtensionUri,
      preferredId: 8,
    },
    {
      kind: "video",
      uri: "urn:ietf:params:rtp-hdrext:sdes:mid",
      preferredId: 4,
    },
    {
      kind: "video",
      uri: "urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id",
      preferredId: 5,
    },
    {
      kind: "video",
      uri: "urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id",
      preferredId: 6,
    },
  ],
};

// TODO, FIXME: Here we're assuming that Unified Plan is the correct way to
// handle the SDP messages. For a more robust handling, this should probably
// depend on the actual type of SDP: plain, PlanB, or UnifiedPlan.
import * as MsSdpUnifiedPlanUtils from "mediasoup-client/handlers/sdp/unifiedPlanUtils";

import * as MsSdpUtils from "mediasoup-client/handlers/sdp/commonUtils";
import * as MsOrtc from "mediasoup-client/ortc";
import {
  MediaKind,
  RtpCapabilities,
  RtpParameters,
} from "mediasoup/types";
import { MediaDescription, SessionDescription } from "sdp-transform";
import _ from "lodash";

// SDP to RTP Capabilities and Parameters
// ======================================

// WARNING: This function works for SDP messages that contain ONLY 1 media
// of each kind.
// MsSdpUtils.extractRtpCapabilities() only works for 1 audio and 1 video.
export function sdpToConsumerRtpCapabilities(
  sdpObject: SessionDescription,
  localCaps: RtpCapabilities
): RtpCapabilities {
  // Clone input to avoid side effect modifications.
  const _localCaps = JSON.parse(JSON.stringify(localCaps));

  const caps: RtpCapabilities = MsSdpUtils.extractRtpCapabilities({
    sdpObject,
  });

  // DEBUG: Uncomment for details.
  // prettier-ignore
  // {
  //   console.debug(`DEBUG [SdpUtils.sdpToConsumerRtpCapabilities] RtpCapabilities:\n${JSON.stringify(caps, null, 2)}`);
  // }

  // This may throw.
  MsOrtc.validateAndNormalizeRtpCapabilities(_localCaps);
  MsOrtc.validateAndNormalizeRtpCapabilities(caps);

  // Keep the codec order of the remote caps, as before mediasoup-client made
  // it configurable.
  const extendedCaps = MsOrtc.getExtendedRtpCapabilities(caps, _localCaps, false);
  const consumerCaps = MsOrtc.getRecvRtpCapabilities(extendedCaps);

  // DEBUG: Uncomment for details.
  // prettier-ignore
  // {
  //   console.debug(`DEBUG [SdpUtils.sdpToConsumerRtpCapabilities] ExtendedRtpCapabilities:\n${JSON.stringify(extendedCaps, null, 2)}`);
  //   console.debug(`DEBUG [SdpUtils.sdpToConsumerRtpCapabilities] Recv/ConsumerRtpCapabilities:\n${JSON.stringify(consumerCaps, null, 2)}`);
  // }

  return consumerCaps;
}

// WARNING: This function works for SDP messages that contain ONLY 1 media
// of each kind.
// MsSdpUtils.extractRtpCapabilities() only works for 1 audio and 1 video.
export function sdpToProducerRtpParameters(
  sdpObject: SessionDescription,
  localCaps: RtpCapabilities,
  kind: MediaKind,
  scalabilityMode: string
): RtpParameters {
  // Clone input to avoid side effect modifications.
  const _localCaps = JSON.parse(JSON.stringify(localCaps));

  const caps: RtpCapabilities = MsSdpUtils.extractRtpCapabilities({
    sdpObject,
  });

  // DEBUG: Uncomment for details.
  // prettier-ignore
  // {
  //   console.debug(`DEBUG [SdpUtils.sdpToProducerRtpParameters] (${kind}) RtpCapabilities:\n${JSON.stringify(caps, null, 2)}`);
  // }

  // Filter out all caps that don't match the desired media kind.
  caps.codecs = caps.codecs?.filter((c) => c.kind === kind);
  caps.headerExtensions = caps.headerExtensions?.filter((e) => e.kind === kind);

  // This may throw.
  MsOrtc.validateAndNormalizeRtpCapabilities(_localCaps);
  MsOrtc.validateAndNormalizeRtpCapabilities(caps);

  // Keep the codec order of the remote caps, as before mediasoup-client made
  // it configurable.
  const extendedCaps = MsOrtc.getExtendedRtpCapabilities(_localCaps, caps, false);
  const producerParams = MsOrtc.getSendingRtpParameters(kind, extendedCaps);

  // DEBUG: Uncomment for details.
  // prettier-ignore
  // {
  //   console.debug(`DEBUG [SdpUtils.sdpToProducerRtpParameters] (${kind}) SendingRtpParameters:\n${JSON.stringify(producerParams, null, 2)}`);
  // }

  // FIXME: Use correct values for an SDP Answer.
  // This is needed because `MsOrtc.getSendingRtpParameters` gets all the local
  // (mediasoup server) values, but we actually want to keep some of the remote
  // ones on SDP Answers, such as codec payload types or header extension IDs.
  const rtxCodecRegex = /.+\/rtx$/i;
  for (const codec of producerParams.codecs) {
    if (rtxCodecRegex.test(codec.mimeType)) {
      const extendedCodec = extendedCaps.codecs.find(
        (c: any) => c.localPayloadType === codec.parameters?.apt
      );
      if (
        extendedCodec &&
        extendedCodec.remoteRtxPayloadType !== undefined &&
        codec.parameters
      ) {
        codec.payloadType = extendedCodec.remoteRtxPayloadType;
        codec.parameters.apt = extendedCodec.remotePayloadType;
      }
    } else {
      const extendedCodec = extendedCaps.codecs.find(
        (c: any) =>
          c.mimeType === codec.mimeType &&
          c.clockRate === codec.clockRate &&
          c.channels === codec.channels &&
          _.isEqual(c.localParameters, codec.parameters)
      );
      if (extendedCodec) {
        codec.payloadType = extendedCodec.remotePayloadType;
      }
    }
  }
  for (const headerExt of producerParams.headerExtensions ?? []) {
    const extendedExt = extendedCaps.headerExtensions.find(
      (h: any) => h.kind === kind && h.uri === headerExt.uri
    );
    if (extendedExt) {
      headerExt.id = extendedExt.recvId;
    }
  }

  const sdpMediaObj: MediaDescription | undefined = sdpObject.media.find(
    (m) => m.type === kind
  );
  if (!sdpMediaObj) {
    throw new Error(
      `[SdpUtils.sdpToProducerRtpParameters] No '${kind}' media in the SDP`
    );
  }

  // Fill `RtpParameters.mid`.
  if ("mid" in sdpMediaObj) {
    producerParams.mid = String(sdpMediaObj.mid);
  } else {
    producerParams.mid = kind === "audio" ? "0" : "1";
  }

  // Fill `RtpParameters.encodings`.
  {
    if ("ssrcs" in sdpMediaObj) {
      producerParams.encodings = MsSdpUnifiedPlanUtils.getRtpEncodings({
        offerMediaObject: sdpMediaObj,
        codecs: producerParams.codecs,
      });
    } else {
      producerParams.encodings = [];
    }

    if ("rids" in sdpMediaObj) {
      // FIXME: Maybe mediasoup's getRtpEncodings() should just be improved
      // to include doing this, so we don't need to branch an if() here.
      sdpMediaObj.rids
        ?.filter((rid) => rid.direction === "send")
        .forEach((rid, i) => {
          producerParams.encodings![i] = {
            ...producerParams.encodings![i],

            rid: String(rid.id),

            // If "rid" is in use it means multiple simulcast RTP streams.
            // SDP includes information of the spatial layers in each encoding,
            // but it doesn't tell the amount of temporal layers.
            // Here we asume that all implementations are hardcoded to generate
            // exactly 3 temporal layers (verified with Chrome and Firefox).
            scalabilityMode: "L1T3",
          };
        });
    }

    if (kind === "video") {
      for (const encoding of producerParams.encodings) {
        encoding.scalabilityMode = scalabilityMode;
      }
    }
  }

  // Fill `RtpParameters.rtcp`.
  producerParams.rtcp = {
    cname: MsSdpUtils.getCname({ offerMediaObject: sdpMediaObj }),
    reducedSize: (sdpMediaObj.rtcpRsize ?? "") === "rtcp-rsize",
    mux: (sdpMediaObj.rtcpMux ?? "") === "rtcp-mux",
  };

  // DEBUG: Uncomment for details.
  // prettier-ignore
  // {
  //   console.debug(`DEBUG [SdpUtils.sdpToProducerRtpParameters] (${kind}) ExtendedRtpCapabilities:\n${JSON.stringify(extendedCaps, null, 2)}`);
  //   console.debug(`DEBUG [SdpUtils.sdpToProducerRtpParameters] (${kind}) ProducerRtpParameters:\n${JSON.stringify(producerParams, null, 2)}`);
  // }

  return producerParams;
}

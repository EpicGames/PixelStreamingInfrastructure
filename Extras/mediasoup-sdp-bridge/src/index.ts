import * as MsSdpUtils from "mediasoup-client/handlers/sdp/commonUtils";
import { RemoteSdp } from "mediasoup-client/handlers/sdp/RemoteSdp";
import { IceCandidate as ClientIceCandidate } from "mediasoup-client/types";

import {
  Consumer,
  MediaKind,
  Producer,
  RtpCapabilities,
  RtpParameters,
  Transport,
  WebRtcTransport,
} from "mediasoup/types";

import { randomUUID } from "node:crypto";
import * as SdpTransform from "sdp-transform";

import * as BrowserRtpCapabilities from "./BrowserRtpCapabilities";
import * as SdpUtils from "./SdpUtils";

export class SdpEndpoint {
  // TODO: Currently this only handles WebRTC. At some point the implementation
  // should just use the Transport class and not its subclasses.
  private transport: Transport;
  private webRtcTransport: WebRtcTransport;

  // Local RTP capabilities of this endpoint. Normally set to those of the
  // mediasoup Router.
  private localCaps: RtpCapabilities;

  // Local and remote SDPs, obtained/created from SDP Offer/Answer negotiation.
  private localSdp: string | undefined;
  private remoteSdp: string | undefined;

  private producers: Producer[] = [];
  private producerOfferMedias: SdpTransform.MediaDescription[] = [];
  private producerOfferParams: RtpParameters[] = [];
  private producerOfferSctpMedia: SdpTransform.MediaDescription | undefined;

  private consumers: Consumer[] = [];
  private _receiveData: boolean = false;

  constructor(webRtcTransport: WebRtcTransport, localCaps: RtpCapabilities) {
    this.webRtcTransport = webRtcTransport;
    this.transport = webRtcTransport;

    this.localCaps = localCaps;
  }

  // Receive media into mediasoup
  // ============================
  //
  // * processOffer
  // * createAnswer

  public async processOffer(
    sdpOffer: string,
    scalabilityMode: string
  ): Promise<{ producers: Producer[]; dataEnabled: boolean }> {
    if (this.remoteSdp) {
      throw new Error(
        "[SdpEndpoint.processOffer] A remote description was already set"
      );
    }

    this.remoteSdp = sdpOffer;

    // Parse the SDP message text into an object.
    const remoteSdpObj = SdpTransform.parse(sdpOffer);

    // sdp-transform bug #94: Type inconsistency in payloads
    // https://github.com/clux/sdp-transform/issues/94
    // Force "payloads" to be a string field.
    for (const media of remoteSdpObj.media) {
      media.payloads = "" + media.payloads;
    }

    // DEBUG: Uncomment for details.
    // prettier-ignore
    // {
    //   console.debug(`DEBUG [SdpEndpoint.processOffer] Remote SDP object:\n${JSON.stringify(remoteSdpObj, null, 2)}`);
    // }

    // Use DTLS info from the remote SDP to connect the WebRTC transport.
    let dtlsParameters;
    try {
      dtlsParameters = MsSdpUtils.extractDtlsParameters({
        sdpObject: remoteSdpObj,
      });
    } catch (error) {
      const err = new Error(
        "[SdpEndpoint.processOffer] Unexpected error while extracting DTLS parameters"
      );
      if (error instanceof Error) {
        err.message += `; error: ${error.message}`;
      }
      (err as any).cause = error as any;
      console.error(`ERROR ${err.message}`);
      throw err;
    }
    await this.webRtcTransport.connect({
      dtlsParameters,
    });

    // Get a list of media and make Producers for all of them.
    // NOTE: Only up to 1 audio and 1 video are accepted.
    const mediaKinds = new Set<MediaKind>();
    for (const media of remoteSdpObj.media) {
      // sctp media handled slightly differently
      if (media.type == "application") {
        console.log("[SdpEndpoint.processOffer] SCTP association received");
        this.producerOfferSctpMedia = media;
        continue;
      }

      if (!("rtp" in media)) {
        // Skip media that is not RTP.
        continue;
      }
      if (!("direction" in media)) {
        // Skip media for which the direction is unknown.
        continue;
      }

      const mediaKind = media.type as MediaKind;

      if (mediaKinds.has(mediaKind)) {
        // Skip media if the same kind was already processed.
        // WARNING: Sending more than 1 audio or 1 video is a BUG in the client.
        console.warn(
          `WARNING [SdpEndpoint.processOffer] Client BUG: More than 1 '${mediaKind}' media was requested; skipping it`
        );
        continue;
      }

      // Generate RtpSendParameters to be used for the new Producer.
      // WARNING: This function only works well for max. 1 audio and 1 video.
      const producerParams = SdpUtils.sdpToProducerRtpParameters(
        remoteSdpObj,
        this.localCaps,
        mediaKind,
        scalabilityMode
      );

      // Add a new Producer for the given media.
      let producer: Producer;
      try {
        producer = await this.transport.produce({
          kind: mediaKind,
          rtpParameters: producerParams,
          paused: false,
        });
      } catch (error) {
        let message = `[SdpEndpoint.processOffer] Cannot create mediasoup Producer, kind: ${mediaKind}`;
        if (error instanceof Error) {
          message += `, error: ${error.message}`;
        }
        console.error(`ERROR ${message}`);
        throw new Error(message);
      }

      this.producers.push(producer);
      this.producerOfferMedias.push(media);
      this.producerOfferParams.push(producerParams);

      // prettier-ignore
      console.log(`[SdpEndpoint.processOffer] mediasoup Producer created, kind: ${producer.kind}, type: ${producer.type}, paused: ${producer.paused}`);

      // DEBUG: Uncomment for details.
      // prettier-ignore
      // {
      //   console.debug(`DEBUG [SdpEndpoint.processOffer] mediasoup Producer RtpParameters:\n${JSON.stringify(producer.rtpParameters, null, 2)}`);
      // }

      // A new Producer was successfully added, so mark this media kind as added.
      mediaKinds.add(mediaKind);
    }

    return {
      producers: this.producers,
      dataEnabled: !!this.producerOfferSctpMedia,
    };
  }

  public createAnswer(): string {
    if (this.localSdp) {
      throw new Error(
        "[SdpEndpoint.createAnswer] A local description was already set"
      );
    }

    const sdpBuilder: RemoteSdp = new RemoteSdp({
      iceParameters: this.webRtcTransport.iceParameters,
      iceCandidates: this.webRtcTransport.iceCandidates as ClientIceCandidate[],
      dtlsParameters: this.webRtcTransport.dtlsParameters,
      sctpParameters: this.webRtcTransport.sctpParameters,
    });

    console.log("[SdpEndpoint.createAnswer] Make 'recvonly' SDP Answer");

    for (let i = 0; i < this.producers.length; i++) {
      // Each call to RemoteSdp.send() creates a new AnswerMediaSection,
      // which always assumes an `a=recvonly` direction.
      sdpBuilder.send({
        offerMediaObject: this.producerOfferMedias[i],
        reuseMid: undefined,
        offerRtpParameters: this.producerOfferParams[i],
        answerRtpParameters: this.producers[i].rtpParameters,
        codecOptions: undefined,
      });
    }

    if (this.producerOfferSctpMedia) {
      sdpBuilder.sendSctpAssociation({
        offerMediaObject: this.producerOfferSctpMedia,
      });
    }

    this.localSdp = sdpBuilder.getSdp();

    return this.localSdp;
  }

  // Send media from mediasoup
  // =========================
  //
  // * addConsumer
  // * createOffer
  // * processAnswer

  public addConsumer(consumer: Consumer): void {
    this.consumers.push(consumer);
  }

  public receiveData(): void {
    this._receiveData = true;
  }

  public createOffer(): string {
    if (this.localSdp) {
      throw new Error(
        "[SdpEndpoint.createOffer] A local description was already set"
      );
    }

    const sdpBuilder: RemoteSdp = new RemoteSdp({
      iceParameters: this.webRtcTransport.iceParameters,
      iceCandidates: this.webRtcTransport.iceCandidates as ClientIceCandidate[],
      dtlsParameters: this.webRtcTransport.dtlsParameters,
      sctpParameters: this.webRtcTransport.sctpParameters,
    });

    // Make an MSID to be used for both "audio" and "video" kinds.
    const sendMsid = randomUUID().slice(0, 8);

    console.log("[SdpEndpoint.createOffer] Make 'sendonly' SDP Offer");

    let videoRtpParameters;
    for (let i = 0; i < this.consumers.length; i++) {
      const mid = this.consumers[i].rtpParameters.mid ?? "nomid";
      const kind = this.consumers[i].kind;
      const sendParams = this.consumers[i].rtpParameters;

      if (kind === "video") {
        videoRtpParameters = sendParams;
      }

      // Each call to RemoteSdp.receive() creates a new OfferMediaSection,
      // which always assumes an `a=sendonly` direction.
      sdpBuilder.receive({
        mid,
        kind,
        offerRtpParameters: sendParams,

        // Parameters used to build the "msid" attribute:
        // a=msid:<streamId> <trackId>
        streamId: sendMsid,
        trackId: `${sendMsid}-${kind}`,
      });
    }

    if (videoRtpParameters) {
      videoRtpParameters.codecs[0].payloadType = 127;
      const rtpParameters: RtpParameters = {
        mid: "probator",
        codecs: [videoRtpParameters.codecs[0]],
        headerExtensions: videoRtpParameters.headerExtensions,
        encodings: [{ ssrc: 1234 }],
        rtcp: { cname: "probator" },
      };
      sdpBuilder.receive({
        mid: "probator",
        kind: "video",
        offerRtpParameters: rtpParameters,
        streamId: "probator",
        trackId: "probator",
      });
    }

    if (this._receiveData) {
      sdpBuilder.receiveSctpAssociation();
    }

    this.localSdp = sdpBuilder.getSdp();

    return this.localSdp;
  }

  public async processAnswer(sdpAnswer: string): Promise<void> {
    if (this.remoteSdp) {
      throw new Error(
        "[SdpEndpoint.processAnswer] A remote description was already set"
      );
    }

    this.remoteSdp = sdpAnswer;
    const remoteSdpObj = SdpTransform.parse(sdpAnswer);

    // DEBUG: Uncomment for details.
    // prettier-ignore
    // {
    //   console.debug(`DEBUG [SdpEndpoint.processAnswer] Remote SDP object:\n${JSON.stringify(remoteSdpObj, null, 2)}`);
    // }

    // Use DTLS info from the remote SDP to connect the WebRTC transport.
    let dtlsParameters;
    try {
      dtlsParameters = MsSdpUtils.extractDtlsParameters({
        sdpObject: remoteSdpObj,
      });
    } catch (error) {
      const err = new Error(
        "[SdpEndpoint.processAnswer] Unexpected error while extracting DTLS parameters"
      );
      if (error instanceof Error) {
        err.message += `; error: ${error.message}`;
      }
      (err as any).cause = error as any;
      console.error(`ERROR ${err.message}`);
      throw err;
    }
    await this.webRtcTransport.connect({
      dtlsParameters,
    });

    // TODO: Normally in a proper SDP endpoint the SDP Answer would be used to
    // match local and remote capabilities, and decide a subset of encodings
    // that can be received by the remote peer. However, for the current
    // implementation we just extract and print the remote capabilities.

    // TODO:
    // * Disable header extensions that are not accepted by the remote peer.

    // DEBUG: Uncomment for details.
    // prettier-ignore
    // {
    //   const remoteCaps = SdpUtils.sdpToConsumerRtpCapabilities(remoteSdpObj, this.localCaps);
    //   console.debug(`DEBUG [SdpEndpoint.processAnswer] Remote RECV RtpCapabilities:\n${JSON.stringify(remoteCaps, null, 2)}`);
    // }
  }
}

export function createSdpEndpoint(
  webRtcTransport: WebRtcTransport,
  localCaps: RtpCapabilities
): SdpEndpoint {
  return new SdpEndpoint(webRtcTransport, localCaps);
}

export function generateRtpCapabilities0(): RtpCapabilities {
  return BrowserRtpCapabilities.chrome;
}

export function generateRtpCapabilities1(
  localCaps: RtpCapabilities,
  remoteSdp: string
): RtpCapabilities {
  // TODO: Use proper SDP Offer/Answer negotiation to obtain capabilities.
  console.error("BUG [SdpEndpoint.generateRtpCapabilities1] Not implemented");
  process.exit(1);

  let caps: RtpCapabilities;
  return caps;
}

export function generateRtpCapabilities2(
  localCaps: RtpCapabilities,
  remoteCaps: RtpCapabilities
): RtpCapabilities {
  // TODO: Use matching to obtain capabilities.
  console.error("BUG [SdpEndpoint.generateRtpCapabilities2] Not implemented");
  process.exit(1);

  let caps: RtpCapabilities;
  return caps;
}

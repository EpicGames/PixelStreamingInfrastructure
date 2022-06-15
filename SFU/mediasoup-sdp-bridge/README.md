# mediasoup-sdp-bridge v3

[![][npm-shield-mediasoup-sdp-bridge]][npm-mediasoup-sdp-bridge]
[![][travis-ci-shield-mediasoup-sdp-bridge]][travis-ci-mediasoup-sdp-bridge]

Node.js library to allow integration of SDP based clients with [mediasoup][mediasoup-website].


## Website and Documentation

* [mediasoup.org][mediasoup-website]


## Support Forum

* [mediasoup.discourse.group][mediasoup-discourse]


## Use-Case Design Proposal

This section contains a use-case that can serve as usage example to guide design of the internal implementation.

Within the Node.js server app running mediasoup:


### mediasoup receiving media from a remote SDP endpoint

```typescript
import * as SdpBridge from "mediasoup-sdp-bridge";
import Signaling from "./my-signaling"; // Our own signaling stuff.

const transport: Transport = ... // A mediasoup WebRtcTransport or PlainTransport.

// Create an SdpEndpoint to handle SDP negotiation with the remote endpoint.
const sdpEndpoint = await SdpBridge.createSdpEndpoint({
  transport: transport,
});

// Upon receipt of an SDP Offer from the remote endpoint, apply it.
Signaling.on("sdp-offer", async (sdpOffer: string) => {
  // For each media section in the SDP Offer, SdpEndpoint creates a new Producer
  // on top of the Transport that was provided.
  const producers: Producer[] = await sdpEndpoint.processOffer(sdpOffer);

  // Generate an SDP Answer and reply to the remote endpoint with it.
  const sdpAnswer: string = sdpEndpoint.createAnswer();

  await Signaling.sendAnswer(sdpAnswer);
});
```


### mediasoup sending media to a remote SDP endpoint

```typescript
import * as SdpBridge from "mediasoup-sdp-bridge";
import Signaling from "./my-signaling"; // Our own signaling stuff.

const transport: Transport = ... // A mediasoup WebRtcTransport or PlainTransport.

// Create an SdpEndpoint to send media to the remote endpoint.
const sdpEndpoint = await createSdpEndpoint({
  transport: transport,
});

// Listen for the "negotiationneeded" event, to send an SDP Offer to the remote
// endpoint. This event is emitted when transport.consume() is called, or when
// a Producer being consumed is closed or paused/resumed.
sdpEndpoint.on("negotiationneeded", () => {
  // For each Consumer present in the Transport that was provided,
  // SdpEndpoint creates a new media section in the SDP Offer.
  const sdpOffer: string = sdpEndpoint.createOffer();

  // Send the SDP Offer to the remote endpoint.
  await Signaling.sendOffer(sdpOffer);
});

// Upon receipt of an SDP Answer from the remote endpoint, apply it.
Signaling.on("sdp-answer", async (sdpAnswer: string) => {
  await sdpEndpoint.processAnswer(sdpAnswer);
});

// Generate remote endpoint's RTP capabilities based on a remote SDP or based
// on handmade capabilities.
const endpointRtpCapabilities = SdpBridge.generateRtpCapabilities(
  router.rtpCapabilities,
  remoteSdp
);
// or:
const endpointRtpCapabilities = SdpBridge.generateRtpCapabilities(
  router.rtpCapabilities,
  handmadeRtpCapabilities
);

// If there were mediasoup Producers already created in the Router, or if a new
// one is created, and we want to consume them in the remote endpoint, tell the
// Transport to consume them. transport.consume() method will trigger the
// "negotiationneeded" event, handled above.
//
// NOTE: By calling consume() method in parallel (without waiting for the
// previous one to complete) we ensure that the "negotiationneeded" event will
// just be emitted once upon completion of all consume() calls, so a single
// SDP Offer/Answer roundtrip will be needed.
transport
  .consume({
    producerId: producer1.id,
    rtpCapabilities: endpointRtpCapabilities,
  })
  .catch((error) => console.error("transport.consume() failed:", error));

transport
  .consume({
    producerId: producer2.id,
    rtpCapabilities: endpointRtpCapabilities,
  })
  .catch((error) => console.error("transport.consume() failed:", error));
```


## Implementation Notes

### Design limitations

The initial Use-Case Design Proposal lacks an important detail: it uses an `endpointRtpCapabilities` object, which represents the WebRTC and RTP capabilities of the remote endpoint that will receive media from mediasoup. This *RtpCapabilities* object is assumed to be written either by hand, or obtained from a previous SDP message that somehow might have been obtained from the remote endpoint. It is only *after* having these *RtpCapabilities*, that the SDP Offer/Answer process starts.

All this, however, goes backwards with the normal flow of the SDP Offer/Answer model. **The remote capabilities should be obtained from the SDP Offer/Answer exchange itself**, not as an unspecified out-of-band mechanism. In theory, how the mediasoup application learns about remote capabilities should come from one of these sources:

1. An SDP Offer (with *recvonly* or *sendrecv* direction) from a remote endpoint that wants to receive media.

2. An SDP Answer (with *recvonly* or *sendrecv* direction) from a remote endpoint, in response to an SDP Offer (with *sendonly* or *sendrecv* direction) that the application had previously sent.

However, in practice both of these options conflict with the current design proposal:

* (1) is not being considered for now. mediasoup is designed around the assumption that the participant sending media should always be the one starting the connection; thus, the endpoint that will send media is also the one sending the SDP Offer.

* (2) is the ideal but *it's not possible* with the current design, because the remote capabilities must be already known by the time `sdpEndpoint.createOffer()` is called.

(Note: Additionally, the *sendrecv* direction is also not considered for now. Both the local application or the remote endpoints are be assumed to be either *sendonly* or *recvonly*.)


### Current implementation

The implementation found in this repo is enough to cover basic usage, but is not complete by any means. Also, it tries to work around the limitations described above, using alternatives that are far from ideal.

Some notes:

* Receiving media is the part that works best. It suffices to call `SdpEndpoint.processOffer()`, and this will return one Producer for each media section found in the SDP Offer.

* Sending media, on the other hand, suffers from the limitation described in (2) above. To work around this, the class `BrowserRtpCapabilities` contains predefined capabilities objects for some of the most common web browsers. These can be used by the application to provide `transport.consume()` with something to work with.

  The obvious drawback to this solution is that the objects in `BrowserRtpCapabilities` must be kept up to date from time to time, in order to accurately represent the actual capabilities of web browsers. To help with this task, there is a handy tool that can be found in the [tools/browser-rtpcapabilities](./tools/browser-rtpcapabilities/) subdirectory.

* SDP renegotiation is not implemented. The local endpoint cannot make an SDP Re-Offer when the state of the Producers or Consumers changes.

* There are minor improvements to be done in the implementation.

  - Right now the SdpEndpoint class exports an `SdpEndpoint.addConsumer()` method, which the application uses to provide all Consumers that are created from the corresponding Transport. However, chances are that this is unnecessary: the Transport class already provides an observer event `Transport.observer.on("newconsumer")`, which could be used by the SdpEndpoint to be notified of all new Consumers in its Transport, saving the application the need to provide them explicitly with `addConsumer()`.

  - Some unexpected errors are not handled gracefully, and instead a "BUG" error is logged before the application is forced to exit. These should probably be replaced by a `throw new Error(...)`.

  - Some debug messages are simply commented out to avoid causing too much noise. A proper logging library should be used to allow setting different levels and hiding the less interesting ones.

  - The code hasn't been linted. The default linter rules were left as per the initial commit, but haven't been used yet. For now, the code has just been formatted with the default rules from *Prettier.js*.


## Contributors

* Iñaki Baz Castillo [[website](https://inakibaz.me)|[github](https://github.com/ibc/)]
* Juan Navarro [[github](https://github.com/j1elo)]


## License

[ISC](./LICENSE)


[mediasoup-website]: https://mediasoup.org
[mediasoup-discourse]: https://mediasoup.discourse.group
[npm-shield-mediasoup-sdp-bridge]: https://img.shields.io/npm/v/mediasoup-sdp-bridge.svg
[npm-mediasoup-sdp-bridge]: https://npmjs.org/package/mediasoup-sdp-bridge
[travis-ci-shield-mediasoup-sdp-bridge]: https://travis-ci.com/versatica/mediasoup-sdp-bridge.svg?branch=master
[travis-ci-mediasoup-sdp-bridge]: https://travis-ci.com/versatica/mediasoup-sdp-bridge

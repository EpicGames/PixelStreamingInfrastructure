# @epicgames-ps/mediasoup-sdp-bridge

## 1.0.6

### Patch Changes

- 2af38ec: Make `mediasoup-sdp-bridge` importable against `mediasoup-client` 3.10.x (#685). Internal subpaths under `mediasoup-client/lib/...` were hidden by the `exports` field added in 3.8.0, breaking `import * as MsSdpUtils from "mediasoup-client/lib/handlers/sdp/commonUtils"` etc. with `ERR_PACKAGE_PATH_NOT_EXPORTED`. The imports now use the public paths exposed since 3.10.0 (`mediasoup-client/handlers/sdp/commonUtils`, `mediasoup-client/handlers/sdp/RemoteSdp`, `mediasoup-client/handlers/sdp/unifiedPlanUtils`, `mediasoup-client/ortc`) and the publicly re-exported `IceCandidate` from `mediasoup-client/types`. The peerDependency is tightened to `>=3.10.0 <3.11.0` to flag the supported range — 3.11 added a mandatory third arg to `getExtendedRtpCapabilities` and 3.16 renamed `validateRtpCapabilities`, both of which need follow-up work before they can be supported. The unsupported `extmapAllowMixed` option on `RemoteSdp.send` was removed.

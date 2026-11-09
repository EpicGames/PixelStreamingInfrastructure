# @epicgames-ps/mediasoup-sdp-bridge

## 1.1.0

### Minor Changes

- e54cf12: Support mediasoup 3.31 and later and mediasoup-client 3.25/3.26 (#1147). The peer dependencies are now `mediasoup` `^3.31.0` and `mediasoup-client` `>=3.25.0 <3.27.0`, and `sdp-transform` is upgraded to 3.0.0 to match mediasoup-client, which changed how `a=msid` is parsed. Types are imported from `mediasoup/types`, `validateRtpCapabilities` is replaced with `validateAndNormalizeRtpCapabilities`, `getExtendedRtpCapabilities` keeps the remote codec order it used before, the removed `planB` option is dropped, and `getRtpEncodings` is given the codecs so it only adds RTX when an RTX codec is negotiated. The `toffset` header extension, which mediasoup no longer supports, is removed from the browser capabilities.

---
'@epicgames-ps/lib-pixelstreamingfrontend-ue5.7': patch
---

Gate `PixelStreaming.emitUIInteraction` on data-channel readiness instead of video readiness. A UIInteraction is sent over the reliable data channel, which opens before the video is decode-ready, so the previous `isVideoReady()` guard could silently drop early interactions on slow connections. Adds a public `WebRtcPlayerController.isDataChannelOpen()` helper.

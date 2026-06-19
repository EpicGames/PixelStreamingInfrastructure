---
'@epicgames-ps/lib-pixelstreamingfrontend-ue5.7': patch
---

Gate the input/command methods on data-channel readiness instead of video readiness. A UIInteraction (and the other commands) is sent over the reliable data channel, which opens before the video is decode-ready, so the previous `isVideoReady()` guard could silently drop early messages on slow connections. This now covers `emitUIInteraction`, `emitCommand`, `emitConsoleCommand`, `sendTextboxEntry`, `requestShowFps`, and `requestDataChannelLatencyTest`; `requestLatencyTest` and `requestIframe` keep the video guard because they genuinely depend on the video stream. Adds a public `WebRtcPlayerController.isDataChannelOpen()` helper.

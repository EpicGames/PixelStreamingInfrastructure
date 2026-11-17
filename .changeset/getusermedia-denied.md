---
'@epicgames-ps/lib-pixelstreamingfrontend-ue5.8': patch
---

fix(frontend): keep the WebRTC handshake going when the browser refuses webcam or microphone access. With `UseCamera` or `UseMic` enabled, a denied permission or missing device made `getUserMedia` reject out of the transceiver setup, so a denied webcam skipped the preferred codec and the microphone, and the rejection went unhandled. The frontend now logs a warning and only receives that media.

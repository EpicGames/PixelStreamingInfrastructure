---
'@epicgames-ps/lib-pixelstreamingfrontend-ue5.8': minor
'@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.8': patch
---

Add the `PreferHardwareAV1` flag, on by default. When it is on and the streamer offers AV1, the frontend asks `navigator.mediaCapabilities.decodingInfo` whether this browser decodes AV1 from WebRTC power-efficiently, and if it does, AV1 is put ahead of the preferred codec in the answer. Otherwise the preferred codec is used as before. The flag is in the encoder section of the settings panel.

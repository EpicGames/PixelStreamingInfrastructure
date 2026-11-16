---
'@epicgames-ps/pixelstreaming-sfu': patch
---

Fix simulcast layer selection for Pixel Streaming 2 streamers and Preferred Quality for the original plugin (#1191). mediasoup expects simulcast layers smallest first, but Pixel Streaming 2 sends them largest first, so new peers got no video until the largest layer fit their bandwidth, and could not fall back to a smaller one. The SFU now hands Pixel Streaming 2's layers (recognised by the rid `simulcast0`) to mediasoup smallest first when the streamer offers RTX, and maps each peer's Preferred Quality so "High" is the largest layer for both plugins; with the original plugin, "High" previously gave the smallest. On UE 5.8, keep RTX in the streamer's offer by setting `PixelStreaming2.WebRTC.CodecPreferences=` (empty) under `[SystemSettings]` in the project's `DefaultEngine.ini`; without RTX the SFU keeps the streamer's order and logs a warning.

---
"@epicgames-ps/lib-pixelstreamingfrontend-ue5.7": minor
---

Add `PixelStreaming.emitData(messageType, bytes)` for sending raw byte payloads through the data channel without JSON encoding (#608). The bytes are sent as the payload of a registered to-streamer message type — the registered id is prepended as a single byte, the rest of the buffer is the application's payload verbatim. Useful for custom binary protocols (e.g. UTF-8 strings, packed structs) where the receiving UE side decodes the payload itself. The lower-level `WebRtcPlayerController.emitData` and `SendMessageController.sendBytesToStreamer` are also exposed for advanced callers.

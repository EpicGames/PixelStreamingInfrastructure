---
'@epicgames-ps/lib-pixelstreamingsignalling-ue5.8': patch
---

Leave the previous streamer when an SFU subscribes to another. `SFUConnection.subscribe` overwrote `subscribedStreamer` without unsubscribing from the old streamer, so the old streamer kept forwarding to the SFU and kept the SFU's listeners. When that old streamer later disconnected, it detached the SFU from the streamer it was actually on and dropped the SFU's players. `PlayerConnection` already unsubscribes first; the SFU now does the same.

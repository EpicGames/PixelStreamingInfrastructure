---
'@epicgames-ps/lib-pixelstreamingsignalling-ue5.8': patch
---

Limit websocket messages on the streamer, player and SFU ports to 1 MiB. ws accepts up to 100 MiB in one message by default, and signalling messages are a few kilobytes. A connection that sends more is closed with code 1009. Setting `maxPayload` in `streamerWsOptions`, `playerWsOptions` or `sfuWsOptions` overrides the limit for that port.

---
'@epicgames-ps/lib-pixelstreamingsignalling-ue5.8': minor
'@epicgames-ps/wilbur': minor
---

Add `IServerConfig.hideStreamerAddresses` and the `--hide_streamer_addresses` flag. When set, a player is sent only the streamer's relay ICE candidates, with their related address zeroed, and the addresses in the streamer's offer or answer are zeroed too, so a viewer never learns the streamer's LAN, public or IPv6 address. It needs `"iceTransportPolicy": "relay"` in the peer options, and the signalling server refuses to start with the flag without it.

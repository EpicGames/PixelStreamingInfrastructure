---
'@epicgames-ps/pixelstreaming-sfu': patch
---

Fix two faults that stopped the SFU serving a stream until it was restarted. `peers` is a `Map`, so `peers.get()` returns `undefined` for an unknown id, but `onPeerDisconnected` and `onLayerPreference` guarded the result with `!== null`, which `undefined` passes: a player that connected while no streamer was present is never added to the map (`onPeerConnected` returns early), so disconnecting it dereferenced `undefined` and crashed the process. Both now use the `if (!peer)` form already used elsewhere in the file. Separately, `onStreamerDisconnected` only scheduled its `listStreamers` retry inside the `streamer !== null` branch, so when the handler ran with `streamer` already null — a duplicate disconnect, or a streamer lost mid-negotiation — the rediscovery poll was never rescheduled and the SFU sat idle indefinitely while still connected to the signalling server, appearing healthy. The retry is now scheduled unconditionally.

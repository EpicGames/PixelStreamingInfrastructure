---
'@epicgames-ps/lib-pixelstreamingcommon-ue5.8': patch
---

fix(common): make the signalling schema match what peers send. `dataChannelRequest`, `peerDataChannelsReady` and `streamerDataChannels` gain the optional `playerId` that the signalling server and the SFU already set (the original Pixel Streaming plugin ignores `streamerDataChannels` without it). `ping` and `pong` `time` become `double`, because browsers send millisecond timestamps that do not fit in an `int32`. The schema also documents that messages travel as JSON and that player ids may arrive as JSON numbers. No wire format changes.

---
'@epicgames-ps/lib-pixelstreamingsignalling-ue5.7': patch
'@epicgames-ps/wilbur': patch
---

Enforce streamer/player subscription when routing signalling messages. Previously `StreamerConnection.forwardMessage`, `StreamerConnection.onDisconnectPlayerRequest` and `SFUConnection.sendToPlayer` resolved their target via the global player registry without checking that the player was subscribed to the sending streamer/SFU. On a signalling server shared by multiple streamers this let one streamer send forged `offer`/`answer`/`iceCandidate` messages to, or disconnect, players belonging to another streamer. These paths now drop messages for players that are not in the streamer's `subscribers` set. SFU connections now register themselves as a subscriber of their upstream streamer so messages destined for the SFU continue to be forwarded.

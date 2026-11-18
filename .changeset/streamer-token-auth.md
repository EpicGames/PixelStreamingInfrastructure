---
'@epicgames-ps/wilbur': minor
---

Add optional `--streamer_token` and `--streamer_token_file` shared-token authentication for the streamer WebSocket listener, mirroring existing player-token behavior. Authentication remains disabled by default, so existing deployments are unaffected.

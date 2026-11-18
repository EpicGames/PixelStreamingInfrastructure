---
'@epicgames-ps/wilbur': patch
---

Redact static TURN credentials in the logged and printed configuration. `--log_config` and the `c` stdin command already hide `turn_secret`, `player_token` and `streamer_token`, but `peer_options` was written out whole, so a static TURN `credential` given through `--peer_options` reached the log file and stdout in plain text. Credential values are now replaced with `<redacted>` at any depth. The options sent to peers are unchanged.

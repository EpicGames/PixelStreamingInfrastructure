---
'@epicgames-ps/wilbur': patch
---

Redact `turn_secret` and `player_token` in the interactive config dump. Pressing `c` with `--stdin` wrote the whole options object to stdout, and a service supervisor routinely redirects stdout to a file — so the dump put a secret on disk just as surely as the `--log_config` dump it was already redacted in.

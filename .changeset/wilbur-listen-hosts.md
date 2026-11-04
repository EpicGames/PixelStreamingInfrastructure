---
'@epicgames-ps/wilbur': minor
---

Add `--streamer_host` and `--sfu_host`, which set the address the streamer and SFU ports listen on, such as 127.0.0.1 when streamers connect from the same machine or through a tunnel. Without them both ports listen on every address, as before.

---
'@epicgames-ps/wilbur': minor
'@epicgames-ps/pixelstreaming-sfu': minor
---

Add optional `--sfu_token` and `--sfu_token_file` to Wilbur, matching `--streamer_token`: an SFU that does not present the token is refused at the HTTP upgrade with 401. The SFU gains `signallingToken` and `signallingTokenFile` (in `config.js` or as `--signallingToken=` / `--signallingTokenFile=`), sent as an `Authorization: Bearer` header and redacted from the config it prints at startup. Authentication remains disabled by default.

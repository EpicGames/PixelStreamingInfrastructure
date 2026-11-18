# @epicgames-ps/wilbur

## 3.2.0

### Minor Changes

- 563fd61: Add `--player_token` (or `--player_token_file`), an optional shared token that a player must present to connect. It is checked with the `playerWsOptions.verifyClient` seam the security guidelines already recommend, so a player that cannot present it is refused during the HTTP upgrade with `401` and never becomes a connection — which is what keeps the config message, and any TURN credential in its peer options, away from it. The token is accepted as a `?token=` query parameter or an `Authorization: Bearer` header, compared over SHA-256 digests so neither its length nor the position of the first difference is observable, removed from the request before the connection is logged, and kept out of `--save`, the `--log_config` dump, the `--stdin` config dump and — when `--player_token_file` is used — the process command line. Each refusal is logged with its source address, since the player port is not covered by the HTTP rate limiter. Streamer and SFU connections are unaffected, and no player connection is refused when no token is supplied. See `Docs/Security-Guidelines.md`.
- 563fd61: Add optional `--rest_api_token` and `--rest_api_token_file`. When set, every request under `/api`, including `/api/api-definition`, must send the token in an `Authorization: Bearer` header or is refused with 401. Without a token the REST API stays open as before, and the server now warns at startup when `--rest_api` is enabled without one. `GET /api/config` no longer returns the configuration objects whole: ICE server usernames and credentials are replaced with `<redacted>`, and it returns only the ports, subscriber limit, keepalive timeout, peer options and protocol version, no longer the HTTP server and WebSocket options. The player and streamer tokens never covered the REST API, so `/api/config` handed out static TURN credentials that `--player_token` exists to protect.
- 563fd61: Add optional `--sfu_token` and `--sfu_token_file` to Wilbur, matching `--streamer_token`: an SFU that does not present the token is refused at the HTTP upgrade with 401. The SFU gains `signallingToken` and `signallingTokenFile` (in `config.js` or as `--signallingToken=` / `--signallingTokenFile=`), sent as an `Authorization: Bearer` header and redacted from the config it prints at startup. Authentication remains disabled by default.
- 563fd61: Add optional `--streamer_token` and `--streamer_token_file` shared-token authentication for the streamer WebSocket listener, mirroring existing player-token behavior. Authentication remains disabled by default, so existing deployments are unaffected.
- 563fd61: Add `--streamer_host` and `--sfu_host`, which set the address the streamer and SFU ports listen on, such as 127.0.0.1 when streamers connect from the same machine or through a tunnel. Without them both ports listen on every address, as before.

### Patch Changes

- 563fd61: Redact `turn_secret` and `player_token` in the interactive config dump. Pressing `c` with `--stdin` wrote the whole options object to stdout, and a service supervisor routinely redirects stdout to a file — so the dump put a secret on disk just as surely as the `--log_config` dump it was already redacted in.

## 3.1.1

### Patch Changes

- c37638b: Bound what the signalling server writes to its log. Every message a player sent was written to the log file whole, and the daily file had no size limit, so a client could make the log grow as fast as it could send. Log text and protocol messages longer than 16 KiB are now cut to that length, with their full length noted, and the log files are limited in size and number: by default 14 files of 100 MB, set with `logMaxSize` and `logMaxFiles` in `InitLogging`, or `--log_max_size` and `--log_max_files` in wilbur. Files are now kept by count rather than for 14 days.
- 7d5bc61: Stop two paths from ending the signalling server. With `--stdin`, the server called `setRawMode` unconditionally, which does not exist when stdin is a pipe or a service, so startup threw. A stdin chunk that named an object property, such as `constructor`, was looked up on the command table and the resulting TypeError ended the process. Both are fixed: raw mode is only set on a terminal, and only the table's own keys are commands. A failed write of the config under `--save` is now logged instead of thrown from the file callback, which also ended the process.
- Updated dependencies [9a43ab9]
- Updated dependencies [c37638b]
- Updated dependencies [e373094]
- Updated dependencies [b52cb35]
    - @epicgames-ps/lib-pixelstreamingsignalling-ue5.8@0.2.1

## 3.1.0

### Minor Changes

- c8cd21a: Allow TURN credentials to be issued per connection rather than shared by every session. `peerOptions` is static, so a credential written there is sent to every peer that ever connects and cannot be changed without a redeploy — the weakness noted in tip 3 of the security guidelines. `IServerConfig.peerOptionsProvider` is consulted once per connecting peer and returns the peer options for that peer, falling back to `peerOptions` if it throws. On top of it the signalling server adds `--turn_secret` (or `--turn_secret_file`) and `--turn_ttl`, which give every `turn:`/`turns:` entry a time limited username and credential in the form coturn's `use-auth-secret` mode expects. Default behaviour is unchanged when no secret is supplied. See `Docs/Security-Guidelines.md`.

### Patch Changes

- e9cd872: Stop an unsubscribed player from crashing the signalling server. When a player sends a message without being subscribed, `sendToStreamer` force-subscribes it to the first available streamer and then forwards through `this.subscribedStreamer!`. `subscribe()` can decline — most commonly because `maxSubscribers` is already reached — and reports that only by leaving `subscribedStreamer` unset, so the non-null assertions throw a TypeError out of a websocket message handler and take the process down, disconnecting every other player. It now checks the subscription took, and disconnects just that player if it did not.
- Updated dependencies [e9cd872]
- Updated dependencies [c8cd21a]
    - @epicgames-ps/lib-pixelstreamingsignalling-ue5.8@0.2.0

## 2.3.0

### Minor Changes

- 3bb3101: Updates to platform_scripts to fix argument passing to Wilbur.
    - Added separator between script parameters and signalling server parameters when using platform scripts
        - From now on, anything after the `--` marker on the command line is passed directly to Wilbur.
        - Parameters before this marker are intended for the scripts. These parameters are validated and unknown parameters will cause an error.
    - Added the new `--peer_options_file` parameter to the signalling server.
        - JSON data is problematic to pass on the command line.
        - This new parameter allows you to use a JSON file as your peer options for the server.
        - Using `--peer_options` is now discouraged.
    - Fixed issue with passing peer_options while using platform scripts.

## 2.2.0

### Minor Changes

- cf8e737: Adds command line options to wilbur to allow for configuring the reverse proxy:

    --reverse-proxy Enables reverse proxy mode. This will
    trust the X-Forwarded-For header.
    (default: false)
    --reverse-proxy-num-proxies <number> Sets the number of proxies to trust.
    This is used to calculate the real
    client IP address. (default: 1)

# @epicgames-ps/wilbur

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

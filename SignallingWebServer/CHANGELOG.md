# @epicgames-ps/wilbur

## 2.5.0

### Minor Changes

- 47cfc6e: Allow TURN credentials to be issued per connection rather than shared by every session. `peerOptions` is static, so a credential written there is sent to every peer that ever connects and cannot be changed without a redeploy — the weakness noted in tip 3 of the security guidelines. `IServerConfig.peerOptionsProvider` is consulted once per connecting peer and returns the peer options for that peer, falling back to `peerOptions` if it throws. On top of it the signalling server adds `--turn_secret` (or `--turn_secret_file`) and `--turn_ttl`, which give every `turn:`/`turns:` entry a time limited username and credential in the form coturn's `use-auth-secret` mode expects. Default behaviour is unchanged when no secret is supplied. See `Docs/Security-Guidelines.md`.

### Patch Changes

- e1b4d03: Stop an unsubscribed player from crashing the signalling server. When a player sends a message without being subscribed, `sendToStreamer` force-subscribes it to the first available streamer and then forwards through `this.subscribedStreamer!`. `subscribe()` can decline — most commonly because `maxSubscribers` is already reached — and reports that only by leaving `subscribedStreamer` unset, so the non-null assertions throw a TypeError out of a websocket message handler and take the process down, disconnecting every other player. It now checks the subscription took, and disconnects just that player if it did not.
- c69198d: Add an optional server-side keepalive that disconnects players whose connection has died without a clean close. Previously `KeepaliveMonitor` was only used on the client, so a player whose socket dropped silently (sleeping laptop, lost Wi-Fi, killed tab) stayed subscribed until the OS TCP keepalive reaped it, which could hold a `maxSubscribers` slot in the meantime. The new `IServerConfig.playerKeepaliveTimeout` controls this; the signalling server exposes it as `--player_keepalive_timeout <milliseconds>` (default 30000, 0 disables).
- Updated dependencies [e1b4d03]
- Updated dependencies [c69198d]
- Updated dependencies [4fcf502]
- Updated dependencies [47cfc6e]
    - @epicgames-ps/lib-pixelstreamingsignalling-ue5.6@0.3.0

## 2.4.1

### Patch Changes

- 7fc2e25: Enforce streamer/player subscription when routing signalling messages. Previously `StreamerConnection.forwardMessage`, `StreamerConnection.onDisconnectPlayerRequest` and `SFUConnection.sendToPlayer` resolved their target via the global player registry without checking that the player was subscribed to the sending streamer/SFU. On a signalling server shared by multiple streamers this let one streamer send forged `offer`/`answer`/`iceCandidate` messages to, or disconnect, players belonging to another streamer. These paths now drop messages for players that are not in the streamer's `subscribers` set. SFU connections now register themselves as a subscriber of their upstream streamer so messages destined for the SFU continue to be forwarded.
- Updated dependencies [7fc2e25]
    - @epicgames-ps/lib-pixelstreamingsignalling-ue5.6@0.2.1

## 2.4.0

### Minor Changes

- c4cb480: Add CORS support to the signalling web server. A new `IWebServerConfig.cors` option registers the `cors` Express middleware before the rate limiter and any route handlers, so that custom frontends hosted on a different origin can call the REST API (`--rest_api`) or any other route mounted on the app. Wilbur exposes this through a `--cors` CLI flag (default off) plus `--cors_allowed_origins`, `--cors_allowed_methods`, `--cors_allowed_headers`, and `--cors_credentials`. All four sub-options accept comma-separated values and read matching `cors*` keys from `config.json`. When `--cors` is set without an explicit origin list, all origins are allowed.

### Patch Changes

- 7a78d64: Make `npm run lint` work regardless of the directory it's invoked from. Each workspace's `eslint.config.mjs` now pins `parserOptions.tsconfigRootDir` to `import.meta.dirname`, so `parserOptions.project` resolves relative to the config file's own directory rather than whichever CWD `typescript-eslint` happens to pick by default. Previously the six workspace configs prefixed `project` with the workspace directory (e.g. `'Common/tsconfig.cjs.json'`), which only worked under one specific `typescript-eslint` version's resolution behavior and broke CI when run from within the workspace.
- ceaff56: Make the REST API reachable when Wilbur is started with `--rest_api` but without `--serve`. Previously the Express app that hosts the `/api/*` routes was only bound to an HTTP listener inside the `serve` branch, so with `--serve=false --rest_api=true` the listener never started and requests were answered by the WebSocket upgrade handler on the player port (`426 Upgrade Required`). The HTTP listener now starts whenever `rest_api` or `serve` is set. Static file serving and the homepage route are gated by a new `IWebServerConfig.serveStatic` flag (the port listener runs independently of static serving), and the rate limiter is registered before any route handlers so the homepage and any downstream-registered routes are all rate-limited. Wilbur logs at startup which mode it is running in.
- Updated dependencies [c4cb480]
- Updated dependencies [d72dc6a]
- Updated dependencies [7a78d64]
- Updated dependencies [ceaff56]
    - @epicgames-ps/lib-pixelstreamingsignalling-ue5.6@0.2.0

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

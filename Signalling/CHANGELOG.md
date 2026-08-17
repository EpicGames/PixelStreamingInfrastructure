# @epicgames-ps/lib-pixelstreamingsignalling-ue5.6

## 0.5.0

### Minor Changes

- 818a5d1: Allow TURN credentials to be issued per connection rather than shared by every session. `peerOptions` is static, so a credential written there is sent to every peer that ever connects and cannot be changed without a redeploy — the weakness noted in tip 3 of the security guidelines. `IServerConfig.peerOptionsProvider` is consulted once per connecting peer and returns the peer options for that peer, falling back to `peerOptions` if it throws. On top of it the signalling server adds `--turn_secret` (or `--turn_secret_file`) and `--turn_ttl`, which give every `turn:`/`turns:` entry a time limited username and credential in the form coturn's `use-auth-secret` mode expects. Default behaviour is unchanged when no secret is supplied. See `Docs/Security-Guidelines.md`.

### Patch Changes

- 65793ed: Stop an unsubscribed player from crashing the signalling server. When a player sends a message without being subscribed, `sendToStreamer` force-subscribes it to the first available streamer and then forwards through `this.subscribedStreamer!`. `subscribe()` can decline — most commonly because `maxSubscribers` is already reached — and reports that only by leaving `subscribedStreamer` unset, so the non-null assertions throw a TypeError out of a websocket message handler and take the process down, disconnecting every other player. It now checks the subscription took, and disconnects just that player if it did not.
- 1b9c43c: Add an optional server-side keepalive that disconnects players whose connection has died without a clean close. Previously `KeepaliveMonitor` was only used on the client, so a player whose socket dropped silently (sleeping laptop, lost Wi-Fi, killed tab) stayed subscribed until the OS TCP keepalive reaped it, which could hold a `maxSubscribers` slot in the meantime. The new `IServerConfig.playerKeepaliveTimeout` controls this; the signalling server exposes it as `--player_keepalive_timeout <milliseconds>` (default 30000, 0 disables).

## 0.4.0

### Minor Changes

- 568133c: Add extension points so consumers can plug in their own authentication and authorization without the library shipping an auth scheme. Connections now expose the HTTP upgrade `request` (`IStreamer.request` / `IPlayer.request`) so identity attached during a `verifyClient` check survives to later decisions, and `IServerConfig.authorizeStreamerId` lets a consumer authorize, override (e.g. namespace per tenant), or reject the id a streamer registers as — the seam for preventing streamer-id squatting. Default behaviour is unchanged when these are not supplied. See `Docs/Security-Guidelines.md`.

### Patch Changes

- 1d54751: Enforce streamer/player subscription when routing signalling messages. Previously `StreamerConnection.forwardMessage`, `StreamerConnection.onDisconnectPlayerRequest` and `SFUConnection.sendToPlayer` resolved their target via the global player registry without checking that the player was subscribed to the sending streamer/SFU. On a signalling server shared by multiple streamers this let one streamer send forged `offer`/`answer`/`iceCandidate` messages to, or disconnect, players belonging to another streamer. These paths now drop messages for players that are not in the streamer's `subscribers` set. SFU connections now register themselves as a subscriber of their upstream streamer so messages destined for the SFU continue to be forwarded.

## 0.3.0

### Minor Changes

- b0550d4: Add CORS support to the signalling web server. A new `IWebServerConfig.cors` option registers the `cors` Express middleware before the rate limiter and any route handlers, so that custom frontends hosted on a different origin can call the REST API (`--rest_api`) or any other route mounted on the app. Wilbur exposes this through a `--cors` CLI flag (default off) plus `--cors_allowed_origins`, `--cors_allowed_methods`, `--cors_allowed_headers`, and `--cors_credentials`. All four sub-options accept comma-separated values and read matching `cors*` keys from `config.json`. When `--cors` is set without an explicit origin list, all origins are allowed.
- 9308aa4: Make the REST API reachable when Wilbur is started with `--rest_api` but without `--serve`. Previously the Express app that hosts the `/api/*` routes was only bound to an HTTP listener inside the `serve` branch, so with `--serve=false --rest_api=true` the listener never started and requests were answered by the WebSocket upgrade handler on the player port (`426 Upgrade Required`). The HTTP listener now starts whenever `rest_api` or `serve` is set. Static file serving and the homepage route are gated by a new `IWebServerConfig.serveStatic` flag (the port listener runs independently of static serving), and the rate limiter is registered before any route handlers so the homepage and any downstream-registered routes are all rate-limited. Wilbur logs at startup which mode it is running in.

### Patch Changes

- c3e46a8: - Addressing security issues raised by dependabot. (glob, js-yaml, playwright)
    - Added lint npm script to the root project. Running `npm run lint` will now run linting over all packages.
- 5696f2e: Make `npm run lint` work regardless of the directory it's invoked from. Each workspace's `eslint.config.mjs` now pins `parserOptions.tsconfigRootDir` to `import.meta.dirname`, so `parserOptions.project` resolves relative to the config file's own directory rather than whichever CWD `typescript-eslint` happens to pick by default. Previously the six workspace configs prefixed `project` with the workspace directory (e.g. `'Common/tsconfig.cjs.json'`), which only worked under one specific `typescript-eslint` version's resolution behavior and broke CI when run from within the workspace.
- Updated dependencies [c3e46a8]
- Updated dependencies [5696f2e]
    - @epicgames-ps/lib-pixelstreamingcommon-ue5.7@0.1.5

## 0.2.1

### Patch Changes

- 812a419: - Addressing security issues raised by dependabot. (glob, js-yaml, playwright)
    - Added lint npm script to the root project. Running `npm run lint` will now run linting over all packages.
- Updated dependencies [812a419]
    - @epicgames-ps/lib-pixelstreamingcommon-ue5.7@0.1.4

## 0.2.0

### Minor Changes

- 05bebea: Add: Ability to access player id on the frontend.
  QoL: Remove player id stripping from the signalling library.

    It is useful to be able to use the player id as a unique identifier that is common between UE side stats and frontend side stats; however, the player id is not actually exposed to TS/JS because the SS strips it out of signalling messages.

    This change is a backport of "Exposed playerid" (#728)

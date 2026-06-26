# @epicgames-ps/lib-pixelstreamingsignalling-ue5.6

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

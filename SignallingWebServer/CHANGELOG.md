# @epicgames-ps/wilbur

## 2.3.0

### Minor Changes

- 5331f21: Add CORS support to the signalling web server. A new `IWebServerConfig.cors` option registers the `cors` Express middleware before the rate limiter and any route handlers, so that custom frontends hosted on a different origin can call the REST API (`--rest_api`) or any other route mounted on the app. Wilbur exposes this through a `--cors` CLI flag (default off) plus `--cors_allowed_origins`, `--cors_allowed_methods`, `--cors_allowed_headers`, and `--cors_credentials`. All four sub-options accept comma-separated values and read matching `cors*` keys from `config.json`. When `--cors` is set without an explicit origin list, all origins are allowed.

### Patch Changes

- e948750: Make `npm run lint` work regardless of the directory it's invoked from. Each workspace's `eslint.config.mjs` now pins `parserOptions.tsconfigRootDir` to `import.meta.dirname`, so `parserOptions.project` resolves relative to the config file's own directory rather than whichever CWD `typescript-eslint` happens to pick by default. Previously the six workspace configs prefixed `project` with the workspace directory (e.g. `'Common/tsconfig.cjs.json'`), which only worked under one specific `typescript-eslint` version's resolution behavior and broke CI when run from within the workspace.
- 988a78c: Make the REST API reachable when Wilbur is started with `--rest_api` but without `--serve`. Previously the Express app that hosts the `/api/*` routes was only bound to an HTTP listener inside the `serve` branch, so with `--serve=false --rest_api=true` the listener never started and requests were answered by the WebSocket upgrade handler on the player port (`426 Upgrade Required`). The HTTP listener now starts whenever `rest_api` or `serve` is set. Static file serving and the homepage route are gated by a new `IWebServerConfig.serveStatic` flag (the port listener runs independently of static serving), and the rate limiter is registered before any route handlers so the homepage and any downstream-registered routes are all rate-limited. Wilbur logs at startup which mode it is running in.
- Updated dependencies [5331f21]
- Updated dependencies [b16fd54]
- Updated dependencies [e948750]
- Updated dependencies [988a78c]
    - @epicgames-ps/lib-pixelstreamingsignalling-ue5.5@3.1.0

## 2.2.0

### Minor Changes

- c85a4c9: Adds command line options to wilbur to allow for configuring the reverse proxy:

    --reverse-proxy Enables reverse proxy mode. This will
    trust the X-Forwarded-For header.
    (default: false)
    --reverse-proxy-num-proxies <number> Sets the number of proxies to trust.
    This is used to calculate the real
    client IP address. (default: 1)

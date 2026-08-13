# Security Guidelines

To enhance the security of your Pixel Streaming deployments, it is wise to implement additional measures for protection. This documentation page aims to provide you with valuable recommendations and suggestions to bolster the security of your deployments. By following these guidelines, you can significantly enhance the overall security posture and safeguard your Pixel Streaming environment effectively.

## Tips to Improve Security
Please note that implementing the following suggestions may introduce additional setup complexity and could result in increased latency.

1. **Isolate Unreal Engine Instance:** Avoid deploying the Unreal Engine instance on a cloud machine with a public IP. Instead, only allowlist the necessary servers, such as the signalling and TURN servers, to communicate with the UE instance.

2. **Route Media Traffic through TURN Server:** For enhanced security, enforce routing all media traffic through the TURN server. By doing so, only the TURN server and signalling server will be permitted to communicate with the UE instance. Keep in mind that this approach may introduce some additional latency.

3. **Secure TURN Server with User Credentials:** Configure the TURN server with a user database and assign unique credentials to each user. This additional security layer prevents unauthorized access to the relay. By default, Pixel Streaming employs the same TURN credentials for every session, which may simplify access for potential attackers. See [Issuing per-connection TURN credentials](#issuing-per-connection-turn-credentials) for `--turn_secret`, which gives each connection its own time limited credentials instead.

4. **Avoid Storing Important Credentials in the UE Container:** As a precautionary measure, refrain from storing any critical credentials or sensitive information within the UE container. This practice helps maintain a higher level of security.

5. **Disable Pixel Streaming Console Commands:** Pixel Streaming ensures that all media traffic is encrypted end-to-end, guaranteeing secure communication. However, note that Pixel Streaming allows users to send commands to the UE instance if enabled. To eliminate this possibility, launch without the `-AllowPixelStreamingCommands` flag.

6. **Separate TURN and Signalling Servers:** It is recommended to avoid colocating the TURN and signalling servers with the UE instance on the same IP or virtual machine (VM). This enables you to configure separate ingress/egress security policies for each server, allowing flexibility in defining the desired level of strictness or looseness. For example, the TURN server can have more relaxed policies while the UE instance can have stricter ones.

By following these tips, you can enhance the security of your Pixel Streaming setup and mitigate potential risks.

## Authenticating and authorizing connections

The signalling server **intentionally ships no authentication beyond an optional shared token on the player port** ([below](#a-shared-token-on-the-player-port)) — no identity, no sessions, no login flow. The streamer and SFU ports accept any connection, and any deployment is expected to bring its own authentication and authorization appropriate to its environment. In particular, the streamer port is designed to sit on a trusted/private network and should never be exposed directly to the internet without a front door of your own.

To make it practical to add your own auth without forking, the `Signalling` library exposes a few seams. None of these provide credentials or a login flow — they are hooks where *your* policy plugs in.

### Authenticating at the WebSocket upgrade

The per-listener options (`streamerWsOptions`, `playerWsOptions`, `sfuWsOptions` on `IServerConfig`) are passed straight through to the underlying [`ws`](https://github.com/websockets/ws) server, so you can supply a `verifyClient` callback to accept or reject a connection during the HTTP upgrade — **before** the server sends its config message (which includes peer/TURN options). This is the recommended place to authenticate, because it runs before any data is sent to the peer.

```ts
const server = new SignallingServer({
    streamerPort: 8888,
    playerPort: 80,
    peerOptions: { /* ... */ },
    streamerWsOptions: {
        verifyClient: (info, cb) => {
            const ok = isValidToken(info.req); // your check: header, query string, mTLS, etc.
            if (ok) {
                // Stamp the authenticated identity onto the request so it can be recovered later.
                (info.req as any).identity = resolveIdentity(info.req);
            }
            cb(ok, 401, 'unauthorized');
        }
    }
});
```

#### A shared token on the player port

The signalling server application implements the simplest useful case on top of that hook, for a deployment that needs a door rather than an identity — a kiosk, an internal demo, a staging environment that should not be open to whoever finds the address.

Give it `--player_token <token>` (or `--player_token_file`) and every player must present that token to connect, either as a `?token=` query parameter or an `Authorization: Bearer` header. A player that does not is refused at the HTTP upgrade with `401`, so it never becomes a connection and is never sent the config message. Streamer and SFU connections are unaffected.

```
wilbur --player_token 8f14e45f-ea8d-4b3f-b6de-1cd97b4e2d21
```

The token has to reach the **signalling WebSocket**, which is not the same thing as the page URL. The bundled frontend builds its signalling URL from the page's protocol, hostname and port and nothing else, so putting `?token=` on the page address does not do it — the page loads normally and then the stream silently never starts. Give it the whole signalling URL instead, with the frontend's `ss` setting:

```
https://your-server/?ss=wss%3A%2F%2Fyour-server%2F%3Ftoken%3D8f14e45f-ea8d-4b3f-b6de-1cd97b4e2d21
```

A deployment serving its own page can do better than that by constructing the URL itself, which is what most will want:

```ts
const stream = new PixelStreaming(config); // config with SignallingServerUrl already set to
                                           // `wss://your-server/?token=${yourToken}`
```

It is **one shared token, the same for everybody** — it does not identify a user, it does not expire, and revoking it means restarting the server with a new one. It answers "may this connection exist at all", which is the question a `--turn_secret` deliberately does not answer. If you need sessions, per-user revocation, or an identity attached to a connection, supply your own `verifyClient` instead; the flag exists so that a deployment which genuinely only needs a door does not have to fork the reference server to get one.

Four things to know before relying on it:

- **It gates one of three doors.** Streamer and SFU connections are also sent the config message, and are also unauthenticated. Gating players while leaving the streamer port reachable from the internet moves the problem rather than solving it — firewall those ports as tip 1 describes.
- **Nothing rate limits guessing.** The `express-rate-limit` middleware only sees HTTP requests, and a WebSocket upgrade is a separate event it never sees, so a wrong token costs an attacker one round trip. Each refusal is logged with its source address, and the server warns at startup about a token short enough to matter. Use a long random one — a GUID is a good default.
- **A token in a query string is visible to anything that logs URLs** — a reverse proxy's access log, browser history, and the frontend's own console line naming the URL it is connecting to — and it is the only option a browser has, since a WebSocket opened from a page cannot set headers. The server removes it from its own connection log, but it cannot reach anything in front of it. Serve over `https`/`wss`, and prefer the `Authorization` header wherever the client is not a browser.
- **It is compared byte for byte.** A `+` in a query string means a space, and two Unicode spellings of the same text are different tokens. A GUID avoids both.

If `--rest_api` is enabled, note that `GET /api/config` returns the peer options — including any static TURN credentials in them — to any HTTP caller, with no token required. That endpoint is unauthenticated by design and predates this flag; gate it with your own middleware, or use `--turn_secret` so the only credentials it can disclose are ones no peer was issued.

### Recovering the authenticated identity

Each connection exposes the HTTP upgrade `request` that opened it (`streamer.request` / `player.request`). Anything your `verifyClient` (or other front door) attached to the request is available there, so later authorization decisions can use the identity established at connect time.

### Authorizing the streamer id (preventing id squatting)

By default, when a streamer identifies itself the registry accepts the requested id and appends a numeric suffix if that id is already taken. On a shared, unauthenticated streamer port this allows *id squatting*: a connection can claim an id before the legitimate streamer connects, and the legitimate streamer is then silently renamed.

`IServerConfig.authorizeStreamerId` lets you own that decision. It is called with the requesting `streamer` (use `streamer.request` for identity), the `requestedId`, the `sanitizedId` the registry would otherwise commit, and whether the requested id `collided`. Return the id to commit (the sanitized id to accept the default, or any other unique id to override — e.g. to namespace per tenant), or `null` to reject the streamer and disconnect it.

```ts
const server = new SignallingServer({
    // ...
    authorizeStreamerId: ({ streamer, requestedId }) => {
        const identity = (streamer.request as any)?.identity;
        if (!identity) return null;                 // reject unauthenticated streamers
        if (!identity.mayUseId(requestedId)) return null; // enforce ownership
        return `${identity.tenant}:${requestedId}`; // namespace so tenants can't collide
    }
});
```

### Issuing per-connection TURN credentials

`peerOptions` is static: whatever it contains is sent to every peer that ever connects, so a TURN username and credential written there is shared by every session and cannot be changed without redeploying. That is the weakness described in tip 3 above.

`IServerConfig.peerOptionsProvider` is called once per connecting peer and returns the peer options to send to that peer, so credentials can be minted per connection instead. It receives the `peerType` (`streamer`, `player` or `sfu`) and the `peerId`.

A provider that throws falls back to the static `peerOptions`, so a failing credential service cannot leave a peer waiting for a config message that never arrives. Note what that means if you are migrating: while the old static credentials are still written in `peerOptions`, a failing provider reissues exactly the credential you added the provider to stop issuing. Remove them from `peerOptions` once the provider is in place, and the fallback becomes a peer that cannot relay rather than one that relays with a shared credential.

```ts
const server = new SignallingServer({
    // ...
    peerOptionsProvider: ({ peerType, peerId }) => buildIceConfigFor(peerType, peerId)
});
```

The signalling server application implements the common case on top of this hook. Give it `--turn_secret` (or `--turn_secret_file`) matching `static-auth-secret` on a TURN server running coturn's `use-auth-secret` mode, and every `turn:` or `turns:` entry in your peer options is given a freshly minted username and credential per connection. `--turn_ttl` controls how long each is valid, defaulting to 86400 seconds.

Three things are worth understanding before choosing a TTL:

- **Only players are given a limited credential.** A streamer or SFU receives its configuration once, when it connects, and there is no message that replaces it — so an expiry there would set a deadline on the stream rather than on an attacker. Those peers are issued a credential that outlives any plausible uptime. The exposure this feature exists to close is a credential shared by every browser that loads a page; a streamer is deployed by the operator on a host they control. If you want it rotated too, use `peerOptionsProvider` directly.
- **A TTL may gate only the allocation, not the session.** Some TURN servers check the credential when a relay is allocated and not again, so a session already running continues past the expiry; others may re-check. Check your server before assuming a short TTL cannot interrupt a long call — with coturn, allocations have been reported to survive it.
- **It does not decide who may obtain a credential.** Anything that can open a player WebSocket is sent one, so a short TTL limits how long a leaked credential stays useful, not who is issued one. Use the WebSocket upgrade hook above for that — [`--player_token`](#a-shared-token-on-the-player-port) is the built-in way, and the server warns at startup when it is issuing TURN credentials without one.

These hooks are deliberately policy-free: the library gives you the connection, its request, and the id it is asking for — what counts as a valid token, a permitted id or a valid credential is entirely up to your deployment.
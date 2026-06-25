# Security Guidelines

To enhance the security of your Pixel Streaming deployments, it is wise to implement additional measures for protection. This documentation page aims to provide you with valuable recommendations and suggestions to bolster the security of your deployments. By following these guidelines, you can significantly enhance the overall security posture and safeguard your Pixel Streaming environment effectively.

## Tips to Improve Security
Please note that implementing the following suggestions may introduce additional setup complexity and could result in increased latency.

1. **Isolate Unreal Engine Instance:** Avoid deploying the Unreal Engine instance on a cloud machine with a public IP. Instead, only allowlist the necessary servers, such as the signalling and TURN servers, to communicate with the UE instance.

2. **Route Media Traffic through TURN Server:** For enhanced security, enforce routing all media traffic through the TURN server. By doing so, only the TURN server and signalling server will be permitted to communicate with the UE instance. Keep in mind that this approach may introduce some additional latency.

3. **Secure TURN Server with User Credentials:** Configure the TURN server with a user database and assign unique credentials to each user. This additional security layer prevents unauthorized access to the relay. By default, Pixel Streaming employs the same TURN credentials for every session, which may simplify access for potential attackers.

4. **Avoid Storing Important Credentials in the UE Container:** As a precautionary measure, refrain from storing any critical credentials or sensitive information within the UE container. This practice helps maintain a higher level of security.

5. **Disable Pixel Streaming Console Commands:** Pixel Streaming ensures that all media traffic is encrypted end-to-end, guaranteeing secure communication. However, note that Pixel Streaming allows users to send commands to the UE instance if enabled. To eliminate this possibility, launch without the `-AllowPixelStreamingCommands` flag.

6. **Separate TURN and Signalling Servers:** It is recommended to avoid colocating the TURN and signalling servers with the UE instance on the same IP or virtual machine (VM). This enables you to configure separate ingress/egress security policies for each server, allowing flexibility in defining the desired level of strictness or looseness. For example, the TURN server can have more relaxed policies while the UE instance can have stricter ones.

By following these tips, you can enhance the security of your Pixel Streaming setup and mitigate potential risks.

## Authenticating and authorizing connections

The signalling server **intentionally ships no authentication**. The streamer, player and SFU ports accept any connection, and any deployment is expected to bring its own authentication and authorization appropriate to its environment. In particular, the streamer port is designed to sit on a trusted/private network and should never be exposed directly to the internet without a front door of your own.

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

These hooks are deliberately policy-free: the library gives you the connection, its request, and the id it is asking for — what counts as a valid token or a permitted id is entirely up to your deployment.
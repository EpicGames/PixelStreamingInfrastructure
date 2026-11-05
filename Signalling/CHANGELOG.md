# @epicgames-ps/lib-pixelstreamingsignalling-ue5.6

## 0.2.1

### Patch Changes

- 9a43ab9: Leave the previous streamer when an SFU subscribes to another. `SFUConnection.subscribe` overwrote `subscribedStreamer` without unsubscribing from the old streamer, so the old streamer kept forwarding to the SFU and kept the SFU's listeners. When that old streamer later disconnected, it detached the SFU from the streamer it was actually on and dropped the SFU's players. `PlayerConnection` already unsubscribes first; the SFU now does the same.
- b52cb35: Limit websocket messages on the streamer, player and SFU ports to 1 MiB. ws accepts up to 100 MiB in one message by default, and signalling messages are a few kilobytes. A connection that sends more is closed with code 1009. Setting `maxPayload` in `streamerWsOptions`, `playerWsOptions` or `sfuWsOptions` overrides the limit for that port.

## 0.2.0

### Minor Changes

- c8cd21a: Allow TURN credentials to be issued per connection rather than shared by every session. `peerOptions` is static, so a credential written there is sent to every peer that ever connects and cannot be changed without a redeploy — the weakness noted in tip 3 of the security guidelines. `IServerConfig.peerOptionsProvider` is consulted once per connecting peer and returns the peer options for that peer, falling back to `peerOptions` if it throws. On top of it the signalling server adds `--turn_secret` (or `--turn_secret_file`) and `--turn_ttl`, which give every `turn:`/`turns:` entry a time limited username and credential in the form coturn's `use-auth-secret` mode expects. Default behaviour is unchanged when no secret is supplied. See `Docs/Security-Guidelines.md`.

### Patch Changes

- e9cd872: Stop an unsubscribed player from crashing the signalling server. When a player sends a message without being subscribed, `sendToStreamer` force-subscribes it to the first available streamer and then forwards through `this.subscribedStreamer!`. `subscribe()` can decline — most commonly because `maxSubscribers` is already reached — and reports that only by leaving `subscribedStreamer` unset, so the non-null assertions throw a TypeError out of a websocket message handler and take the process down, disconnecting every other player. It now checks the subscription took, and disconnects just that player if it did not.

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

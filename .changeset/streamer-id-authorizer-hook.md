---
'@epicgames-ps/lib-pixelstreamingsignalling-ue5.7': minor
---

Add extension points so consumers can plug in their own authentication and authorization without the library shipping an auth scheme. Connections now expose the HTTP upgrade `request` (`IStreamer.request` / `IPlayer.request`) so identity attached during a `verifyClient` check survives to later decisions, and `IServerConfig.authorizeStreamerId` lets a consumer authorize, override (e.g. namespace per tenant), or reject the id a streamer registers as — the seam for preventing streamer-id squatting. Default behaviour is unchanged when these are not supplied. See `Docs/Security-Guidelines.md`.

---
'@epicgames-ps/lib-pixelstreamingsignalling-ue5.7': patch
'@epicgames-ps/wilbur': patch
---

Add an optional server-side keepalive that disconnects players whose connection has died without a clean close. Previously `KeepaliveMonitor` was only used on the client, so a player whose socket dropped silently (sleeping laptop, lost Wi-Fi, killed tab) stayed subscribed until the OS TCP keepalive reaped it, which could hold a `maxSubscribers` slot in the meantime. The new `IServerConfig.playerKeepaliveTimeout` controls this; the signalling server exposes it as `--player_keepalive_timeout <milliseconds>` (default 30000, 0 disables).

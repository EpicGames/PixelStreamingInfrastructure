---
"@epicgames-ps/lib-pixelstreamingfrontend-ue5.8": patch
---

Cancel the pending auto-reconnect and list-streamers retry timers when the signalling connection is closed or a new one is started. The reconnect timer used to run regardless of what happened in the meantime, so a disconnect or a Connect click made within the two-second reconnect delay could be undone by the stale timer, which then opened a new connection.

---
'@epicgames-ps/lib-pixelstreamingcommon-ue5.8': patch
---

Stop the keepalive monitor once it has timed out. On a timeout the monitor called `onTimeout` and carried on, so its interval kept running and a consumer that did not close the transport was called again on every tick. The monitor now stops before calling `onTimeout`, so the callback fires once. Consumers that close the transport on timeout, as the signalling server and the browser player both do, see no change.

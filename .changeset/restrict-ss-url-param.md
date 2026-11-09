---
'@epicgames-ps/lib-pixelstreamingfrontend-ue5.7': patch
---

Only accept the `ss` (signalling server url) URL parameter when it is a ws: or wss: url on the page's own hostname, so a crafted link can no longer connect a viewer to another server. A deployment whose signalling server is on a different host can allow it with the new `allowedSignallingServerHosts` Config option. Urls set through `initialSettings` or in code are not affected.

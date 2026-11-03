---
'@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.7': patch
---

Escape the streamer id, disconnect reason and subscribe failure message before showing them in overlays, and set settings dropdown options as text, so a crafted `StreamerId` URL parameter can no longer inject HTML into the player page.

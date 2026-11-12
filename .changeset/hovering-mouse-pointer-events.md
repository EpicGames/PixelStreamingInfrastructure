---
'@epicgames-ps/lib-pixelstreamingfrontend-ue5.8': patch
---

fix(frontend): track hovering mouse drags with pointer events and `setPointerCapture`, so moves and releases keep arriving when the cursor leaves the browser window. Held button chords are now sent as paired MouseDown/MouseUp messages, and cancelled or uncaptured pointers release their buttons. Closes #899.

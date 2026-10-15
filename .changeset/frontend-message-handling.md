---
"@epicgames-ps/lib-pixelstreamingfrontend-ue5.8": patch
---

A data channel message with an unknown type or a malformed payload is now logged and dropped, instead of throwing out of the data channel's `onmessage` handler. A response listener that throws no longer stops the later listeners from receiving the same message. Re-enabling video after a freeze frame no longer throws when no stream is attached.

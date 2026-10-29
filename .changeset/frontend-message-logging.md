---
"@epicgames-ps/lib-pixelstreamingfrontend-ue5.8": patch
---

Cheaper message logging and freeze-frame assembly. Message log lines now show the length and type of a message instead of every byte, so the log text changes, but the behaviour does not. Freeze-frame chunks are joined once rather than reallocated for every chunk, and the base64 encoding is built in slices instead of one string concatenation per byte. The image produced is unchanged.

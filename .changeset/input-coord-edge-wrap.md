---
'@epicgames-ps/lib-pixelstreamingfrontend-ue5.8': patch
---

Fix mouse and touch input at the right or bottom edge of the video being sent as 0. 
The edge normalized to 65536, which does not fit in the uint16 these coordinates are sent as, so the streamer received the opposite edge. 
Coordinates are now clamped to 65535.

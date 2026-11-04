---
"@epicgames-ps/lib-pixelstreamingfrontend-ue5.8": patch
---

The end-to-end latency on a latency test result now adds all three terms: the frame display delta, the network latency and the capture-to-send time. The previous expression used a comma operator, so only the capture-to-send time was kept and the other two were dropped.

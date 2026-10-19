---
"@epicgames-ps/lib-pixelstreamingfrontend-ue5.8": patch
---

Stop negotiating VP8 when the preferred H264 profile isn't offered by the streamer. The default preferred codec is the browser's first H264 profile (e.g. `42001f` on Chrome), chosen before the offer arrives; if the streamer only offered a different profile (e.g. `42e01f`), the preference matched nothing and the browser fell back to its own codec order, which starts with VP8. Codecs are now matched on their identifying parameters (H264 profile and packetization mode; VP9/AV1/H265 profile) rather than exact fmtp strings or names, the preferred codec is resolved to the closest one the streamer offered, and if none is offered the streamer's codec order is used instead of the browser's.

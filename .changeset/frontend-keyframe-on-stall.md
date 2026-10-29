---
'@epicgames-ps/lib-pixelstreamingfrontend-ue5.8': minor
'@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.8': patch
---

Add the `RequestKeyframeOnStall` flag, off by default. When it is on, the frontend watches the video receiver and asks the streamer for a keyframe when video data keeps arriving but no frame can be decoded for three round trips (at least 400 ms, at most 1.5 s), instead of waiting for the browser's own request after about three seconds. Requests are at least 1.5 s apart. These requests do not reset the AFK timer, and `SendMessageController.sendMessageToStreamer` and `DataChannelSender.sendData` take an optional argument to send any other message that way.

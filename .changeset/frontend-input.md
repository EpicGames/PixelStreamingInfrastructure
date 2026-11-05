---
"@epicgames-ps/lib-pixelstreamingfrontend-ue5.8": patch
---

Input controller fixes. Locking the mouse no longer hangs the page when the video element has no size, because the pointer wrap is skipped for a zero-sized axis. A cancelled touch (`touchcancel`) is released the same way a touch end is, so the streamer no longer keeps that finger down. A mouse-up sent when the pointer leaves the video with a button held is translated once instead of twice. Held keys are tracked without growing on auto-repeat and are removed on key up. With several gamepads, disconnecting one no longer stops the others from being read, and connecting a pad no longer starts a duplicate update loop.

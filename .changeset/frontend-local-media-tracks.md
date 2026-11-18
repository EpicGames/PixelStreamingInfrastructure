---
"@epicgames-ps/lib-pixelstreamingfrontend-ue5.8": patch
---

Release the browser's camera and microphone when the peer connection is torn down. `RTCPeerConnection.close()` does not stop the tracks obtained from `getUserMedia`, so every reconnect left the previous capture running and the devices stayed in use. The local sender tracks are now stopped before the connection is closed. A refused or missing camera no longer removes the microphone as well: a rejected `getUserMedia` falls back to receive-only for that device and the rest of the setup continues. Rejected `setRemoteDescription` and `getStats` promises are logged instead of left unhandled.

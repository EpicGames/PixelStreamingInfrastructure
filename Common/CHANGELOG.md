# @epicgames-ps/lib-pixelstreamingcommon-ue5.6

## 0.1.1

### Patch Changes

- e373094: Stop malformed messages from crashing the signalling server. A message whose JSON is `null` threw from the protocol's message handler, and since that handler runs inside the websocket's message event, any client could take the process down with one frame. Such a message is now rejected and logged, like unparseable JSON. A streamer's `disconnectPlayer` with a reason over 123 bytes, or one that is not a string, made `ws` throw in the same way; the reason is now dropped and the player is still disconnected. A non-string endpoint id from a streamer was stored as its id and broke the next streamer registration; it is now treated as no id.

## 0.1.4

### Patch Changes

- 812a419: - Addressing security issues raised by dependabot. (glob, js-yaml, playwright)
    - Added lint npm script to the root project. Running `npm run lint` will now run linting over all packages.

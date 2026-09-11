# @epicgames-ps/pixelstreaming-sfu

## 1.1.2

### Patch Changes

- 9aa18d0: Fix two bugs that stopped the SFU streaming until it was restarted.

    A player that connected while no streamer was present is never added to the `peers` map, so
    `peers.get()` returned `undefined` when it disconnected. The guards in `onPeerDisconnected` and
    `onLayerPreference` tested `!== null`, which `undefined` passes, and the SFU crashed. Both now use
    the `if (peer)` form used elsewhere in the file.

    The SFU also only rescheduled its `listStreamers` poll when it still had a streamer. If the
    streamer dropped before sending its offer, nothing rescheduled the poll and the SFU sat idle,
    looking healthy, until it was restarted. The poll is now scheduled on every streamer disconnect,
    there is only ever one pending, and it is skipped when the signalling connection is down.

## 1.1.1

### Patch Changes

- 514511a: Fix: SFU crashing due to \_sctpStreamIds being null. Code using this member has been removed as the `getNextSctpStreamId()` function provided by MediaSoup provides the same functionality.

## 1.1.0

### Minor Changes

- 9627f8c: No longer using custom prebuilt mediasoup binaries and instead using the provided binaries from mediasoup.

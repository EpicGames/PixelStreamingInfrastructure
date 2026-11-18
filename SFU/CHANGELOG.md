# @epicgames-ps/pixelstreaming-sfu

## 1.3.0

### Minor Changes

- 563fd61: Add optional `--sfu_token` and `--sfu_token_file` to Wilbur, matching `--streamer_token`: an SFU that does not present the token is refused at the HTTP upgrade with 401. The SFU gains `signallingToken` and `signallingTokenFile` (in `config.js` or as `--signallingToken=` / `--signallingTokenFile=`), sent as an `Authorization: Bearer` header and redacted from the config it prints at startup. Authentication remains disabled by default.

### Patch Changes

- bdcc3b2: Fix simulcast layer selection for Pixel Streaming 2 streamers and Preferred Quality for the original plugin (#1191). mediasoup expects simulcast layers smallest first, but Pixel Streaming 2 sends them largest first, so new peers got no video until the largest layer fit their bandwidth, and could not fall back to a smaller one. The SFU now hands Pixel Streaming 2's layers (recognised by the rid `simulcast0`) to mediasoup smallest first when the streamer offers RTX, and maps each peer's Preferred Quality so "High" is the largest layer for both plugins; with the original plugin, "High" previously gave the smallest. On UE 5.8, keep RTX in the streamer's offer by setting `PixelStreaming2.WebRTC.CodecPreferences=` (empty) under `[SystemSettings]` in the project's `DefaultEngine.ini`; without RTX the SFU keeps the streamer's order and logs a warning.

## 1.2.0

### Minor Changes

- e54cf12: Upgrade mediasoup from 3.15.5 to 3.31.0 (#1147). 3.15.5 has no prebuilt worker for Linux kernel 7, so installing the SFU on a kernel 7 host compiled the worker from source; 3.31.0 ships kernel 6 and kernel 7 prebuilts. Hosts on kernel 5 (Debian 11, Amazon Linux 2, Ubuntu 22.04 on its original kernel) no longer have a prebuilt and now compile the worker, and the kernel 7 prebuilt needs glibc 2.38 or newer. mediasoup is held below 3.32, whose new bandwidth estimation drops Firefox viewers to no video layer. The SFU now reserves data channel SCTP stream ids with mediasoup's `allocateSctpStreamId()`, as `getNextSctpStreamId()` no longer exists, and exits on SIGINT/SIGTERM itself, because mediasoup now handles those signals to close its worker and would otherwise leave the SFU running without one.

### Patch Changes

- Updated dependencies [e54cf12]
    - @epicgames-ps/mediasoup-sdp-bridge@1.1.0

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

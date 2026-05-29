# @epicgames-ps/lib-pixelstreamingfrontend-ue5.6

## 0.3.0

### Minor Changes

- 9a3404c: Add an `AutoEnterVR` config flag (#461). When enabled, the player checks for `immersive-vr` support after the video is initialized and requests the WebXR session automatically. Default is off. Note: browsers may require a user gesture to start a WebXR session; in flows where there is no pending gesture (for example, a fresh-page-load `AutoConnect`) the request can still be rejected and the player will log a warning.
- 72c5c53: Added Viewport Resolution Scale parameter to request higher resolution streams on small screens

### Patch Changes

- e120706: Synthesize a `MouseUp` after `MouseDouble` in both mouse controllers so the streamer's pressed-button state stays balanced after a double-click (#10). The plugin treats `MouseDouble` as a press-class event (`RoutePointerDoubleClickEvent` / `IGenericApplicationMessageHandler::OnMouseDoubleClick`) but never synthesizes a release; the browser's preceding `mouseup` was already consumed by the prior `MouseUp`, so UE was left thinking the button was still held — manifesting, for example, as camera pans that latched on after a double-click. Behaviour is gated on the new `MouseDoubleClickAutoRelease` flag (default on); disable it via `?MouseDoubleClickAutoRelease=false` or the settings panel to restore pre-fix behaviour for projects that handle the doubleclick release themselves.
- c3e46a8: - Addressing security issues raised by dependabot. (glob, js-yaml, playwright)
    - Added lint npm script to the root project. Running `npm run lint` will now run linting over all packages.
- 1a2a621: Map the macOS Command (and Windows Meta) keys to UE keycodes 91 (`LeftWindowKey`) and 92 (`RightWindowKey`). `KeyCodes.ts` now contains `MetaLeft`/`MetaRight` (and the legacy `OSLeft`/`OSRight`) entries, and `KeyboardController.getKeycode` normalizes the right-Cmd code so it no longer collides with `ContextMenu` (93) on browsers that report `keyCode === 93` for it, and so Firefox-on-Mac (which reports `keyCode === 224` for both Cmds) is also handled. Frontend portion of issue #276 — UE-side support for these key codes is tracked separately.
- d932cd9: Fix mouse-button-held tracking so dragging outside the video element keeps sending move and release events to UE (#349). When a button is pressed on the hovering mouse controller, `mousemove`/`mouseup` are temporarily moved from the video element to `window`, with coordinates re-computed against the video element's bounding rect. When all buttons are released, the listeners switch back to the element. This prevents the engine from being left with a stuck button when the user releases outside the video — common with `DefaultViewportMouseCaptureMode=CaptureDuringMouseDown`.
- 5696f2e: Make `npm run lint` work regardless of the directory it's invoked from. Each workspace's `eslint.config.mjs` now pins `parserOptions.tsconfigRootDir` to `import.meta.dirname`, so `parserOptions.project` resolves relative to the config file's own directory rather than whichever CWD `typescript-eslint` happens to pick by default. Previously the six workspace configs prefixed `project` with the workspace directory (e.g. `'Common/tsconfig.cjs.json'`), which only worked under one specific `typescript-eslint` version's resolution behavior and broke CI when run from within the workspace.
- Updated dependencies [c3e46a8]
- Updated dependencies [5696f2e]
    - @epicgames-ps/lib-pixelstreamingcommon-ue5.7@0.1.5

## 0.2.2

### Patch Changes

- 812a419: - Addressing security issues raised by dependabot. (glob, js-yaml, playwright)
    - Added lint npm script to the root project. Running `npm run lint` will now run linting over all packages.
- 7790838: Some versions of Firefox were unable to connect due the changes in PR#694 to overcome this issue and preserve the connectivity fixes from PR#694 we now assume the sdpMLineIndex is always 0 for bundle master media line. This change was tested on many browsers and restores connectivity with FireFox.
- Updated dependencies [812a419]
    - @epicgames-ps/lib-pixelstreamingcommon-ue5.7@0.1.4

## 0.2.1

### Patch Changes

- c37e0f3: [UE5.7] QoL: Change `this.peerConnection.getStats()` access to the safer `this.peerConnection?.getStats()` (#719)
- 81031a8: [UE5.7] Fix: Streaming in iframe broken due to SecurityError checking if XR is supported (#734)

## 0.2.0

### Minor Changes

- 05bebea: Add: Ability to access player id on the frontend.
  QoL: Remove player id stripping from the signalling library.

    It is useful to be able to use the player id as a unique identifier that is common between UE side stats and frontend side stats; however, the player id is not actually exposed to TS/JS because the SS strips it out of signalling messages.

    This change is a backport of "Exposed playerid" (#728)

## 0.1.1

### Patch Changes

- 7e5dfb7: Some versions of Firefox were unable to connect due the changes in PR#694 to overcome this issue and preserve the connectivity fixes from PR#694 we now assume the sdpMLineIndex is always 0 for bundle master media line. This change was tested on many browsers and restores connectivity with FireFox.

## 0.2.2

### Patch Changes

- 4d8a72f: This change fixes an intermittent WebRTC connection failure where even when the appropriate ICE candidates were present the conection would sometimes fail to be made. This was caused due to the order that ICE candidates were being sent (hence the intermittent nature of the issues) and the fact that ICE candidates sent from Pixel Streaming plugin contain sdpMid and sdpMLineIndex. sdpMid and sdpMLineIndex are only necessary in legacy, non bundle, WebRTC streams; however, Pixel Streaming always assumes bundle is used and these attributes can safely be set to empty strings/omitted (respectively). We perform this modification in the frontend library prior to adding the ICE candidate to the peer connection. This change was tested on a wide range of target devices and browsers to ensure there was no adverse side effects prior.

## 0.2.1

### Patch Changes

- 3a9dd03: GitHub action was failing due to a TypeScript oddity introduced in TS 5.7: https://github.com/microsoft/TypeScript/issues/60579
- d90b39f: When building the frontend library not in this repository it would fail due requiring newer node types, so these were added a dev dep.

## 0.2.0

### Minor Changes

- e9a182a: Changes for regression/latency testing.

    ## Latency Session Test and dump to csv

    Added a new feature to run a variable length latency test session (e.g. a 60s window)
    and dump that stats from the session to two .csv files:
    1. latency.csv - Which contains the video timing stats
    2. stats.csv - Which contains all WebRTC stats the library currently tracks

    To enable the latency session test use the flag/url parameter ?LatencyCSV
    to enable this feature (by default it is disabled and not UI-configurable).

    To use this latency session test feature:
    1. Navigate to http://localhost/?LatencyCSV
    2. Open the stats panel and click the "Run Test" button under the "Session Test" heading.

    ## 4.27 support restored

    Re-shipped UE 4.27 support by restoring the ?BrowserSendOffer flag.
    It was found useful to support running this latency session test against UE 4.27
    for internal historical testing so support for connecting to this version has been restored.

    To connect to a 4.27 project:
    1. Navigate to http://localhost/?BrowserSendOffer
    2. Connect (warning: this option is not compatible with all newer UE versions)

## 1.1.0

### Minor Changes

- 208d100: Add: a html modal for editing text input that is shown on the frontend when user clicks/taps on a streamed UE widget.

    This edit text modal fixes the following:
    - Fix: Users can now input non-latin characters (e.g. Chinese, Japanese, Korean etc.) using IME assistance.
    - Fix: Users on mobile can now type using on-device native on-screen keyboards (which was previously non-functioning).
    - Add: Users can copy/paste from their clipboard into the edit text modal naturally.

    When adding this modal the following was also fixed and extended:
    - Fix: Typing into other frontend widgets (e.g. the settings panel) no longer sends input to the focused UE widget.
    - Add: Exposed a frontend event for when UE sends text input content, meaning customisation of behaviour is now possible.
    - Docs: Added docs explaning this new edit text modal.

    Further details about the edit text modal as mentioned in this PR: https://github.com/EpicGamesExt/PixelStreamingInfrastructure/pull/564

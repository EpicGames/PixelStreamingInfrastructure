# @epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.6

## 0.3.0

### Minor Changes

- 7c2514d: Added Viewport Resolution Scale parameter to request higher resolution streams on small screens

### Patch Changes

- e053841: Synthesize a `MouseUp` after `MouseDouble` in both mouse controllers so the streamer's pressed-button state stays balanced after a double-click (#10). The plugin treats `MouseDouble` as a press-class event (`RoutePointerDoubleClickEvent` / `IGenericApplicationMessageHandler::OnMouseDoubleClick`) but never synthesizes a release; the browser's preceding `mouseup` was already consumed by the prior `MouseUp`, so UE was left thinking the button was still held — manifesting, for example, as camera pans that latched on after a double-click. Behaviour is gated on the new `MouseDoubleClickAutoRelease` flag (default on); disable it via `?MouseDoubleClickAutoRelease=false` or the settings panel to restore pre-fix behaviour for projects that handle the doubleclick release themselves.
- d72dc6a: - Addressing security issues raised by dependabot. (glob, js-yaml, playwright)
    - Added lint npm script to the root project. Running `npm run lint` will now run linting over all packages.
- 7a78d64: Make `npm run lint` work regardless of the directory it's invoked from. Each workspace's `eslint.config.mjs` now pins `parserOptions.tsconfigRootDir` to `import.meta.dirname`, so `parserOptions.project` resolves relative to the config file's own directory rather than whichever CWD `typescript-eslint` happens to pick by default. Previously the six workspace configs prefixed `project` with the workspace directory (e.g. `'Common/tsconfig.cjs.json'`), which only worked under one specific `typescript-eslint` version's resolution behavior and broke CI when run from within the workspace.
- Updated dependencies [29a420c]
- Updated dependencies [7c2514d]
- Updated dependencies [e053841]
- Updated dependencies [d72dc6a]
- Updated dependencies [cefa822]
- Updated dependencies [a9f507f]
- Updated dependencies [7a78d64]
    - @epicgames-ps/lib-pixelstreamingfrontend-ue5.6@0.3.0

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

### Patch Changes

- Updated dependencies [e9a182a]
    - @epicgames-ps/lib-pixelstreamingfrontend-ue5.6@0.2.0

## 1.2.0

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

### Patch Changes

- Updated dependencies [208d100]
    - @epicgames-ps/lib-pixelstreamingfrontend-ue5.5@1.1.0

## 1.1.0

### Minor Changes

- 8961c17: Frontend library is no longer a peer dependency but instead now a normal dependency.

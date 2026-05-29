# @epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.5

## 1.4.0

### Minor Changes

- c3779a5: Added Viewport Resolution Scale parameter to request higher resolution streams on small screens

### Patch Changes

- 0d87533: Synthesize a `MouseUp` after `MouseDouble` in both mouse controllers so the streamer's pressed-button state stays balanced after a double-click (#10). The plugin treats `MouseDouble` as a press-class event (`RoutePointerDoubleClickEvent` / `IGenericApplicationMessageHandler::OnMouseDoubleClick`) but never synthesizes a release; the browser's preceding `mouseup` was already consumed by the prior `MouseUp`, so UE was left thinking the button was still held — manifesting, for example, as camera pans that latched on after a double-click. Behaviour is gated on the new `MouseDoubleClickAutoRelease` flag (default on); disable it via `?MouseDoubleClickAutoRelease=false` or the settings panel to restore pre-fix behaviour for projects that handle the doubleclick release themselves.
- b16fd54: - Addressing security issues raised by dependabot. (glob, js-yaml, playwright)
    - Added lint npm script to the root project. Running `npm run lint` will now run linting over all packages.
- e948750: Make `npm run lint` work regardless of the directory it's invoked from. Each workspace's `eslint.config.mjs` now pins `parserOptions.tsconfigRootDir` to `import.meta.dirname`, so `parserOptions.project` resolves relative to the config file's own directory rather than whichever CWD `typescript-eslint` happens to pick by default. Previously the six workspace configs prefixed `project` with the workspace directory (e.g. `'Common/tsconfig.cjs.json'`), which only worked under one specific `typescript-eslint` version's resolution behavior and broke CI when run from within the workspace.
- Updated dependencies [113a3c1]
- Updated dependencies [c3779a5]
- Updated dependencies [0d87533]
- Updated dependencies [b16fd54]
- Updated dependencies [af7bde1]
- Updated dependencies [a7d9e91]
- Updated dependencies [e948750]
    - @epicgames-ps/lib-pixelstreamingfrontend-ue5.5@1.3.0

## 1.3.0

### Minor Changes

- 2d0e139: Changed module type from cjs to node16 for the CommonJS version of the package. This fixes issues with some dependencies and also brings things to be slightly more modern.

### Patch Changes

- Updated dependencies [2d0e139]
    - @epicgames-ps/lib-pixelstreamingfrontend-ue5.5@1.2.0

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

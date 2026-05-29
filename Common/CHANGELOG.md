# @epicgames-ps/lib-pixelstreamingcommon-ue5.5

## 0.3.3

### Patch Changes

- b16fd54: - Addressing security issues raised by dependabot. (glob, js-yaml, playwright)
    - Added lint npm script to the root project. Running `npm run lint` will now run linting over all packages.
- e948750: Make `npm run lint` work regardless of the directory it's invoked from. Each workspace's `eslint.config.mjs` now pins `parserOptions.tsconfigRootDir` to `import.meta.dirname`, so `parserOptions.project` resolves relative to the config file's own directory rather than whichever CWD `typescript-eslint` happens to pick by default. Previously the six workspace configs prefixed `project` with the workspace directory (e.g. `'Common/tsconfig.cjs.json'`), which only worked under one specific `typescript-eslint` version's resolution behavior and broke CI when run from within the workspace.

## 0.3.0

### Minor Changes

- 2d0e139: Changed module type from cjs to node16 for the CommonJS version of the package. This fixes issues with some dependencies and also brings things to be slightly more modern.

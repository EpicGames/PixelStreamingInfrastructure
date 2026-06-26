# Development Process

This document describes the end-to-end development workflow for this repository, from writing code to a published release. It is written for developers who are new to the project.

---

## Branch Model

The repository maintains parallel long-lived branches, each corresponding to a version of Unreal Engine:

| Branch | Role |
|--------|------|
| `master` | Active development. Paired with UE's `ue5-main`. This is where all new work lands first. |
| `UE5.8` | Current release — tracks the latest shipped UE version. Bug fixes accepted. |
| `UE5.7` | Supported — bug fixes accepted. |
| `UE5.6` | Supported — bug fixes accepted. |
| `UE5.5` | End of life — no further support. |
| `UE5.4` and earlier | Unsupported. |

**All new features and fixes target `master` first.** Changes are then backported to supported release branches where appropriate. You should never develop directly against a `UE*` branch unless you are making a targeted fix that explicitly cannot go through master.

When a new version of Unreal Engine ships, a new branch (e.g. `UE5.8`) is cut from `master` and `master` continues ahead for the next engine cycle.

---

## Prerequisites

- **Node.js v22.14.0** — exact version, pinned in `NODE_VERSION`. Use a version manager (nvm, fnm) to match it precisely.
- **Git with commit signing configured** — signed commits are mandatory for merge. See [GitHub's signing documentation](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification).
- **Docker** — required for running the frontend and signalling protocol test suites locally.

---

## Local Setup

```bash
# From the repo root — installs all workspace dependencies in one step
npm install
```

This uses NPM workspaces. All dependencies are hoisted to the root `node_modules`. Workspace packages that depend on each other resolve to local symlinks, so you are always working against local builds rather than published npm packages.

To build everything:

```bash
npm run build
```

To work on a specific package, `cd` into its directory and use its local scripts:

```bash
cd Common
npm run build       # build once
npm run watch       # rebuild on file changes
npm run lint        # lint check
```

To start the full signalling server stack locally (handles building automatically):

```bash
# Linux / Mac
./SignallingWebServer/platform_scripts/bash/start.sh

# Windows
.\SignallingWebServer\platform_scripts\cmd\start.bat
```

---

## Package Structure

The public npm packages and their dependency order (each depends on everything to its left):

```
Common  ──►  Signalling  ──►  SignallingWebServer (private, Docker image)
       ╲
        ──►  Frontend/library  ──►  Frontend/ui-library  ──►  Frontend/implementations/
```

**Build order matters.** When building manually, always build `Common` before anything else, then `Signalling` before `SignallingWebServer`, and `Frontend/library` before `Frontend/ui-library`.

The publicly published packages are:

| Package | npm name |
|---------|----------|
| `Common` | `@epicgames-ps/lib-pixelstreamingcommon-ue5.x` |
| `Signalling` | `@epicgames-ps/lib-pixelstreamingsignalling-ue5.x` |
| `Frontend/library` | `@epicgames-ps/lib-pixelstreamingfrontend-ue5.x` |
| `Frontend/ui-library` | `@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.x` |

All other packages (`SignallingWebServer`, `SFU`, implementations, Extras) are private and not published to npm directly — they are shipped as Docker images or source archives.

---

## Making a Change

### 1. Create a branch off `master`

If you are an external contributor, fork the repo first, then branch. Internal developers branch directly.

```bash
git checkout master
git pull
git checkout -b my-feature-branch
```

### 2. Implement your changes

Follow the coding standards in `CONTRIBUTING.md`. Key points:
- TypeScript over JavaScript
- All code must pass `npm run lint`
- Public API functions must have JSDoc comments
- New features require unit tests

### 3. Add a changeset (required for any public package change)

If your change affects any of the four public npm packages (`Common`, `Signalling`, `Frontend/library`, `Frontend/ui-library`), you must create a changeset:

```bash
npm run changeset
```

This interactive CLI asks which packages changed and whether the change is a `patch`, `minor`, or `major` bump (following semver). It writes a small markdown file into `.changeset/`. Commit this file with your changes. Without it, the automated release pipeline will not pick up your change.

PRs that touch public packages without a changeset will be flagged by the Changesets bot.

### 4. Open a pull request to `master`

- Link to any related issue
- Describe what the change does and how you tested it
- Ensure all commits are signed

### 5. Add backport labels if appropriate

If the fix is relevant to a supported release branch (`UE5.8`, `UE5.7`, `UE5.6`), add the labels:
- `auto-backport` — required, triggers the automation
- `auto-backport-to-UE5.8` — one label per target branch

The backport runs automatically after your PR is merged. It creates a separate PR on each target branch using a squash merge. If the backport cannot be applied cleanly (conflicts), it will still create a PR but leave it for manual resolution.

---

## CI Checks

The following checks run automatically on every PR. All must pass before merge.

| Check | What it validates |
|-------|------------------|
| **healthcheck-libraries** | Builds and lints all packages in dependency order; runs unit tests on `Frontend/library` |
| **healthcheck-signalling-protocol** | Runs the signalling protocol integration test suite in Docker |
| **healthcheck-image-wilbur** | Verifies the SignallingWebServer Docker image builds |
| **healthcheck-image-sfu** | Verifies the SFU Docker image builds |
| **healthcheck-platform-scripts** | Runs the platform startup scripts on Linux, macOS, and Windows runners |
| **healthcheck-frontend** | Runs the frontend test suite in Docker containers |
| **healthcheck-streaming** | Full end-to-end streaming test on Windows: spins up signalling server and a software renderer, runs Playwright tests to confirm a stream can be established |
| **healthcheck-markdown-links** | Checks all `.md` file links for broken URLs |

The streaming healthcheck is the heaviest — it downloads a pre-built UE streamer binary and runs a full WebRTC session. If it fails, check the uploaded Playwright report artifact and the signalling/streamer log steps which always run even on failure.

---

## Release Pipeline

Once a PR is merged to `master` (or backported to a `UE*` branch), the release pipeline becomes relevant on the `UE*` branches. Here is how it works end-to-end on a release branch:

### Step 1 — Changeset accumulation

Merged PRs that included changesets will have `.changeset/*.md` files present on the branch. These accumulate between releases.

### Step 2 — Version PR created automatically

The `changesets-update-changelogs` workflow fires on every push to `UE*` branches. When changeset files are present, it opens (or updates) a **"Version Packages"** pull request. This PR:
- Bumps version numbers in the affected `package.json` files
- Updates `CHANGELOG.md` for each package
- Deletes the consumed `.changeset/` files

### Step 3 — Merge the Version PR

When the team is ready to release, the Version Packages PR is merged. This is the moment version numbers are committed to the branch.

### Step 4 — npm packages published automatically

Merging the Version PR changes `package.json` files, which triggers `changesets-publish-npm-packages`. This workflow:
1. Compares each public package's version in the repo against what is on npm
2. For any package with a newer version, runs `npm install`, `npm run build`, and `npm publish` — in workspace dependency order (Common first, then its dependents)
3. Waits for each package to be confirmed available on the registry before moving to the next (avoids install failures due to propagation lag)
4. Creates a git tag for each published package (e.g. `lib-pixelstreamingcommon-ue5.8-0.1.0`)
5. Creates a GitHub release for each package with source archives

### Step 5 — Docker images published automatically

When `SignallingWebServer/package.json` or `SFU/package.json` changes on a `UE*` branch (which happens as part of the Version PR merge), the corresponding publish workflow fires:
- Builds and pushes the Docker image to Docker Hub tagged with the UE version (e.g. `5.8`)
- Creates a git tag for the image release

Docker Hub repositories:
- `pixelstreamingunofficial/pixel-streaming-signalling-server`
- `pixelstreamingunofficial/pixel-streaming-sfu`

### Step 6 — Source archive release (manual trigger)

The full-repository source release is separate and **intentionally manual**. It is triggered by updating the `RELEASE_VERSION` file on a `UE*` branch. When that file is pushed, `create-gh-release` runs and:
- Packages the repository source (excluding `.git`, `.github`, docs, and `Extras`) into `.tar.gz` and `.zip` archives
- Creates a GitHub release at a tag like `UE5.8-0.1.0`

This step is decoupled from the npm publish cycle and is typically done when the team wants to ship a milestone source snapshot alongside the UE release.

---

## Summary: Full Flow

```
Feature developed on master
        │
        ▼
PR opened to master (with changeset if touching public packages)
        │
        ▼
CI checks pass → reviewed → signed commits → merged
        │
        ├──► Backport PRs auto-created for labelled target branches
        │
        ▼  (on UE* branch, when ready to release)
"Version Packages" PR auto-created by changesets bot
        │
        ▼
Version PR merged (version numbers bumped, changelogs updated)
        │
        ├──► npm packages published in dependency order
        ├──► Docker images built and pushed
        ├──► Per-package git tags and GitHub releases created
        │
        ▼  (when team cuts a milestone release)
RELEASE_VERSION updated on UE* branch
        │
        ▼
Source archive created → GitHub release published
```

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Key Requirement

**Node.js v22.14.0 is required.** The exact version is in `NODE_VERSION`. Other versions may break the build.

## Commands

### Root (all workspaces)
```bash
npm install          # Install all workspace dependencies
npm run build        # Build all workspaces
npm run lint         # Lint all workspaces
```

### Per-workspace commands (run from workspace directory)
```bash
npm run build        # Build CJS + ESM outputs
npm run build:cjs    # Build CommonJS only
npm run build:esm    # Build ES6 modules only
npm run lint         # ESLint check
npm run watch        # Watch mode for development
npm run rebuild      # Clean + build
```

### Testing
```bash
# Unit tests (Frontend/library only)
cd Frontend/library && npm test

# Run a single Jest test file
cd Frontend/library && npx jest path/to/test.spec.ts

# E2E frontend tests (requires Docker)
docker-compose -f Extras/FrontendTests/docker-compose.yml up

# Signalling protocol tests
cd Extras/SS_Test && npm test
```

### Development mode (watches all components, hot-reloads)
```bash
cd SignallingWebServer && npm run develop
```

### Frontend implementation bundle
```bash
cd Frontend/implementations/typescript
npm run build       # Production webpack bundle → SignallingWebServer/www/
npm run build:dev   # Dev bundle (unminified)
npm run serve       # Webpack dev server
```

### Starting servers
```bash
# Quick start (handles dependencies automatically)
./SignallingWebServer/platform_scripts/bash/start.sh   # Linux/Mac
.\SignallingWebServer\platform_scripts\cmd\start.bat   # Windows

# Manual signalling server
cd SignallingWebServer && npm run start
```

## Architecture

This is an **NPM Workspaces monorepo** for Unreal Engine Pixel Streaming infrastructure — the servers and browser frontend needed to stream UE applications via WebRTC to web browsers.

### Dependency flow (build order matters)

```
Common  →  Signalling  →  SignallingWebServer (Wilbur)
       ↘                ↗
         Frontend/library  →  Frontend/ui-library  →  Frontend/implementations/
       ↘
         SFU
```

**Common** must be built before all other packages. During development, workspaces link to each other via symlinks (not published NPM packages).

### Components

| Package | Purpose |
|---------|---------|
| `Common/` | Shared foundation: protobuf message protocols, WebSocket transports (browser + Node.js), event emitters, logging |
| `Signalling/` | Library for building custom signalling servers (Express.js-based) |
| `SignallingWebServer/` | Reference signalling server "Wilbur" + HTTP web server that serves the player page |
| `Frontend/library/` | Core WebRTC player library — WebRTC connection, video playback, input handling, data channels |
| `Frontend/ui-library/` | UI component library (CSS-in-JS via JSS) that wraps the player library |
| `Frontend/implementations/typescript/` | Full reference implementation, webpack-bundled to `SignallingWebServer/www/` |
| `Frontend/implementations/react/` | React-based reference implementation |
| `SFU/` | Selective Forwarding Unit using mediasoup — allows one stream to serve many viewers |

### Workspace package names

Packages are published with UE version suffixes (e.g., `@epicgames-ps/lib-pixelstreamingcommon-ue5.8`). The current development branch is `master`; release branches are `UE5.8`, `UE5.7`, `UE5.6`.

### Frontend library internals (`Frontend/library/src/`)

Key subdirectories: `PixelStreaming/` (main client class), `PeerConnectionController/` (WebRTC), `Inputs/` (keyboard/mouse/touch/gamepad/XR), `DataChannel/`, `Config/`, `UeInstanceMessage/` (UE↔browser messaging).

### Common library internals (`Common/src/`)

`Messages/` — protobuf-based signalling message types; `Protocol/` — SignallingProtocol class; `Transport/` — WebSocket abstraction (separate browser and Node.js implementations); `Logger/` — Winston-based logging.

## Releases and versioning

Uses **Changesets** (`@changesets/cli`) for versioning and changelogs. The `.backportrc.json` enables automatic backporting to prior UE version branches. NPM publishing and Docker image builds are automated via GitHub Actions on release branches.

## Commit conventions

Use **Conventional Commits**. The subject line should be a short, imperative title prefixed with a type (`feat`, `fix`, `chore`, `ci`, `docs`, `refactor`, `test`, `build`, `perf`, `style`), optionally with a scope — e.g. `fix(wilbur): serve REST API without static files`. Keep titles short (roughly ≤ 72 chars).

After a blank line, add a very short brief (one or two sentences) explaining what the commit does and, if non-obvious, why. Skip the brief only for truly trivial commits (typo fixes, lockfile bumps).

Never add a `Co-Authored-By:` trailer. Commit messages should carry only the human author.

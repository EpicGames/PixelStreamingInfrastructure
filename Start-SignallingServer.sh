#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -P -- "$(dirname -- "$0")" && pwd -P)"
NODE_BIN="$ROOT/Offline/node/bin/node"
[ -x "$NODE_BIN" ] || NODE_BIN="$ROOT/SignallingWebServer/platform_scripts/bash/node/bin/node"
[ -x "$NODE_BIN" ] || NODE_BIN="$ROOT/WebServers/SignallingWebServer/platform_scripts/bash/node/bin/node"
[ -x "$NODE_BIN" ] || NODE_BIN="$(command -v node || true)"
if [ -z "$NODE_BIN" ]; then
    echo "[ERROR] Node runtime not found. Run Offline/Prepare-OfflineRuntime.sh first." >&2
    exit 1
fi
exec "$NODE_BIN" "$ROOT/Offline/ps2-offline.js" server "$@"

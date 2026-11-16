# Offline & Intranet Pixel Streaming Runtime (`Offline/`)

This directory contains the cross-platform offline runtime builder, launcher, and end-to-end healthcheck tools for Unreal Engine Pixel Streaming across **UE 5.3 – UE 5.8**.

For the full root-level user guide, see [`../README-Intranet.en.md`](../README-Intranet.en.md) (English) or [`../README-Intranet.txt`](../README-Intranet.txt) (Chinese).

## Contents

| File | Description |
| :--- | :--- |
| [`ps2-offline.js`](ps2-offline.js) | Cross-platform Node.js launcher and healthcheck engine. Supports both **Wilbur** (`UE5.5+`) and **Cirrus** (`UE5.3`/`UE5.4`), and both repository root layout (`SignallingWebServer/`) and packaged layout (`WebServers/SignallingWebServer/`). |
| [`Prepare-OfflineRuntime.ps1`](Prepare-OfflineRuntime.ps1) | PowerShell script that downloads portable Node.js (and optional CoTURN), builds the signalling server and frontend, strips external Google Fonts `<link>` tags, packages a symlink-free `SignallingWebServer/node_modules`, and runs the end-to-end healthcheck. |
| [`Prepare-OfflineRuntime.bat`](Prepare-OfflineRuntime.bat) | Windows batch wrapper for `Prepare-OfflineRuntime.ps1`. Supports `-Mirror cn` (`npmmirror.com`) and `-Mirror official`. |
| [`Prepare-OfflineRuntime.sh`](Prepare-OfflineRuntime.sh) | Bash script for Linux / macOS / CI environments to build the frontend, package symlink-free `node_modules`, strip external font links, and execute the healthcheck. |
| [`Install-ToPackage.bat`](Install-ToPackage.bat) | Deploys the prepared offline runtime into a packaged Unreal Engine Windows build (`Samples\PixelStreaming2\WebServers` or `Samples\PixelStreaming\WebServers`). |
| [`web/index.html`](web/index.html) | Default homepage template redirecting to `player.html?HoveringMouse=true&FakeMouseWithTouches=true` for immediate mouse and touch interaction on LAN clients. |

## CLI Commands (`ps2-offline.js`)

```bash
# Start signalling server and packaged UE executable (if present)
node ./Offline/ps2-offline.js start

# Start signalling server only
node ./Offline/ps2-offline.js server

# Stop running signalling server, TURN server, and UE executable
node ./Offline/ps2-offline.js stop

# Static & environment self-check
node ./Offline/ps2-offline.js check

# End-to-end UE standard healthcheck (launches temporary server and probes /api/status, /api/config, /, /player.html)
node ./Offline/ps2-offline.js healthcheck

# Configure Windows Firewall rules (requires Administrator privileges on Windows)
node ./Offline/ps2-offline.js firewall
```

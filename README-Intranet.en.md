# Unreal Engine Pixel Streaming — Offline, Intranet & China Network Guide

This guide explains how to prepare, deploy, and verify Unreal Engine Pixel Streaming (UE 5.3 – UE 5.8) in **air-gapped / intranet** environments and **Mainland China networks without VPN**.

For the Chinese version of this guide, see [`README-Intranet.txt`](README-Intranet.txt).

---

## 1. Key Capabilities & Why Upstream Scripts Fail Offline

Epic's stock `start.bat` / `start.sh` scripts assume unrestricted internet access at runtime and during setup:
1. **External IP Lookup (`https://api.ipify.org`)**: Without a timeout or LAN IP fallback, scripts stall or produce malformed TURN URLs (`turn::19303`).
2. **External Google Fonts (`fonts.googleapis.com` / `fonts.gstatic.com`)**: Stock HTML templates (`player.html`, `showcase.html`, `stresstest.html`, `uiless.html`, React `index.html`) load Montserrat and Michroma from Google Fonts, causing browsers in offline LANs or China networks without VPN to hang for 15–30 seconds on a blank screen.
3. **Public Google STUN (`stun.l.google.com:19302`)**: Unreachable in isolated intranets and slows down ICE candidate gathering.
4. **NPM Workspaces Symlinks / Junctions**: Running `npm install` in the monorepo creates directory junctions with absolute paths in `node_modules`. Copying `SignallingWebServer` to another PC breaks module resolution (`Cannot find module '@epicgames-ps/...'`).
5. **System Proxy Interference**: Windows proxy environment variables (`HTTP_PROXY` / `HTTPS_PROXY`) or proxy tools cause Unreal Engine's WebSocket client to route `ws://127.0.0.1:8888` through the HTTP proxy, failing with `HTTP 502`.

### What This Offline & Intranet Suite Solves
- **Multi-UE Architecture Compatibility**: Automatically detects and supports both **Wilbur** (`UE5.5`, `UE5.6`, `UE5.7`, `UE5.8`, `master`) and **Cirrus** (`UE5.3`, `UE5.4`), as well as both repository root layout (`SignallingWebServer/`) and packaged layout (`WebServers/SignallingWebServer/`).
- **Zero External Blocking Requests**: All Google Fonts `<link>` tags are removed with local system font fallbacks (`Arial, sans-serif`); `api.ipify.org` lookups have a strict 5-second timeout and LAN IPv4 fallback; ICE defaults to direct LAN host candidates (`iceServers: []`).
- **Symlink-Free Portable Runtime**: `Offline/Prepare-OfflineRuntime.ps1` (Windows) and `Offline/Prepare-OfflineRuntime.sh` (Linux/macOS) pack local workspace libraries and bundle a standalone, symlink-free `SignallingWebServer/node_modules` (plus portable `node.exe` and `coturn` on Windows).
- **Mainland China Mirror Support (`--mirror cn`)**: Supports `npmmirror.com` for both Node.js binaries and npm packages without requiring a VPN.
- **UE-Standard End-to-End Healthcheck**: Automatically enables and probes `GET /api/status` (on both Wilbur and Cirrus), `GET /api/config`, `GET /`, and `GET /player.html`.

---

## 2. Quick Start

### Step A: Prepare the Offline Runtime (Run Once on a Machine with Internet)

**Windows (uses China mirror `npmmirror.com` by default):**
```bat
.\Offline\Prepare-OfflineRuntime.bat
```
*(Or use the official global npm/Node mirror: `.\Offline\Prepare-OfflineRuntime.bat -Mirror official`)*

**Linux / macOS:**
```bash
# Using official registry
./Offline/Prepare-OfflineRuntime.sh

# Or using China mirror (no VPN required)
./Offline/Prepare-OfflineRuntime.sh --mirror cn
```

What this step produces:
- `Offline/node/node.exe` (Windows portable Node.js matching `NODE_VERSION`)
- `Offline/coturn/turnserver.exe` (Windows portable CoTURN for optional local TURN relay)
- `SignallingWebServer/dist/` (compiled Wilbur server for UE 5.5+)
- `SignallingWebServer/www/` or `SignallingWebServer/Public/` (compiled frontend bundle + `index.html` with `HoveringMouse=true&FakeMouseWithTouches=true`)
- `SignallingWebServer/node_modules/` (production-only, symlink-free dependencies)

---

### Step B: Deploy to a Packaged UE Project (Optional)

If you have packaged your Unreal Engine project (e.g., `D:\Packaged\Windows`), run:
```bat
.\Offline\Install-ToPackage.bat "D:\Packaged\Windows"
```
Or copy the launcher files directly into your packaged directory. Once prepared, the entire folder can be copied via USB drive or LAN share to any completely offline computer.

---

### Step C: Launch in an Offline / Intranet Environment

1. **First-time Firewall Rule Setup (Windows, Run as Administrator once)**:
   - Right-click [`Open-Firewall.bat`](Open-Firewall.bat) -> **Run as administrator**.
2. **Start Signalling Server + UE Application**:
   - **Windows**: Double-click [`Start-PixelStreaming.bat`](Start-PixelStreaming.bat)
   - **Linux / macOS**: `./Start-PixelStreaming.sh`
3. **Start Signalling Server Only (when running UE from Editor or another PC)**:
   - **Windows**: Double-click [`Start-SignallingServer.bat`](Start-SignallingServer.bat)
   - **Linux / macOS**: `./Start-SignallingServer.sh`
   - Connect UE using: `-PixelStreamingURL=ws://127.0.0.1:8888 -httpproxy=""`
4. **Stop All Processes**:
   - **Windows**: Double-click [`Stop-PixelStreaming.bat`](Stop-PixelStreaming.bat)
   - **Linux / macOS**: `./Stop-PixelStreaming.sh`

---

## 3. Configuration (`PixelStreaming.ini`)

All common settings are managed in [`PixelStreaming.ini`](PixelStreaming.ini):

| Section | Key | Default | Description |
| :--- | :--- | :--- | :--- |
| `[Signalling]` | `Enabled` | `1` | `1` = start local signalling server; `0` = only launch UE connecting to a remote `SignallingAddress` |
| `[Signalling]` | `PlayerPort` | `80` | HTTP port for browser clients (`http://<LAN-IP>/`, or e.g. `8080` for `http://<LAN-IP>:8080/`) |
| `[Signalling]` | `StreamerPort` | `8888` | WebSocket port for Unreal Engine streamer connections |
| `[Signalling]` | `HostAddress` | *(auto)* | Preferred LAN IPv4 address (automatically filters out VPN/virtual adapters when blank) |
| `[Signalling]` | `RestApi` | `1` | Enables the `/api/status` and `/api/config` REST endpoints |
| `[Game]` | `LaunchGame` | `1` | Launch packaged UE executable automatically when running `Start-PixelStreaming` |
| `[Game]` | `WindowMode` | `normal` | `normal`, `windowed`, `fullscreen`, or `offscreen` (`-RenderOffscreen`) |
| `[Turn]` | `Mode` | `off` | `off` (direct LAN), `local` (built-in coturn), or `external` (corporate intranet TURN server) |

---

## 4. UE Healthcheck & Diagnostics

### Environment Self-Check
Verifies runtime files, HTML compliance, `PixelStreaming.ini` syntax, LAN network interfaces, and port availability:
```bash
# Windows
.\Check-PixelStreaming.bat

# Linux / macOS / Node
./Check-PixelStreaming.sh
```

### End-to-End UE Standard Healthcheck
Spins up a temporary signalling server instance on free ephemeral ports and validates:
1. Offline runtime files and OpenAPI specification integrity
2. Zero external Google Fonts links (`fonts.googleapis.com` / `fonts.gstatic.com`)
3. `PixelStreaming.ini` configuration parsing
4. Signalling server startup on `PlayerPort` and `StreamerPort`
5. `GET /api/status` response schema (`version`, `uptime`, `streamer_count`, `player_count`)
6. `GET /api/config` response (`200 OK` on Wilbur)
7. `GET /` homepage response (`HoveringMouse=true`)
8. `GET /player.html` response (`200 OK` and zero external font references)

```bash
node ./Offline/ps2-offline.js healthcheck
```

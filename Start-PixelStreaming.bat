@echo off
rem ===========================================================================
rem  PixelStreaming - one-click start for intranet / offline PCs.
rem  Starts the signalling server with the bundled portable Node (no internet,
rem  no VPN, no public IP lookup), then the packaged UE program exactly as it
rem  normally runs (visible window); the web stream mirrors the local screen.
rem  Settings: PixelStreaming.ini    Help: README-Intranet.txt
rem  Closing this window stops Pixel Streaming and the UE program.
rem ===========================================================================
setlocal DisableDelayedExpansion
set "PS2_NODE=%~dp0Offline\node\node.exe"
if not exist "%PS2_NODE%" set "PS2_NODE=%~dp0SignallingWebServer\platform_scripts\cmd\node\node.exe"
if not exist "%PS2_NODE%" set "PS2_NODE=%~dp0WebServers\SignallingWebServer\platform_scripts\cmd\node\node.exe"
if not exist "%PS2_NODE%" (
    where node.exe >nul 2>&1 && set "PS2_NODE=node.exe"
)
if not exist "%PS2_NODE%" (
    if not "%PS2_NODE%"=="node.exe" goto no_runtime
)
"%PS2_NODE%" "%~dp0Offline\ps2-offline.js" start %*
set "PS2_RC=%ERRORLEVEL%"
if not "%PS2_RC%"=="0" pause
exit /b %PS2_RC%

:no_runtime
echo [ERROR] Offline runtime not found: "%~dp0Offline\node\node.exe"
echo Run Offline\Prepare-OfflineRuntime.bat once on a PC with internet access,
echo then copy the whole folder to this PC again.
pause
exit /b 1

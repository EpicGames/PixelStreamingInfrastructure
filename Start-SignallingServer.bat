@echo off
rem ===========================================================================
rem  PixelStreaming - signalling server only (offline / intranet).
rem  Use when UE runs on another PC: there, set [Signalling] Enabled=0 and
rem  [Game] SignallingAddress=<this PC> in PixelStreaming.ini and run
rem  Start-PixelStreaming.bat. Starting UE by hand needs at least:
rem    <Project>.exe -PixelStreamingURL=ws://<this PC>:8888 -httpproxy=""
rem  Settings: PixelStreaming.ini    Help: README-Intranet.txt
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
"%PS2_NODE%" "%~dp0Offline\ps2-offline.js" server %*
set "PS2_RC=%ERRORLEVEL%"
if not "%PS2_RC%"=="0" pause
exit /b %PS2_RC%

:no_runtime
echo [ERROR] Offline runtime not found: "%~dp0Offline\node\node.exe"
echo Run Offline\Prepare-OfflineRuntime.bat once on a PC with internet access,
echo then copy the whole folder to this PC again.
pause
exit /b 1

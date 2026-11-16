@echo off
rem ===========================================================================
rem  PixelStreaming - self check & UE healthcheck: runtime files, offline HTML,
rem  network adapters, port conflicts, /api/status, UE program location.
rem ===========================================================================
setlocal DisableDelayedExpansion
set "PS2_NODE=%~dp0Offline\node\node.exe"
if not exist "%PS2_NODE%" set "PS2_NODE=%~dp0SignallingWebServer\platform_scripts\cmd\node\node.exe"
if not exist "%PS2_NODE%" set "PS2_NODE=%~dp0WebServers\SignallingWebServer\platform_scripts\cmd\node\node.exe"
if not exist "%PS2_NODE%" (
    where node.exe >nul 2>&1 && set "PS2_NODE=node.exe"
)
if not exist "%PS2_NODE%" (
    if not "%PS2_NODE%"=="node.exe" (
        echo [ERROR] Offline runtime not found: "%~dp0Offline\node\node.exe"
        echo Run Offline\Prepare-OfflineRuntime.bat once on a PC with internet access,
        echo then copy the whole folder to this PC again.
        pause
        exit /b 1
    )
)
"%PS2_NODE%" "%~dp0Offline\ps2-offline.js" check %*
set "PS2_RC=%ERRORLEVEL%"
rem Keep the window open when started by double-click.
echo "%CMDCMDLINE%" | findstr /i /c:"%~nx0" >nul && pause
exit /b %PS2_RC%

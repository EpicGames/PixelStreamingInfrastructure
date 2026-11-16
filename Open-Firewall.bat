@echo off
rem ===========================================================================
rem  PixelStreaming - add inbound Windows Firewall rules for the
rem  signalling server (bundled node.exe), the UE program and the bundled TURN
rem  server, using the ports in PixelStreaming.ini.
rem  Right-click -> "Run as administrator". Run it again after moving the folder
rem  or changing ports (the rules are tied to program paths).
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
        pause
        exit /b 1
    )
)
"%PS2_NODE%" "%~dp0Offline\ps2-offline.js" firewall %*
set "PS2_RC=%ERRORLEVEL%"
rem Keep the window open when started by double-click / "Run as administrator".
echo "%CMDCMDLINE%" | findstr /i /c:"%~nx0" >nul && pause
exit /b %PS2_RC%

@echo off
rem ===========================================================================
rem  Builds the offline PixelStreaming runtime: portable Node + compiled
rem  signalling server + runtime node_modules (no symlinks / junctions).
rem
rem  Run ONCE on a development PC that can reach the internet (or China mirror).
rem  Intranet PCs never need this script.
rem
rem    Prepare-OfflineRuntime.bat              nodejs.org + registry.npmjs.org
rem    Prepare-OfflineRuntime.bat -Mirror cn   npmmirror.com (China, no VPN)
rem    Prepare-OfflineRuntime.bat -NodeZip D:\node-v22.14.0-win-x64.zip
rem
rem  Details and all options: Prepare-OfflineRuntime.ps1
rem ===========================================================================
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Prepare-OfflineRuntime.ps1" %*
set "PS2_RC=%ERRORLEVEL%"
if not "%PS2_RC%"=="0" (
    echo.
    echo Prepare-OfflineRuntime failed, exit code %PS2_RC%.
    echo Failures before the final "replace runtime" step leave the existing runtime untouched.
)
rem Keep the window open when started by double-click.
echo "%CMDCMDLINE%" | findstr /i /c:"%~nx0" >nul && pause
exit /b %PS2_RC%

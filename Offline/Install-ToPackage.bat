@echo off
rem ===========================================================================
rem  Copies this PixelStreaming folder (launchers + prepared offline runtime)
rem  into a packaged UE build, so the package can run Pixel Streaming on
rem  intranet PCs without internet / VPN.
rem
rem  Supports both:
rem    - Root repository layout (SignallingWebServer at repo root)
rem    - Nested WebServers layout (WebServers\SignallingWebServer)
rem  And both UE 5.5+ (Samples\PixelStreaming2) and UE 5.3/5.4 (Samples\PixelStreaming).
rem
rem    Install-ToPackage.bat E:\pack\MyProject-Shipping\Windows
rem
rem  Exit codes: 1 bad arguments, 2 runtime not prepared, 3 copy/verify failed.
rem ===========================================================================
setlocal DisableDelayedExpansion
if "%~1"=="" goto usage

for %%I in ("%~dp0..") do set "PS2_SRC=%%~fI"
for %%I in ("%~1") do set "PS2_PKG=%%~fI"

rem Auto-detect UE project directory inside the packaged build
set "PS2_PROJECT="
for /d %%D in ("%PS2_PKG%\*") do (
    if exist "%%~fD\Binaries\" set "PS2_PROJECT=%%~nxD"
)
if not defined PS2_PROJECT (
    echo [ERROR] "%PS2_PKG%" is not a packaged UE build: no ^<Project^>\Binaries folder found.
    exit /b 1
)

rem Choose Samples\PixelStreaming2 by default, or Samples\PixelStreaming if already present in package
set "PS2_DST=%PS2_PKG%\%PS2_PROJECT%\Samples\PixelStreaming2"
if exist "%PS2_PKG%\%PS2_PROJECT%\Samples\PixelStreaming\" (
    if not exist "%PS2_PKG%\%PS2_PROJECT%\Samples\PixelStreaming2\" (
        set "PS2_DST=%PS2_PKG%\%PS2_PROJECT%\Samples\PixelStreaming"
    )
)

set "PS2_SWS=%PS2_SRC%\SignallingWebServer"
if not exist "%PS2_SWS%\" set "PS2_SWS=%PS2_SRC%\WebServers\SignallingWebServer"

set "PS2_MISSING="
if not exist "%PS2_SRC%\Offline\node\node.exe" set "PS2_MISSING=1"
if not exist "%PS2_SWS%\dist\index.js" (
    if not exist "%PS2_SWS%\cirrus.js" set "PS2_MISSING=1"
)
if not exist "%PS2_SWS%\node_modules\express\package.json" set "PS2_MISSING=1"
if defined PS2_MISSING (
    echo [ERROR] The offline Pixel Streaming runtime is not prepared in "%PS2_SRC%".
    echo         Run Offline\Prepare-OfflineRuntime.bat once on a PC with internet access.
    exit /b 2
)

echo Copying "%PS2_SRC%"
echo      to "%PS2_DST%"
robocopy "%PS2_SRC%" "%PS2_DST%" /MIR /XD "%PS2_SRC%\Logs" "%PS2_SRC%\Offline\.state" "%PS2_SRC%\.git" "%PS2_SRC%\node_modules" /NFL /NDL /NJH /NJS /NP /R:2 /W:2
if errorlevel 8 (
    echo [ERROR] robocopy failed.
    exit /b 3
)

rem Run UE healthcheck on the copied package using the copied portable Node
"%PS2_DST%\Offline\node\node.exe" "%PS2_DST%\Offline\ps2-offline.js" check
if errorlevel 1 (
    echo [ERROR] Self-check failed in "%PS2_DST%"
    exit /b 3
)
echo Pixel Streaming offline runtime installed and verified.
exit /b 0

:usage
echo Usage: %~nx0 ^<packaged build folder, e.g. E:\pack\MyProject-Shipping\Windows^>
exit /b 1

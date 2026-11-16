@rem Copyright Epic Games, Inc. All Rights Reserved.
@echo off

echo Helper library script. Not to be called directly.
goto :eof

:Init
set SCRIPT_DIR=%~dp0
set /p NODE_VERSION=<"%SCRIPT_DIR%/../../../NODE_VERSION"
set NPM="%SCRIPT_DIR%/node/npm"
set TAR="%SystemRoot%\System32\tar.exe"
set CONTINUE=1
GOTO :eof

:Usage
echo.
echo    Usage:
echo        %0 [--help] [--publicip ^<IP Address^>] [--turn ^<turn server^>] [--stun ^<stun server^>] [server options...]
echo    Where:
echo        --help              Print this message and stop this script.
echo        --publicip          Define the address used for the TURN server, syntax: --publicip 192.168.1.10. Skips the online lookup.
echo                            Default: HTTPS lookup with a 5 second timeout, falling back to this PC's LAN address.
echo                            For intranet / offline deployment use Start-PixelStreaming.bat instead.
echo        --mirror            Download mirror: official (default) or cn (npmmirror.com, no VPN needed in China).
echo        --turn              TURN server to be used, syntax: --turn 127.0.0.1:19303
echo                            Default value: Retrieved from 'curl https://api.ipify.org' or if unsuccessful then set to  127.0.0.1.
echo        --turn-user         Sets the turn username when using a turn server.
echo        --turn-pass         Sets the turn password when using a turn server.
echo        --start-turn        Will launch the turnserver process.
echo        --stun              STUN server to be used, syntax: --stun stun.l.google.com:19302
echo                            Default value: stun.l.google.com:19302
echo        --frontend-dir      Sets the output path for the fontend build
echo        --build             Force a rebuild of the typescript frontend even if it already exists
echo        --rebuild           Force a rebuild of everything
echo        --build-libraries   Force a rebuild of shared libraries
echo        --build-wilbur      Force build of wilbur
echo        --deps              Force reinstall of dependencies
echo    Other options: stored and passed to the server.
IF exist "%SCRIPT_DIR%..\..\dist" (
    pushd %SCRIPT_DIR%..\..
    call %NPM% run start --- --help
    popd
)
set CONTINUE=0
exit /b

:ParseArgs
set BUILD_LIBRARIES=0
set BUILD_WILBUR=0
set BUILD_FRONTEND=0
set START_TURN=0
set SERVER_ARGS=
set FRONTEND_DIR=
set TURN_SERVER=
set TURN_USER=
set TURN_PASS=
set STUN_SERVER=
set PUBLIC_IP=
:arg_loop
IF NOT "%1"=="" (
    set HANDLED=0
    IF "%1"=="--help" (
        CALL :Usage
        exit /b
    )
    IF "%1"=="--publicip" (
        set HANDLED=1
        set "PUBLIC_IP=%~2"
        SHIFT
    )
    IF "%1"=="--mirror" (
        set HANDLED=1
        set "PS_MIRROR=%~2"
        SHIFT
    )
    IF "%1"=="--turn" (
        set HANDLED=1
        set TURN_SERVER=%2
        SHIFT
    )
    IF "%1"=="--turn-user" (
        set HANDLED=1
        set TURN_USER=1
    )
    IF "%1"=="--turn-pass" (
        set HANDLED=1
        set TURN_PASS=1
    )
    if "%1"=="--start-turn" (
        set HANDLED=1
        set START_TURN=1
    )
    IF "%1"=="--stun" (
        set HANDLED=1
        set STUN_SERVER=%2
        SHIFT
    )
    IF "%1"=="--frontend-dir" (
        set HANDLED=1
        set FRONTEND_DIR=%~2
        SHIFT
    )
    IF "%1"=="--build" (
        set HANDLED=1
        set BUILD_FRONTEND=1
    )
    IF "%1"=="--rebuild" (
        set HANDLED=1
        set BUILD_LIBRARIES=1
        set BUILD_FRONTEND=1
        set BUILD_WILBUR=1
    )
    IF "%1"=="--build-libraries" (
        set HANDLED=1
        set BUILD_LIBRARIES=1
    )
    IF "%1"=="--build-wilbur" (
        set HANDLED=1
        set BUILD_WILBUR=1
    )
    IF "%1"=="--deps" (
        set HANDLED=1
        set INSTALL_DEPS=1
    )
    IF NOT "!HANDLED!"=="1" (
        set SERVER_ARGS=%SERVER_ARGS% %1
    )
    SHIFT
    GOTO :arg_loop
)
exit /b

:SetupNode
pushd %SCRIPT_DIR%
SET NODE_NAME=node-%NODE_VERSION%-win-x64
SET "NODE_DIST_BASE=https://nodejs.org/dist"
IF /I "%PS_MIRROR%"=="cn" (
    SET "NODE_DIST_BASE=https://npmmirror.com/mirrors/node"
    SET "npm_config_registry=https://registry.npmmirror.com/"
)
if exist node\ (
  echo Node directory found...skipping install.
) else (
  echo Node directory not found...beginning NodeJS download for Windows.

  rem Download nodejs and follow redirects.
  curl -L -o ./node.zip "%NODE_DIST_BASE%/%NODE_VERSION%/%NODE_NAME%.zip"

  %TAR% -xf node.zip
  ren "%NODE_NAME%\" "node"
  del node.zip
  set INSTALL_DEPS=1
)

rem NOTE: We want to use our NodeJS (not system NodeJS!) to build the web frontend files.
rem Save our current directory (the NodeJS dir) in a variable
set NODE_DIR=%SCRIPT_DIR%node
set PATH=%NODE_DIR%;%PATH%

rem Print node version
FOR /f %%A IN ('node.exe -v') DO set NODE_VERSION=%%A
echo Node version: %NODE_VERSION%
popd

if "%INSTALL_DEPS%"=="1" (
    echo Installing dependencies...
    pushd %SCRIPT_DIR%..\..\..
    call %NPM% install
    popd
)

exit /b

:SetupLibraries

if "%BUILD_LIBRARIES%"=="1" (
    set BUILD_COMMON=1
    set BUILD_SIGNALLING=1
)

if NOT exist "%SCRIPT_DIR%..\..\..\Common\dist" (
    set BUILD_COMMON=1
)

if NOT exist "%SCRIPT_DIR%..\..\..\Signalling\dist" (
    set BUILD_SIGNALLING=1
)

IF "%BUILD_COMMON%"=="1" (
    pushd %SCRIPT_DIR%..\..\..\Common
    echo Building common library
    call %NPM% run build:cjs
    popd
)

IF "%BUILD_SIGNALLING%"=="1" (
    pushd %SCRIPT_DIR%..\..\..\Signalling
    echo Building signalling library
    call %NPM% run build:cjs
    popd
)

exit /b

:SetupFrontend
rem Start in the repo dir
pushd %SCRIPT_DIR%..\..\..\

IF "%FRONTEND_DIR%"=="" (
    set FRONTEND_DIR="%SCRIPT_DIR%..\..\www"
) else (
    set FRONTEND_DIR="%FRONTEND_DIR%"
)

rem try to make it an absolute path
call :NormalizePath %FRONTEND_DIR%
set FRONTEND_DIR=%RETVAL%

rem Set this for webpack
set WEBPACK_OUTPUT_PATH=%FRONTEND_DIR%

IF NOT exist "%FRONTEND_DIR%" (
    set BUILD_FRONTEND=1
)


IF "%BUILD_FRONTEND%"=="1" (
    rem We could replace this all with a single npm script that does all this. we do have several build-all scripts already
    rem but this does give a good reference about the dependency chain for all of this.
    echo Building Typescript frontend...
    pushd %CD%\Common
    call %NPM% run build:esm
    popd
    pushd %CD%\Frontend\library
    call %NPM% run build:esm
    popd
    pushd %CD%\Frontend\ui-library
    call %NPM% run build:esm
    popd
    pushd %CD%\Frontend\implementations\typescript
    rem Note: build:dev implicitly uses esm deps due to node16/bundler module resolution
    call %NPM% run build:dev
    popd
    popd
) else (
    echo Skipping rebuilding frontend... %FRONTEND_DIR% has content already, use --build to force a frontend rebuild.
)

exit /b

:SetupCoturn
@Rem Look for CoTURN directory next to this script
pushd %SCRIPT_DIR%
if exist coturn\ (
  echo CoTURN directory found...skipping install.
) else (
  echo CoTURN directory not found...beginning CoTURN download for Windows.

  @Rem Download nodejs and follow redirects.
  curl -L -o ./turnserver.zip "https://github.com/EpicGamesExt/PixelStreamingInfrastructure/releases/download/v4.5.2-coturn-windows/turnserver.zip"

  @Rem Unarchive the .zip to a directory called "turnserver"
  mkdir coturn & %TAR% -xf turnserver.zip -C coturn

  @Rem Delete the downloaded turnserver.zip
  del turnserver.zip
)
popd
goto :eof

:Setup
echo Checking Pixel Streaming Server dependencies
call :SetupNode
call :SetupLibraries
call :SetupFrontend
call :SetupCoturn
exit /b

:SetPublicIP
rem Never overwrite an explicit --publicip, and never hang without internet.
rem An empty address used to produce the TURN URL "turn::19303", which browsers reject,
rem so a failed lookup falls back to this PC's LAN address.
IF DEFINED PUBLIC_IP (
    echo Using configured IP: %PUBLIC_IP%
    exit /b
)
FOR /f %%A IN ('curl.exe --fail --silent --connect-timeout 3 --max-time 5 https://api.ipify.org 2^>nul') DO set "PUBLIC_IP=%%A"
IF NOT DEFINED PUBLIC_IP (
    FOR /F "delims=[] tokens=2" %%A in ('ping -4 -n 1 %ComputerName% ^| findstr [') do set "PUBLIC_IP=%%A"
)
IF NOT DEFINED PUBLIC_IP set "PUBLIC_IP=127.0.0.1"
Echo External IP is : %PUBLIC_IP%
exit /b

:SetupTurnStun
IF "%TURN_SERVER%"=="" (
    set TURN_SERVER=%PUBLIC_IP%:19303
    set TURN_USER=PixelStreamingUser
    set TURN_PASS=AnotherTURNintheroad
)
IF "%STUN_SERVER%"=="" (
    set STUN_SERVER=stun.l.google.com:19302
)

rem Ping own computer name to get local IP
FOR /F "delims=[] tokens=2" %%A in ('ping -4 -n 1 %ComputerName% ^| findstr [') do set LOCAL_IP=%%A
FOR /F "tokens=1,2 delims=:" %%i in ("%TURN_SERVER%") do (
    set TURN_PORT=%%j
)
IF "%TURN_PORT%"=="" ( set TURN_PORT=3478 )

set TURN_PROCESS=turnserver.exe
set TURN_REALM=PixelStreaming
set TURN_ARGS=-c ..\..\..\turnserver.conf --allowed-peer-ip=%LOCAL_IP% -p %TURN_PORT% -r %TURN_REALM% -X %PUBLIC_IP% -E %LOCAL_IP% -L %LOCAL_IP% --no-cli --no-tls --no-dtls --pidfile `"C:\coturn.pid`" -f -a -v -u %TURN_USER%:%TURN_PASS%

if "%START_TURN%"=="1" (
    IF NOT "%TURN_SERVER%"=="" (
        IF NOT "%TURN_USER%"=="" (
            IF NOT "%TURN_PASS%"=="" (
                pushd %SCRIPT_DIR%coturn\
                IF "%1"=="bg" (
                    start "%TURN_PROCESS%" %TURN_PROCESS% %TURN_ARGS%
                ) else (
                    call "%TURN_PROCESS%" %TURN_ARGS%
                )
                popd
            )
        )
    )
)
exit /b

:PrintConfig
echo.
echo Running with config:
echo Public IP address : %PUBLIC_IP%
IF NOT "%STUN_SERVER%"=="" ( echo STUN_SERVER       : %STUN_SERVER% )
IF NOT "%TURN_SERVER%"=="" ( echo TURN_SERVER       : %TURN_SERVER% )
echo Server command line arguments: %SERVER_ARGS%
echo.
exit /b

:BuildWilbur
IF NOT exist "%SCRIPT_DIR%..\..\dist" (
    set BUILD_WILBUR=1
)

IF "%BUILD_WILBUR%"=="1" (
    pushd %SCRIPT_DIR%\..\..\
    echo Building wilbur...
    call %NPM% run build
    popd
)
exit /b

:StartWilbur
pushd %SCRIPT_DIR%\..\..\
call %NPM% run start -- %SERVER_ARGS%
exit /b

:NormalizePath
set RETVAL=%~f1
exit /b

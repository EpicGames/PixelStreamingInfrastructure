@rem Copyright Epic Games, Inc. All Rights Reserved.
@echo off

echo Helper library script. Not to be called directly.
goto :eof

:Init
set SCRIPT_DIR=%~dp0
set NODE_VERSION=v18.17.0
set NPM="%SCRIPT_DIR%/node/npm"
set CONTINUE=1
GOTO :eof

:Usage
echo.
echo    Usage:
echo        %0 [--help] [--publicip ^<IP Address^>] [--turn ^<turn server^>] [--stun ^<stun server^>] [server options...]
echo    Where:
echo        --help                  Print this message and stop this script.
echo        --publicip ^<ip^>         Define public ip address (using default port) for turn server
echo                                Default value: Retrieved from 'curl https://api.ipify.org' or if unsuccessful then set to  127.0.0.1.
echo        --turn ^<turn_ip^>        TURN server to be used
echo        --default-turn          Uses IP address downloaded from https://api.ipify.org and sets up default turn parameters
echo        --turn-user ^<username^>  Sets the turn username when using a turn server.
echo        --turn-pass ^<password^>   Sets the turn password when using a turn server.
echo        --start-turn            Will launch the turnserver process.
echo        --stun ^<stun_ip^>        STUN server to be used
echo        --default-stun          Uses IP address downloaded from https://api.ipify.org and sets up default stun parameters
echo        --build                 Force a rebuild of the typescript frontend even if it already exists
echo        --frontend-dir ^<path^>   Sets the output path for the fontend build
echo    Other options: stored and passed to the server.
set CONTINUE=0
exit /b

:ParseArgs
set FORCE_BUILD=0
set DEFAULT_STUN=0
set DEFAULT_TURN=0
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
        GOTO :eof
    )
    IF "%1"=="--publicip" (
        set HANDLED=1
        set PUBLIC_IP=%2
        SHIFT
    )
    IF "%1"=="--turn" (
        set HANDLED=1
        set TURN_SERVER=%2
        SHIFT
    )
    IF "%1"=="--default-turn" (
        set HANDLED=1
        set DEFAULT_TURN=1
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
    IF "%1"=="--default-stun" (
        set HANDLED=1
        set DEFAULT_STUN=1
    )
    IF "%1"=="--build" (
        set HANDLED=1
        set FORCE_BUILD=1
    )
    IF "%1"=="--frontend-dir" (
        set HANDLED=1
        set FRONTEND_DIR=%2
        SHIFT
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
if exist node\ (
  echo Node directory found...skipping install.
) else (
  echo Node directory not found...beginning NodeJS download for Windows.

  rem Download nodejs and follow redirects.
  curl -L -o ./node.zip "https://nodejs.org/dist/%NODE_VERSION%/%NODE_NAME%.zip"

  tar -xf node.zip
  ren "%NODE_NAME%\" "node"
  del node.zip
)

rem Print node version
echo Node version: & node\node.exe -v
popd
exit /b

:SetupFrontend
rem Start in the repo dir
pushd %SCRIPT_DIR%..\..\..\

rem NOTE: We want to use our NodeJS (not system NodeJS!) to build the web frontend files.
rem Save our current directory (the NodeJS dir) in a variable
set NODE_DIR=%SCRIPT_DIR%node

rem Prepend NODE_DIR to PATH temporarily
set "OLDPATH=%PATH%"
set "PATH=%PATH%;%NODE_DIR%"

IF "%FRONTEND_DIR%"=="" (
    set FRONTEND_DIR="%SCRIPT_DIR%..\..\www"
)

rem try to make it an absolute path
call :NormalizePath %FRONTEND_DIR%
set FRONTEND_DIR=%RETVAL%

rem Set this for webpack
set WEBPACK_OUTPUT_PATH=%FRONTEND_DIR%

IF NOT exist %FRONTEND_DIR%\player.html (
    set FORCE_BUILD=1
)

IF "%FORCE_BUILD%"=="1" (
    rem We could replace this all with a single npm script that does all this. we do have several build-all scripts already
    rem but this does give a good reference about the dependency chain for all of this.
    rem Note: npm link will also run npm install so we dont need that here
    echo Building common library...
    echo ----------------------------
    pushd %CD%\Common
    call %SCRIPT_DIR%\node\npm install
    call %SCRIPT_DIR%\node\npm run build
    popd
    echo Building frontend library...
    echo ----------------------------
    pushd %CD%\Frontend\library
    call %SCRIPT_DIR%\node\npm link ../../Common
    call %SCRIPT_DIR%\node\npm run build
    popd
    echo Building frontend-ui library...
    echo ----------------------------
    pushd %CD%\Frontend\ui-library
    call %SCRIPT_DIR%\node\npm link ../library
    call %SCRIPT_DIR%\node\npm run build
    popd
    echo Building Epic Games reference frontend...
    echo ----------------------------
    pushd %CD%\Frontend\implementations\typescript
    call %SCRIPT_DIR%\node\npm link ../../library ../../ui-library
    call %SCRIPT_DIR%\node\npm run build
    popd
    popd
) else (
    echo Skipping rebuilding frontend... %FRONTEND_DIR% has content already, use --build to force a frontend rebuild.
)

rem Restore path
set "PATH=%OLDPATH%"
exit /b

:SetupCoturn
@Rem Look for CoTURN directory next to this script
pushd %SCRIPT_DIR%
if exist coturn\ (
  echo CoTURN directory found...skipping install.
) else (
  echo CoTURN directory not found...beginning CoTURN download for Windows.

  @Rem Download nodejs and follow redirects.
  curl -L -o ./turnserver.zip "https://github.com/EpicGames/PixelStreamingInfrastructure/releases/download/v4.5.2-coturn-windows/turnserver.zip"

  @Rem Unarchive the .zip to a directory called "turnserver"
  mkdir coturn & tar -xf turnserver.zip -C coturn

  @Rem Delete the downloaded turnserver.zip
  del turnserver.zip
)
popd
goto :eof

:Setup
echo Checking Pixel Streaming Server dependencies
call :SetupNode
call :SetupFrontend
call :SetupCoturn
exit /b

:SetPublicIP
FOR /f %%A IN ('powershell -command "(Invoke-Webrequest "http://api.ipify.org").content"') DO set PUBLIC_IP=%%A
Echo External IP is : %PUBLIC_IP%
exit /b

:SetupTurnStun
IF "%DEFAULT_TURN%"=="1" (
    set TURN_SERVER=%PUBLIC_IP%:19303
    set TURN_USER=PixelStreamingUser
    set TURN_PASS=AnotherTURNintheroad
)
IF "%DEFAULT_STUN%"=="1" (
    set STUN_SERVER=stun.l.google.com:19302
)
FOR /f %%A IN ('powershell -command "(Test-Connection -ComputerName (hostname) -Count 1  | Select IPV4Address).IPV4Address.IPAddressToString"') DO set LOCAL_IP=%%A
FOR /F "tokens=1,2 delims=:" %%i in ("%TURN_SERVER%") do (
    set TURN_PORT=%j
)
IF "%TURN_PORT%"=="" ( set TURN_PORT=3478 )

set TURN_PROCESS=%SCRIPT_DIR%coturn\turnserver.exe
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
                    call %TURN_PROCESS% %TURN_ARGS%
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

:StartWilbur
pushd %SCRIPT_DIR%\..\..\
echo Building signalling library...
echo ----------------------------
pushd ..\Signalling
call %SCRIPT_DIR%\node\npm link ../Common
call %SCRIPT_DIR%\node\npm run build
popd
echo Building wilbur...
echo ----------------------------
call %SCRIPT_DIR%\node\npm link ../Signalling
call %SCRIPT_DIR%\node\npm run build
call %NPM% run start -- %SERVER_ARGS%
exit /b

:NormalizePath
set RETVAL=%~f1
exit /b

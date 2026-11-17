@Rem Copyright Epic Games, Inc. All Rights Reserved.

@echo off

@Rem Set script directory as working directory.
pushd "%~dp0"
setlocal enabledelayedexpansion

title SFU

set "MIRROR="
set "SFU_ARGS="
:arg_loop
IF "%~1"=="" GOTO args_done
IF "%~1"=="--mirror" (
    set "MIRROR=%~2"
    SHIFT
    SHIFT
    GOTO arg_loop
)
set "SFU_ARGS=!SFU_ARGS! %1"
SHIFT
GOTO arg_loop
:args_done

@Rem Run setup to ensure we have node and mediasoup installed.
IF NOT "!MIRROR!"=="" (
    call setup.bat --mirror "!MIRROR!"
) else (
    call setup.bat
)

@Rem Move to sfu_server.js directory.
pushd ..\..

@Rem Run node server and pass any argument along.
platform_scripts\cmd\node\node.exe sfu_server!SFU_ARGS!

@Rem Pop sfu_server directory.
popd

@Rem Pop script directory.
popd

pause
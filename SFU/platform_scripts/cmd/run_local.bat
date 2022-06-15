@Rem Copyright Epic Games, Inc. All Rights Reserved.

@echo off

@Rem Set script directory as working directory.
pushd "%~dp0"

title SFU

@Rem Run setup to ensure we have node and mediasoup installed.
call setup.bat

@Rem Move to sfu_server.js directory.
pushd ..\..

@Rem Run node server and pass any argument along.
platform_scripts\cmd\node\node.exe sfu_server %*

@Rem Pop sfu_server directory.
popd

@Rem Pop script directory.
popd

pause
@Rem Copyright Epic Games, Inc. All Rights Reserved.

@echo off
setlocal enabledelayedexpansion

@Rem Set script directory as working directory.
pushd "%~dp0"

title Wilbur

@Rem Run setup to ensure we have node and the server installed.
call setup.bat %*

@Rem Move to server directory.
pushd ..\..

@Rem Run node server and pass any argument along.
platform_scripts\cmd\node\npm.cmd run start -- --serve --https_redirect %*

@Rem Pop server directory.
popd

@Rem Pop script directory.
popd

pause

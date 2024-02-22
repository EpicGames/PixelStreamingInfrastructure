@Rem Copyright Epic Games, Inc. All Rights Reserved.

@echo off

set SCRIPTS_PATH=%~dp0

@Rem Set script location as working directory for commands.
pushd "%~dp0"

@Rem Ensure we have NodeJs available for calling.
call setup_node.bat

@Rem Ensure we have frontend built.
call setup_frontend.bat %*

@Rem Ensure we have CoTURN available for calling.
call setup_coturn.bat

pushd %SCRIPTS_PATH%\..\..\
echo Building signalling library...
echo ----------------------------
pushd ..\Signalling
call %SCRIPTS_PATH%\node\npm link ../Common
call %SCRIPTS_PATH%\node\npm run build
popd
echo Building wilbur...
echo ----------------------------
call %SCRIPTS_PATH%\node\npm link ../Signalling
call %SCRIPTS_PATH%\node\npm run build
popd

@Rem Pop working directory
popd

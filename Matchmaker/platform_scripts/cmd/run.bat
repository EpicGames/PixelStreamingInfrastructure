@Rem Copyright Epic Games, Inc. All Rights Reserved.

@echo off

@Rem Set script directory as working directory.
pushd "%~dp0"

title Matchmaker

@Rem Run setup to ensure we have node and matchmaker installed.
call setup.bat

@Rem Move to matchmaker.js directory.
pushd ..\..

@Rem Run node server and pass any argument along.
platform_scripts\cmd\node\node.exe matchmaker %*

@Rem Pop matchmaker.js directory.
popd

@Rem Pop script directory.
popd

pause
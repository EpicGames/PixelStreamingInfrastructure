@Rem Copyright Epic Games, Inc. All Rights Reserved.
@echo off
setlocal enabledelayedexpansion

title turnserver

call :Init
call :ParseArgs %*
IF "%CONTINUE%"=="1" (
	call :Setup
	call :SetPublicIP
	set DEFAULT_TURN=1
	set START_TURN=1
	call :SetupTurnStun
)

goto :eof

:Init
:ParseArgs
:Setup
:SetPublicIP
:SetupTurnStun
:PrintConfig
:StartWilbur
%~dp0common.bat %*

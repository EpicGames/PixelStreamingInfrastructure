@Rem Copyright Epic Games, Inc. All Rights Reserved.
@echo off
setlocal enabledelayedexpansion

call :Init
call :ParseArgs %*

IF errorlevel 1 (
	exit /b 1
)

call :Setup

goto :eof

:Init
:ParseArgs
:Setup
:SetPublicIP
:SetupTurnStun
:PrintConfig
:StartWilbur
"%~dp0common.bat" %*

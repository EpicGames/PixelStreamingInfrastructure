@Rem Copyright Epic Games, Inc. All Rights Reserved.

@echo off

@Rem Set script directory as working directory.
pushd "%~dp0"

title SFU

@Rem Get our public IP if we are running this SFU on the cloud we will need this.
FOR /F "tokens=*" %%g IN ('curl -L -S -s https://api.ipify.org') do (SET PUBLICIP=%%g)

@Rem Call out run.bat and pass in the Public IP we grabbed earlier.
call run_local.bat --PublicIP=%PUBLICIP%

@Rem Pop script directory.
popd

pause
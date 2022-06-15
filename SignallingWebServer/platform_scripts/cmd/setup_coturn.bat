@Rem Copyright Epic Games, Inc. All Rights Reserved.

@echo off

@Rem Set script location as working directory for commands.
pushd "%~dp0"

@Rem Look for CoTURN directory next to this script
if exist coturn\ (
  echo CoTURN directory found...skipping install.
) else (
  echo CoTURN directory not found...beginning CoTURN download for Windows.

  @Rem Download nodejs and follow redirects.
  curl -L -o ./turnserver.zip "https://github.com/mcottontensor/coturn/releases/download/v4.5.2-windows/turnserver.zip"

  @Rem Unarchive the .zip to a directory called "turnserver"
  mkdir coturn & tar -xf turnserver.zip -C coturn

  @Rem Delete the downloaded turnserver.zip
  del turnserver.zip
)

@Rem Pop working directory
popd
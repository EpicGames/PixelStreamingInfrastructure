@Rem Copyright Epic Games, Inc. All Rights Reserved.

@echo off

@Rem Set script location as working directory for commands.
pushd "%~dp0"
setlocal enabledelayedexpansion

set "MIRROR="
:arg_loop
IF "%~1"=="" GOTO args_done
IF "%~1"=="--mirror" (
    set "MIRROR=%~2"
    SHIFT
)
SHIFT
GOTO arg_loop
:args_done

@Rem Name and version of node that we are downloading
set /p NodeVersion=<"../../../NODE_VERSION"
SET NodeName=node-%NodeVersion%-win-x64
SET "NODE_DIST_BASE=https://nodejs.org/dist"
IF NOT "!MIRROR!"=="" SET "NODE_DIST_BASE=!MIRROR!"
IF "!NODE_DIST_BASE:~-1!"=="/" SET "NODE_DIST_BASE=!NODE_DIST_BASE:~0,-1!"

@Rem Look for a node directory next to this script
if exist node\ (
  echo Node directory found...skipping install.
) else (
  echo Node directory not found...beginning NodeJS download for Windows.

  @Rem Download nodejs and follow redirects.
  curl -L -o ./node.zip "!NODE_DIST_BASE!/%NodeVersion%/%NodeName%.zip"

  @Rem Unarchive the .zip
  tar -xf node.zip

  @Rem Rename the extracted, versioned, directory that contains the NodeJS binaries to simply "node".
  ren "%NodeName%\" "node"

  @Rem Delete the downloaded node.zip
  del node.zip
)

@Rem Print node version
echo Node version: & node\node.exe -v

@Rem Pop working directory
popd

@Rem Copyright Epic Games, Inc. All Rights Reserved.

@echo off

@Rem Set script location as working directory for commands.
pushd "%~dp0"

@Rem Name and version of node that we are downloading
set /p NodeVersion=<"../../../NODE_VERSION"
SET NodeName=node-%NodeVersion%-win-x64

@Rem Look for a node directory next to this script
if exist node\ (
  echo Node directory found...skipping install.
) else (
  echo Node directory not found...beginning NodeJS download for Windows.

  @Rem Download nodejs and follow redirects (with China mirror support).
  if /i "%PS_MIRROR%"=="cn" (
    curl -L --connect-timeout 15 -o ./node.zip "https://npmmirror.com/mirrors/node/%NodeVersion%/%NodeName%.zip"
  ) else (
    curl -L --connect-timeout 15 -o ./node.zip "https://nodejs.org/dist/%NodeVersion%/%NodeName%.zip" || curl -L --connect-timeout 15 -o ./node.zip "https://npmmirror.com/mirrors/node/%NodeVersion%/%NodeName%.zip"
  )

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

:main
  @Rem Copyright Epic Games, Inc. All Rights Reserved.
  @echo off

  @Rem Set root directory as working directory for commands.
  pushd %~dp0\..\..\..\

  @Rem By default don't build the frontend files
  set "shouldbuild=false"

  @Rem Check if --build is passed as argument and we will always build frontend files.
  :parse
  IF "%~1"=="" GOTO endparse
  IF "%~1"=="--build" set "shouldbuild=true"
  SHIFT
  GOTO parse
  :endparse

  @Rem Look under /Public directory for player.html
  if exist SignallingWebServer\Public\player.html (
    @Rem If --build is passed then we should build
    if "%shouldbuild%" == "true" (
      call :buildFrontend
    ) else (
      echo Skipping rebuilding frontend... SignallingWebServer/Public has content already, use --build to force a frontend rebuild.
    )
  ) else (
    call :buildFrontend
  )

  @Rem Pop working directory
  popd
  goto :eof

:buildFrontend
  echo Building frontend files...

  @Rem Look for a node directory next to this script
  if not exist node call SignallingWebServer\platform_scripts\cmd\setup_node.bat

  @Rem Build the web frontend files.
  @Rem Use our NodeJS (not system NodeJS!) to build the web frontend files.
  call SignallingWebServer\platform_scripts\cmd\node\npm --prefix Frontend\implementations\EpicGames run build-all

  goto :eof
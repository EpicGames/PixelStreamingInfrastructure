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

  @Rem NOTE: We want to use our NodeJS (not system NodeJS!) to build the web frontend files.
  @Rem Save our current directory (the NodeJS dir) in a variable
  set "NodeDir=%CD%\SignallingWebServer\platform_scripts\cmd\node"

  @Rem Prepend NodeDir to PATH temporarily using a custom tool called SetEnv
  call SignallingWebServer\platform_scripts\cmd\setenv\SetEnv.exe -uap PATH %%%%"%NodeDir%"
  @Rem Refresh the cmd session with new PATH
  call %~dp0\refreshenv.cmd

  @Rem Do npm install in the Frontend\lib directory (note we use start because that loads PATH)
  echo ----------------------------
  echo Building frontend library...
  pushd %CD%\Frontend\library
  call ..\..\SignallingWebServer\platform_scripts\cmd\node\npm install
  call ..\..\SignallingWebServer\platform_scripts\cmd\node\npm run build-dev
  popd
  pushd %CD%\Frontend\ui-library
  call ..\..\SignallingWebServer\platform_scripts\cmd\node\npm install
  call ..\..\SignallingWebServer\platform_scripts\cmd\node\npm link ../library
  call ..\..\SignallingWebServer\platform_scripts\cmd\node\npm run build-dev
  popd
  echo End of build PS frontend lib step.

  @Rem Do npm install in the Frontend\implementations\EpicGames directory (note we use start because that loads PATH)
  echo ----------------------------
  echo Building Epic Games reference frontend...
  pushd %CD%\Frontend\implementations\EpicGames
  call ..\..\..\SignallingWebServer\platform_scripts\cmd\node\npm install
  call ..\..\..\SignallingWebServer\platform_scripts\cmd\node\npm link ../../library ../../ui-library
  call ..\..\..\SignallingWebServer\platform_scripts\cmd\node\npm run build-dev
  popd
  echo End of build reference frontend step.
  echo ----------------------------

  @Rem Remove our NodeJS from the PATH
  call SignallingWebServer\platform_scripts\cmd\setenv\SetEnv.exe -ud PATH %%%%"%NodeDir%"

  goto :eof
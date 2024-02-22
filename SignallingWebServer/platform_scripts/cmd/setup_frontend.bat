:main
  @Rem Copyright Epic Games, Inc. All Rights Reserved.
  @echo off

  set SCRIPTS_PATH=%~dp0

  pushd %~dp0\..\..\
  set PROJECT_PATH=%CD%
  set WEBPACK_OUTPUT_PATH=%PROJECT_PATH%\www
  popd

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
  if exist %WEBPACK_OUTPUT_PATH%\player.html (
    @Rem If --build is passed then we should build
    if "%shouldbuild%" == "true" (
      call :buildFrontend
    ) else (
      echo Skipping rebuilding frontend... %WEBPACK_OUTPUT_PATH% has content already, use --build to force a frontend rebuild.
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
  if not exist node call %SCRIPTS_PATH%\setup_node.bat

  @Rem NOTE: We want to use our NodeJS (not system NodeJS!) to build the web frontend files.
  @Rem Save our current directory (the NodeJS dir) in a variable
  set "NodeDir=%SCRIPTS_PATH%\node"

  @rem Save the old path variable
  set OLDPATH=%PATH%

  @Rem Prepend NodeDir to PATH temporarily
  set PATH=%PATH%;%NodeDir%

  @Rem We could replace this all with a single npm script that does all this. we do have several build-all scripts already
  @Rem but this does give a good reference about the dependency chain for all of this.
  @Rem Note: npm link will also run npm install so we dont need that here
  echo Building common library...
  echo ----------------------------
  pushd %CD%\Common
  call %SCRIPTS_PATH%\node\npm install
  call %SCRIPTS_PATH%\node\npm run build
  popd
  echo Building frontend library...
  echo ----------------------------
  pushd %CD%\Frontend\library
  call %SCRIPTS_PATH%\node\npm link ../../Common
  call %SCRIPTS_PATH%\node\npm run build
  popd
  echo Building frontend-ui library...
  echo ----------------------------
  pushd %CD%\Frontend\ui-library
  call %SCRIPTS_PATH%\node\npm link ../library
  call %SCRIPTS_PATH%\node\npm run build
  popd
  echo Building Epic Games reference frontend...
  echo ----------------------------
  pushd %CD%\Frontend\implementations\typescript
  call %SCRIPTS_PATH%\node\npm link ../../library ../../ui-library
  call %SCRIPTS_PATH%\node\npm run build
  popd
  
  @Rem Restore path
  set PATH=%OLDPATH%

  goto :eof
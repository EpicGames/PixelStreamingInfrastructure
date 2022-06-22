@Rem Copyright Epic Games, Inc. All Rights Reserved.

@echo off

@Rem Set script directory as working directory.
pushd "%~dp0"

title Building Cirrus.exe

@Rem Run setup to ensure we have node and cirrus installed.
call setup.bat

@Rem Look for a `nexe` directory next to this script
if exist nexe\ (
  echo nexe directory found...skipping install.
) else (
  echo nexe directory not found...beginning nexe install.

  @Rem Make `nexe directory`
  mkdir nexe

  @Rem npm init and install nexe
  pushd nexe
  call ..\node\npm init -y
  call ..\node\npm install nexe --save
  popd
)

@Rem Move to cirrus directory.
pushd ..\..

@Rem Build cirrus.exe using `nexe` using node 14.5.0 (as that is one of the latest prebuilts node versions in the nexe repo)
call platform_scripts\cmd\node\npx nexe cirrus.js --target "x64-14.15.3" -r "Public/*" -r "scripts/*" -r "images/*" -r "config.json"

@Rem Pop cirrus directory.
popd ..\..

@Rem Pop working directory
popd
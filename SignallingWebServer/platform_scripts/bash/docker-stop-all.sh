#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.

pushd "$(dirname ${BASH_SOURCE[0]})"
./docker-stop-wilbur.sh
./docker-stop-turn.sh
popd

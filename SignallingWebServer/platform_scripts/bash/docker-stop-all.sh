#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.

# Suppress printing of directory stack
pushd () {
    command pushd "$@" > /dev/null
}
popd () {
    command popd "$@" > /dev/null
}

# Stop both stun and turn
pushd "$(dirname ${BASH_SOURCE[0]})"
./docker-stop-cirrus.sh
./docker-stop-turn.sh
popd

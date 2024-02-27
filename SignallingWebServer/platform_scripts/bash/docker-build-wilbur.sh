#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.
#
cd -P -- "$(dirname -- "$0")"
pushd "../../.." > /dev/null

# When run from SignallingWebServer/platform_scripts/bash, this uses the SignallingWebServer
# directory as the build context so the Cirrus files can be successfully copied into the
# container image
docker build --network=host -t "wilbur:latest" -f SignallingWebServer/Dockerfile .


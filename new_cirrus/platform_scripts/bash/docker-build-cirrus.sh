#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.
BASH_LOCATION="$(cd -P -- "$(dirname -- "$0")" && pwd -P)"

pushd "${BASH_LOCATION}" > /dev/null

# When run from SignallingWebServer/platform_scripts/bash, this uses the SignallingWebServer directory
# as the build context so the Cirrus files can be successfully copied into the container image
docker build --network=host -t 'cirrus-webserver:latest' -f "${BASH_LOCATION}/../../Dockerfile" "${BASH_LOCATION}/../../.."

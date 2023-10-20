#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.
BASH_LOCATION=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

pushd "${BASH_LOCATION}" > /dev/null

# When run from SFU/platform_scripts/bash, this uses the SFU directory
# as the build context so the SFU files can be successfully copied into the container image
docker build -t 'mediasoup_sfu:latest' -f "${BASH_LOCATION}/Dockerfile" "${BASH_LOCATION}/../.."
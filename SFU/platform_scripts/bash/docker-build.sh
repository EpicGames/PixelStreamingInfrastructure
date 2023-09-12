#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.

# Build docker image for the Selective Forwarding Unit (SFU)

# When run from SFU/platform_scripts/bash, this uses the SFU directory
# as the build context so the SFU files can be successfully copied into the container image
docker build -t 'mediasoup_sfu:latest' -f ./Dockerfile ../..


#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.

# Start docker container by name using host networking
docker run --name sfu_latest --network host --rm mediasoup_sfu

# Interactive start example
#docker run --name sfu_latest --network host --rm -it --entrypoint /bin/bash mediasoup_sfu

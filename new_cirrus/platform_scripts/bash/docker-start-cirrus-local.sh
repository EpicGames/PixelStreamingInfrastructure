#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.

# Start docker container by name using host networking
docker run --name cirrus_latest --network host --rm cirrus-webserver

# Interactive start example
#docker run --name cirrus_latest --network host --rm -it --entrypoint /bin/bash cirrus-webserver

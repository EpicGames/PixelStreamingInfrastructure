#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.

# Stop the docker container
PSID=$(docker ps -a -q --filter="name=sfu_latest")
if [ -z "$PSID" ]; then
        echo "Docker SFU is not running, no stopping will be done"
        exit 1;
fi
echo "Stopping Mediasoup SFU server ..."
docker stop sfu_latest


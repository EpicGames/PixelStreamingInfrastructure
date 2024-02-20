#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.

# Stop the docker container
PSID=$(docker ps -a -q --filter="name=coturn_latest")
if [ -z "$PSID" ]; then
        echo "Docker turn is not running, no stopping will be done"
        exit 1;
fi
echo "Stopping turn server..."
docker stop coturn_latest


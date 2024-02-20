#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.

# Stop the docker container
PSID=$(docker ps -a -q --filter="name=cirrus_latest")
if [ -z "$PSID" ]; then
	echo "Docker stun is not running, no stopping will be done"
	exit 1;
fi
echo "Stopping stun server ..."
docker stop cirrus_latest


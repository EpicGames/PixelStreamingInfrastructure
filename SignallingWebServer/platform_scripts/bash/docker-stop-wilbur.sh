#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.

# Stop the docker container
PSID=$(docker ps -a -q --filter="name=wilbur_latest")
if [ -z "$PSID" ]; then
	echo "Docker wilbur is not running, no stopping will be done"
	exit 1;
fi
echo "Stopping wilbur server ..."
docker stop wilbur_latest


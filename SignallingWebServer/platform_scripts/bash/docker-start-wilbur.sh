#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.
SCRIPT_DIR="$(cd -P -- "$(dirname -- "$0")" && pwd -P)"

# Get stun server data for passing to the container
. ${SCRIPT_DIR}/common.sh

parse_args $@
set_public_ip
if [[ -z "${STUN_SERVER}" ]]; then
    DEFAULT_STUN=1
fi
START_TURN=0
setup_turn_stun

# Start docker container by name using host networking
if [[ ! -z "${TURN_SERVER}" ]]; then
	PEER_OPTIONS="{\""iceServers\"":[{\""urls\"":[\""stun:"${STUN_SERVER}"\"",\""turn":"${TURN_SERVER}\""],\""username\"":\""${TURN_USER}\"",\""credential\"":\""${TURN_PASS}\""}]}" 
else
	PEER_OPTIONS="{\""iceServers\"":[{\""urls\"":[\""stun:"${STUN_SERVER}"\""]}]}"
fi

docker run --name wilbur_latest --network host --rm wilbur --peerConnectionOptions="${PEER_OPTIONS}" --publicIp="${PUBLIC_IP}"


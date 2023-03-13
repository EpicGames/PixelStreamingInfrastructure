#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.

source turn_user_pwd.sh

USETURN="false"

for arg do
  shift
  [ "${arg}" = "--with-turn" ] && USETURN="true" && continue
  set -- "$@" "${arg}"
done

# Get stun server data for passing to the container
source common_utils.sh
if [ "${USETURN}" = "true" ]; then
	set_start_default_values "y" "y" # Both TURN and STUN server defaults
else
	set_start_default_values "n" "y" # Only STUN server defaults
fi
use_args "$@"

# Start docker container by name using host networking
if [ "${USETURN}" = "true" ]; then
	peerConnectionOptions="{\""iceServers\"":[{\""urls\"":[\""stun:"${stunserver}"\"",\""turn":"${turnserver}\""],\""username\"":\""${turnusername}\"",\""credential\"":\""${turnpassword}\""}]}" 
else
	peerConnectionOptions="{\""iceServers\"":[{\""urls\"":[\""stun:"${stunserver}"\""]}]}"
fi

docker run --name cirrus_latest --network host --rm --entrypoint /usr/local/bin/node cirrus-webserver /opt/SignallingWebServer/cirrus.js --peerConnectionOptions="${peerConnectionOptions}" --publicIp="${publicip}"


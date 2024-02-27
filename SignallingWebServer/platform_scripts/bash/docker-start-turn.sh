#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.
SCRIPT_DIR="$(cd -P -- "$(dirname -- "$0")" && pwd -P)"

# Get stun server data for passing to the container
. ${SCRIPT_DIR}/common.sh

parse_args $@
set_public_ip
START_TURN=0
setup_turn_stun

# If we don't have a turnserver config in the signalling dir then just create one so that docker
# will not create an empty folder when we try to mount the volume
if [[ ! -f "${SCRIPT_DIR}/../../turnserver.conf" ]]; then
    touch "${SCRIPT_DIR}/../../turnserver.conf"
fi

# Start the TURN server
#docker run --name coturn_latest --network host -it --entrypoint /bin/bash coturn/coturn
#docker run --name coturn_latest --network host --rm -a stdin -a stdout -a stderr --entrypoint "sudo mkdir -p /var/run" coturn/coturn ""
#docker run --name coturn_latest --network host --rm -a stdin -a stdout -a stderr --entrypoint "/bin/ls" coturn/coturn "/var/"

docker run --name coturn_latest --network host --rm -a stdin -a stdout -a stderr -v "$PWD/turnserver.conf:${SCRIPT_DIR}/../../turnserver.conf" --entrypoint "turnserver" coturn/coturn "${TURN_ARGUMENTS}"

#docker run --name coturn_latest --network host --rm -a stdin -a stdout -a stderr --entrypoint "/bin/bash" coturn/coturn "ls -latr /var/run/"
#docker run --name coturn_latest --network host --rm -a stdin -a stdout -a stderr --entrypoint "sudo chown ubuntu:ubuntu /var/run/turnserver.pid | sudo chmod +x /var/run/turnserver.pid | ${process}" coturn/coturn "${arguments}"

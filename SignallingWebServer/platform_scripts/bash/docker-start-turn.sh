#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.

# Get stun server data for passing to the container
source common_utils.sh
set_start_default_values "n" "y" # Only STUN server defaults
use_args "$@"

localip=$(hostname -I | awk '{print $1}')
echo "Private IP: $localip"

turnport="${turnserver##*:}"
if [ -z "${turnport}" ]; then
        turnport=3478
fi
echo "TURN port: ${turnport}"
echo ""

turnusername="PixelStreamingUser"
turnpassword="AnotherTURNintheroad"
realm="PixelStreaming"
process="turnserver"
arguments="-c /turnconfig/turnserver.conf --allowed-peer-ip=$localip -p ${turnport} -r $realm -X $publicip -E $localip -L $localip --no-cli --no-tls --no-dtls --pidfile /var/run/turnserver.pid -f -a -v -u ${turnusername}:${turnpassword}"

# Add arguments passed to script to arguments for executable
arguments+=" ${cirruscmd}"

# Start docker container by name using host networking
echo "Running: ${process} ${arguments}"

# Get the docker image
docker pull coturn/coturn

# Copy the turn setup config to a path we can use as a volume
mkdir -p turnconfig
cp ../../turnserver.conf turnconfig/

# Start the TURN server
#docker run --name coturn_latest --network host -it --entrypoint /bin/bash coturn/coturn
#docker run --name coturn_latest --network host --rm -a stdin -a stdout -a stderr --entrypoint "sudo mkdir -p /var/run" coturn/coturn ""
#docker run --name coturn_latest --network host --rm -a stdin -a stdout -a stderr --entrypoint "/bin/ls" coturn/coturn "/var/"

docker run --name coturn_latest --network host --rm -a stdin -a stdout -a stderr -v $PWD/turnconfig:/turnconfig --entrypoint "${process}" coturn/coturn "${arguments}"

#docker run --name coturn_latest --network host --rm -a stdin -a stdout -a stderr --entrypoint "/bin/bash" coturn/coturn "ls -latr /var/run/"
#docker run --name coturn_latest --network host --rm -a stdin -a stdout -a stderr --entrypoint "sudo chown ubuntu:ubuntu /var/run/turnserver.pid | sudo chmod +x /var/run/turnserver.pid | ${process}" coturn/coturn "${arguments}"

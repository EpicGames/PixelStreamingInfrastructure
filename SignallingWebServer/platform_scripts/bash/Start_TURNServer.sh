#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.
BASH_LOCATION=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

pushd "${BASH_LOCATION}" > /dev/null

source turn_user_pwd.sh
source common_utils.sh

set_start_default_values "y" "n" # TURN server defaults only
use_args "$@"
call_setup_sh
print_parameters

localip=$(hostname -I | awk '{print $1}')
echo "Private IP: $localip"

turnport="${turnserver##*:}"
if [ -z "${turnport}" ]; then
	turnport=3478
fi
echo "TURN port: ${turnport}"
echo ""


# Hmm, plain text
realm="PixelStreaming"
process="turnserver"
arguments="-c turnserver.conf --allowed-peer-ip=$localip -p ${turnport} -r $realm -X $publicip -E $localip -L $localip --no-cli --no-tls --no-dtls --pidfile /var/run/turnserver.pid -f -a -v -u ${turnusername}:${turnpassword}"

# Add arguments passed to script to arguments for executable
arguments+=" ${cirruscmd}"

pushd ../.. >/dev/null
echo "Running: $process $arguments"
# pause
start_process $process $arguments &
popd >/dev/null # ../..

popd >/dev/null # BASH_SOURCE

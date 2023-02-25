#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.
BASH_LOCATION=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

pushd "${BASH_LOCATION}" > /dev/null

source common_utils.sh

set_start_default_values "n" "n" # No server specific defaults
use_args "$@"
call_setup_sh
print_parameters

process="${BASH_LOCATION}/node/lib/node_modules/npm/bin/npm-cli.js run start:default --"
arguments=""

if [ ! -z $IS_DEBUG ]; then
	arguments+=" --inspect"
fi

arguments+=" --publicIp=${publicip}"
arguments+=" ${cirruscmd}"

pushd ../.. > /dev/null

echo ""
echo "Starting Cirrus server use ctrl-c to exit"
echo "-----------------------------------------"
echo ""

PATH="${BASH_LOCATION}/node/bin:$PATH"
start_process $process $arguments

popd > /dev/null # ../..

popd > /dev/null # BASH_SOURCE
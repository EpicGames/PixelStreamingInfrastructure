#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.
BASH_LOCATION=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

pushd "${BASH_LOCATION}" > /dev/null

source common_utils.sh

use_args "$@"
call_setup_sh

process="${BASH_LOCATION}/node/bin/node matchmaker.js"

pushd ../.. > /dev/null

echo ""
echo "Starting Matchmaker use ctrl-c to exit"
echo "-----------------------------------------"
echo ""

start_process $process

popd > /dev/null # ../..

popd > /dev/null # BASH_SOURCE
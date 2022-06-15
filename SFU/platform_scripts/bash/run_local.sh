#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.
BASH_LOCATION=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

pushd "${BASH_LOCATION}" > /dev/null

source common_utils.sh

set_start_default_values # No server specific defaults
use_args "$@"
call_setup_sh

process="${BASH_LOCATION}/node/lib/node_modules/npm/bin/npm-cli.js run start:default --"

pushd ../.. > /dev/null

echo ""
echo "Starting (S)elective (F)orwarding (U)nit use ctrl-c to exit"
echo "-----------------------------------------"
echo ""

PATH="${BASH_LOCATION}/node/bin:$PATH"
start_process $process

popd > /dev/null # ../..

popd > /dev/null # BASH_SOURCE
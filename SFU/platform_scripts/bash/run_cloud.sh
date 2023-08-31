#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.
BASH_LOCATION=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

pushd "${BASH_LOCATION}" > /dev/null

source common_utils.sh

set_start_default_values # No server specific defaults
use_args "$@"
call_setup_sh
print_parameters

process="${BASH_LOCATION}/node/lib/node_modules/npm/bin/npm-cli.js run start:default --"
arguments="--PublicIP=${publicip}"

# Add arguments passed to script to arguments for executable
arguments+=" ${sfucmd}"

pushd ../.. > /dev/null

echo "Running: $process $arguments"
PATH="${BASH_LOCATION}/node/bin:$PATH"
start_process $process $arguments
popd

popd

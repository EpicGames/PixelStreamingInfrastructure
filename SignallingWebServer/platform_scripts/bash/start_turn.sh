#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.

SCRIPT_DIR="$(cd -P -- "$(dirname -- "$0")" && pwd -P)"

. ${SCRIPT_DIR}/common.sh
parse_args $@
setup $@
set_public_ip
DEFAULT_TURN=1
START_TURN=1
setup_turn_stun


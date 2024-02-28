#!/bin/bash

# Copyright Epic Games, Inc. All Rights Reserved.
SCRIPT_DIR="$(cd -P -- "$(dirname -- "$0")" && pwd -P)"

. ${SCRIPT_DIR}/common.sh

parse_args $@
setup $@


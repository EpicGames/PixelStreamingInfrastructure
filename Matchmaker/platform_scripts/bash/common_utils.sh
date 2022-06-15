#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.

function log_msg() { #message
	if [ ! -z $VERBOSE ]; then
		echo $1
	fi
}

function print_usage() {
 echo "
 Usage:
  ${0} [--help] [--publicip <IP Address>] [--turn <turn server>] [--stun <stun server>] [cirrus options...]
 Where:
  --help will print this message and stop this script.
  --debug will run all scripts with --inspect
  --nosudo will run all scripts without \`sudo\` command useful for when run in containers.
  --verbose will enable additional logging
  --package-manager <package manager name> specify an alternative package manager to apt-get
 "
 exit 1
}

function use_args() {
 while(($#)) ; do
  case "$1" in
   --debug ) IS_DEBUG=1; shift;;
   --nosudo ) NO_SUDO=1; shift;;
   --verbose ) VERBOSE=1; shift;;
   --help ) print_usage;;
   * ) echo "Unknown command"; shift;;
  esac
 done
}

function call_setup_sh() {
 bash "setup.sh"
}

function start_process() {
	if [ ! -z $NO_SUDO ]; then
		log_msg "running with sudo removed"
		eval $(echo "$@" | sed 's/sudo//g')
	else
		eval $@
	fi
}

function get_version() {
	local version=$1

	if command -v $version; then
		version=$($@)
	fi
	
	echo $version | sed -E 's/[^0-9.]//g'
}

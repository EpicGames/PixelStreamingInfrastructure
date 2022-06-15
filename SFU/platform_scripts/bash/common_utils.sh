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
  ${0} [--help] [--publicip <IP Address>] [sfu options...]
 Where:
  --help will print this message and stop this script.
  --debug will run all scripts with --inspect
  --nosudo will run all scripts without \`sudo\` command useful for when run in containers.
  --verbose will enable additional logging
  --package-manager <package manager name> specify an alternative package manager to apt-get
  --publicip is used to define public ip address (using default port) for turn server, syntax: --publicip ; it is used for 
    default value: Retrieved from 'curl https://api.ipify.org' or if unsuccessful then set to  127.0.0.1.  It is the IP address of the SFU
  Other options: stored and passed to the SFU.  All parameters printed once the script values are set.
 "
 exit 1
}

function print_parameters() {
 echo ""
 echo "${0} is running with the following parameters:"
 echo "--------------------------------------"
 echo "Public IP address : ${publicip}"
 echo "SFU command line arguments: ${sfucmd}"
 echo ""
}

function set_start_default_values() {
 # publicip and sfucmd are always needed
 publicip=$(curl -s https://api.ipify.org)
 if [[ -z $publicip ]]; then
  publicip="127.0.0.1"
 fi

 sfucmd=""
}

function use_args() {
 while(($#)) ; do
  case "$1" in
   --debug ) IS_DEBUG=1; shift;;
   --nosudo ) NO_SUDO=1; shift;;
   --verbose ) VERBOSE=1; shift;;
   --publicip ) publicip="$2"; shift 2;;
   --help ) print_usage;;
   * ) echo "Unknown command, adding to SFU command line: $1"; sfucmd+=" $1"; shift;;
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

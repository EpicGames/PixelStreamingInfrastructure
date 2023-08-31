#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.
BASH_LOCATION=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

pushd "${BASH_LOCATION}" > /dev/null

source common_utils.sh

use_args $@
# Azure specific fix to allow installing NodeJS from NodeSource
if test -f "/etc/apt/sources.list.d/azure-cli.list"; then
    sudo touch /etc/apt/sources.list.d/nodesource.list
    sudo touch /usr/share/keyrings/nodesource.gpg
    sudo chmod 644 /etc/apt/sources.list.d/nodesource.list
    sudo chmod 644 /usr/share/keyrings/nodesource.gpg
    sudo chmod 644 /etc/apt/sources.list.d/azure-cli.list
fi

function check_version() { #current_version #min_version
	#check if same string
	if [ -z "$2" ] || [ "$1" = "$2" ]; then
		return 0
	fi

	local i current minimum

	IFS="." read -r -a current <<< $1
	IFS="." read -r -a minimum <<< $2

	# fill empty fields in current with zeros
	for ((i=${#current[@]}; i<${#minimum[@]}; i++))
	do
		current[i]=0
	done

	for ((i=0; i<${#current[@]}; i++))
	do		
		if [[ -z ${minimum[i]} ]]; then
			# fill empty fields in minimum with zeros
			minimum[i]=0
  fi

		if ((10#${current[i]} > 10#${minimum[i]})); then
			return 1
	fi

		if ((10#${current[i]} < 10#${minimum[i]})); then
			return 2
   fi
	done

	# if got this far string is the same once we added missing 0
	return 0
}

function check_and_install() { #dep_name #get_version_string #version_min #install_command
	local is_installed=0

	log_msg "Checking for required $1 install"

	local current=$(echo $2 | sed -E 's/[^0-9.]//g')
	local minimum=$(echo $3 | sed -E 's/[^0-9.]//g')

	if [ $# -ne 4 ]; then
		log_msg "check_and_install expects 4 args (dep_name get_version_string version_min install_command) got $#"
		return -1
  fi 
	
	if [ ! -z $current ]; then
		log_msg "Current version: $current checking >= $minimum"
		check_version "$current" "$minimum"
		if [ "$?" -lt 2 ]; then
			log_msg "$1 is installed."
			return 0
 else
			log_msg "Required install of $1 not found installing"
		fi
 fi

	if [ $is_installed -ne 1 ]; then
		echo "$1 installation not found installing..."

		start_process $4

		if [ $? -ge 1 ]; then
			echo "Installation of $1 failed try running `export VERBOSE=1` then run this script again for more details"
			exit 1
  fi

 fi
}

echo "Checking Matchmaker dependencies..."

# navigate to Matchmaker root
pushd ../.. > /dev/null

node_version=""
if [[ -f "${BASH_LOCATION}/node/bin/node" ]]; then
	node_version=$("${BASH_LOCATION}/node/bin/node" --version)
fi
check_and_install "node" "$node_version" "v18.17.0" "curl https://nodejs.org/dist/v18.17.0/node-v18.17.0-linux-x64.tar.gz --output node.tar.xz 
													&& tar -xf node.tar.xz 
													&& rm node.tar.xz 
													&& mv node-v*-linux-x64 \"${BASH_LOCATION}/node\""

PATH="${BASH_LOCATION}/node/bin:$PATH"
"${BASH_LOCATION}/node/lib/node_modules/npm/bin/npm-cli.js" install

popd > /dev/null # Matchmaker

popd > /dev/null # BASH_SOURCE

echo "All Matchmaker dependencies up to date."

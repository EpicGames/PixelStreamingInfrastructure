#!/bin/bash

NODE_VERSION=v18.17.0
NPM="${SCRIPT_DIR}/node/bin/npm"

# Prints the arguments and their descriptions to the console
function print_usage() {
    echo "
    Usage:
        ${0} [--help] [--publicip <IP Address>] [--turn <turn server>] [--stun <stun server>] [server options...]
    Where:
        --help              Print this message and stop this script.
        --debug             Run all scripts with --inspect
        --nosudo            Run all scripts without \`sudo\` command useful for when run in containers.
        --verbose           Enable additional logging
        --publicip          Define public ip address (using default port) for turn server, syntax: --publicip ; it is used for 
                            Default value: Retrieved from 'curl https://api.ipify.org' or if unsuccessful then set to  127.0.0.1.  It is the IP address of the server and the default IP address of the TURN server
        --turn              TURN server to be used, syntax: --turn 127.0.0.1:19303
                            Default value: as above, IP address downloaded from https://api.ipify.org; in case if download failure it is set to 127.0.0.1
        --turn-user         Sets the turn username when using a turn server.
        --turn-pass         Sets the turn password when using a turn server.
        --start-turn        Will launch the turnserver process.
        --stun              STUN server to be used, syntax: --stun stun.l.google.com:19302
                            Default value as above
        --build             Force a rebuild of the typescript frontend even if it already exists
        --frontend-dir      Sets the output path for the fontend build

    Other options: stored and passed to the server.  All parameters printed once the script values are set.
    Command line options might be omitted to run with defaults and it is a good practice to omit specific ones when just starting the TURN or the STUN server alone, not the whole set of scripts.
    "
    exit 1
}

function parse_args() {
    IS_DEBUG=0
    NO_SUDO=0
    VERBOSE=0
    FORCE_BUILD=0
    DEFAULT_STUN=0
    DEFAULT_TURN=0
    while(($#)) ; do
        case "$1" in
        --debug ) IS_DEBUG=1; shift;;
        --nosudo ) NO_SUDO=1; shift;;
        --verbose ) VERBOSE=1; shift;;
        --build ) FORCE_BUILD=1; shift;;
        --default-stun ) DEFAULT_STUN=1; shift;;
        --default-turn ) DEFAULT_TURN=1; shift;;
        --stun ) STUN_SERVER="$2"; shift 2;;
        --turn ) TURN_SERVER="$2"; shift 2;;
        --turn-user ) TURN_USER="$2"; shift 2;;
        --turn-pass ) TURN_PASS="$2"; shift 2;;
        --start-turn ) START_TURN=1; shift;;
        --publicip ) PUBLIC_IP="$2"; shift 2;;
        --frontend-dir ) FRONTEND_DIR="$(realpath "$2")"; shift 2;;
        --help ) print_usage;;
        * ) SERVER_ARGS+=" $1"; shift;;
        esac
    done
    if [[ ! -z "${SERVER_ARGS}" ]]; then
        echo "Parameters being passed to server: ${SERVER_ARGS}"
    fi
}

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

	echo "Checking for required $1 install"

	local current=$(echo $2 | sed -E 's/[^0-9.]//g')
	local minimum=$(echo $3 | sed -E 's/[^0-9.]//g')

	if [ $# -ne 4 ]; then
		echo "check_and_install expects 4 args (dep_name get_version_string version_min install_command) got $#"
		return -1
	fi

	if [ ! -z $current ]; then
		echo "Current version: $current checking >= $minimum"
		check_version "$current" "$minimum"
		if [ "$?" -lt 2 ]; then
			echo "$1 is installed."
			return 0
		else
			echo "Required install of $1 not found installing"
		fi
	fi

	if [ $is_installed -ne 1 ]; then
		echo "$1 installation not found installing..."

		start_process $4

		if [ $? -ge 1 ]; then
			echo "Installation of $1 failed try running `export VERBOSE=1` then run this script again for more details"
		fi
	fi
}

function setup_frontend() {
	set -e

    if [[ -z "$FRONTEND_DIR" ]]; then
        FRONTEND_DIR="${SCRIPT_DIR}/../../www"
    fi

    # tell webpack where to output the built frontend
    export WEBPACK_OUTPUT_PATH=${FRONTEND_DIR}

	# navigate to root
	pushd ${SCRIPT_DIR}/../../.. > /dev/null
    OLDPATH=$PATH
	export PATH="${SCRIPT_DIR}/node/bin:$PATH"

	# If player.html doesn't exist, or --build passed as arg, rebuild the frontend
    echo Testing ${WEBPACK_OUTPUT_PATH}/player.html
	if [ ! -f ${WEBPACK_OUTPUT_PATH}/player.html ] || [ "$FORCE_BUILD" == "1" ] ; then
		echo "Building Typescript Frontend."
		# Using our bundled NodeJS, build the web frontend files
		pushd ${SCRIPT_DIR}/../../../Common > /dev/null
		${SCRIPT_DIR}/node/bin/npm install
		${SCRIPT_DIR}/node/bin/npm run build
		popd > /dev/null
		pushd ${SCRIPT_DIR}/../../../Frontend/library > /dev/null
		${SCRIPT_DIR}/node/bin/npm install
		${SCRIPT_DIR}/node/bin/npm link ../../Common
		${SCRIPT_DIR}/node/bin/npm run build
		popd > /dev/null
		pushd ${SCRIPT_DIR}/../../../Frontend/ui-library > /dev/null
		${SCRIPT_DIR}/node/bin/npm install
		${SCRIPT_DIR}/node/bin/npm link ../library
		${SCRIPT_DIR}/node/bin/npm run build
		popd > /dev/null
		pushd ${SCRIPT_DIR}/../../../Frontend/implementations/typescript > /dev/null
		${SCRIPT_DIR}/node/bin/npm install
		${SCRIPT_DIR}/node/bin/npm link ../../library ../../ui-library
		${SCRIPT_DIR}/node/bin/npm run build
		popd > /dev/null
	else
		echo 'Skipping building Frontend because files already exist. Please run with "--build" to force a rebuild'
	fi

    export PATH=$OLDPATH
	popd > /dev/null # root
	set +e
}

function setup() {
    echo "Checking Pixel Streaming Server dependencies."

    pushd "${SCRIPT_DIR}" > /dev/null

    # Azure specific fix to allow installing NodeJS from NodeSource
    if test -f "/etc/apt/sources.list.d/azure-cli.list"; then
        sudo touch /etc/apt/sources.list.d/nodesource.list
        sudo touch /usr/share/keyrings/nodesource.gpg
        sudo chmod 644 /etc/apt/sources.list.d/nodesource.list
        sudo chmod 644 /usr/share/keyrings/nodesource.gpg
        sudo chmod 644 /etc/apt/sources.list.d/azure-cli.list
    fi

    # navigate to project root
    pushd ${SCRIPT_DIR}/../.. > /dev/null

    node_version=""
    if [[ -f "${SCRIPT_DIR}/node/bin/node" ]]; then
        node_version=$("${SCRIPT_DIR}/node/bin/node" --version)
    fi

    node_url=""
    if [ "$(uname)" == "Darwin" ]; then
        arch=$(uname -m)
        if [[ $arch == x86_64* ]]; then
            node_url="https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-darwin-x64.tar.gz"
        elif  [[ $arch == arm* ]]; then
            node_url="https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-darwin-arm64.tar.gz"
        else
            echo 'Incompatible architecture. Only x86_64 and ARM64 are supported'
            exit -1
        fi
    else
        node_url="https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-x64.tar.gz"
    fi
    check_and_install "node" "$node_version" "$NODE_VERSION" "curl $node_url --output node.tar.xz
                                                                && tar -xf node.tar.xz
                                                                && rm node.tar.xz
                                                                && mv node-v*-*-* \"${SCRIPT_DIR}/node\""

    PATH="${SCRIPT_DIR}/node/bin:$PATH"
    "${SCRIPT_DIR}/node/lib/node_modules/npm/bin/npm-cli.js" install

    popd > /dev/null

    # Trigger Frontend Build if needed or requested
    # This has to be done after check_and_install "node"
    setup_frontend

    popd > /dev/null # BASH_SOURCE

    if [ "$(uname)" == "Darwin" ]; then
        if [ -d "${SCRIPT_DIR}/coturn" ]; then
            echo 'CoTURN directory found...skipping install.'
        else
            echo 'CoTURN directory not found...beginning CoTURN download for Mac.'
            coturn_url=""
            if [[ $arch == x86_64* ]]; then
                coturn_url="https://github.com/EpicGames/PixelStreamingInfrastructure/releases/download/v4.6.2-coturn-mac-x86_64/turnserver.zip"
            elif  [[ $arch == arm* ]]; then
                coturn_url="https://github.com/EpicGames/PixelStreamingInfrastructure/releases/download/v4.6.2-coturn-mac-arm64/turnserver.zip"
            fi
            curl -L -o ./turnserver.zip "$coturn_url"
            mkdir "${SCRIPT_DIR}/coturn" 
            tar -xf turnserver.zip -C "${SCRIPT_DIR}/coturn"
            rm turnserver.zip
        fi
    else
        #command #dep_name #get_version_string #version_min #install command
        coturn_version=$(if command -v turnserver &> /dev/null; then echo 1; else echo 0; fi)
        if [ $coturn_version -eq 0 ]; then
            if ! command -v apt-get &> /dev/null; then
                echo "Setup for the scripts is designed for use with distros that use the apt-get package manager" \
                     "if you are seeing this message you will have to update \"${SCRIPT_DIR}/setup.sh\" with\n" \
                     "a package manger and the equivalent packages for your distribution. Please follow the\n" \
                     "instructions found at https://pkgs.org/search/?q=coturn to install Coturn for your specific distribution"
                exit 1
            else
                if [ `id -u` -eq 0 ]; then
                    check_and_install "coturn" "$coturn_version" "1" "apt-get install -y coturn"
                else
                    check_and_install "coturn" "$coturn_version" "1" "sudo apt-get install -y coturn"
                fi
            fi
        fi
    fi
}

# Sets PUBLIC_IP to the external ip
function set_public_ip() {
    PUBLIC_IP=$(curl -s https://api.ipify.org)
    if [[ -z "$PUBLIC_IP" ]]; then
        PUBLIC_IP="127.0.0.1"
    fi
}

# Sets up the turn variables and optionally launches the turn server
# Assumes PUBLIC_IP = public ip of this host
function setup_turn_stun() {
    if [[ "$DEFAULT_TURN" == "1" ]]; then
        TURN_SERVER="${PUBLIC_IP}:19303"
        TURN_USER="PixelStreamingUser"
        TURN_PASS="AnotherTURNintheroad"
    fi

    if [[ "$DEFAULT_STUN" == "1" ]]; then
        STUN_SERVER="stun.l.google.com:19302"
    fi

    if [[ "${START_TURN}" == "1" && ! -z "${TURN_SERVER}" && ! -z "${TURN_USER}" && ! -z "${TURN_PASS}" ]]; then
        start_turn $@
    fi
}

# Prints out the configuration for the server
function print_config() {
    echo ""
    echo "Running with config:"
    echo "Public IP address : ${PUBLIC_IP}"
    if [[ -n "${STUN_SERVER}" ]]; then echo "STUN server       : ${STUN_SERVER}" ; fi
    if [[ -n "${TURN_SERVER}" ]]; then echo "TURN server       : ${TURN_SERVER}" ; fi
    echo "Server command line arguments: ${SERVER_ARGS}"
    echo ""
}

# launches a process confitionally removing sudo
function start_process() {
    if [[ "${NO_SUDO}" == 1 ]]; then
        eval $(echo "$@" | set 's/sudo//g')
    else
        eval $@
    fi
}

# Launches the turn server
# Assumes the following are set
# SCRIPT_DIR = The path to the scripts folder
# TURN_SERVER = The turn server address
# TURN_USER = The turn username
# TURN_PASS = The turn password
function start_turn() {
    LOCAL_IP="$(hostname -I | awk '{print $1}')"
    TURN_PORT="${TURN_SERVER##*:}"
    if [[ -z "${TURN_PORT}" ]]; then TURN_PORT=3478; fi

    PROCESS=""
    if [[ "$(uname)" == "Darwin" ]]; then
        PROCESS="${SCRIPT_DIR}/coturn/bin/turnserver"
    else
        PROCESS="sudo turnserver"
    fi
 
    TURN_REALM="PixelStreaming"
    ARGUMENTS="-c turnserver.conf --allowed-peer-ip=$LOCAL_IP -p ${TURN_PORT} -r ${TURN_REALM} -X ${PUBLIC_IP} -E ${LOCAL_IP} --no-cli --no-tls --no-dtls --pidfile /var/run/turnserver.pid -f -a -v -u ${TURN_USER}:${TURN_PASS}"

    start_process ${PROCESS} ${ARGUMENTS} $@
}

# Assumes the following are set
# SCRIPT_DIR = The path to the root of the PixelStreamingInfrastructure repo.
# NPM = The npm command path
# SERVER_ARGS The arguments to be passed to the server
function start_wilbur() {
    pushd ${SCRIPT_DIR}/../../.. > /dev/null

    pushd Signalling > /dev/null
    ${NPM} link ../Common
    ${NPM} run build
    popd > /dev/null

    pushd SignallingWebServer > /dev/null
    ${NPM} link ../Signalling
    ${NPM} run build

    echo "Starting wilbur use ctrl-c to exit"
    echo "----------------------------------"
    
    start_process "sudo PATH=$PATH ${NPM} start -- ${SERVER_ARGS}"

    popd > /dev/null
}


# Copyright Epic Games, Inc. All Rights Reserved.

# Parse $args into a string
$params = $args[0]
if ( $args.Count -gt 1 ) {
  $params = $args[1..$($args.Count - 1)]
  # Do setup as a common task, it is smart and will not reinstall if not required.
  Start-Process -FilePath "$PSScriptRoot\setup.bat" -Wait -NoNewWindow -ArgumentList $params
}
else {
  Start-Process -FilePath "$PSScriptRoot\setup.bat" -Wait -NoNewWindow
}
echo $params

$global:ScriptName = $MyInvocation.MyCommand.Name
$global:PublicIP = $null
$global:StunServer = $null
$global:TurnServer = $null
$global:CirrusCmd = $null
$global:BuildFrontend = $null

function print_usage {
 echo "
 Usage (in MS Windows Power Shell):
  $global:ScriptName [--help] [--publicip <IP Address>] [--turn <turn server>] [--stun <stun server>] [cirrus options...]
 Where:
  --help will print this message and stop this script.
  --publicip is used to define public ip address (using default port) for turn server, syntax: --publicip ; it is used for 
    default value: Retrieved from 'curl https://api.ipify.org' or if unsuccessful then set to  127.0.0.1.  It is the IP address of the Cirrus server and the default IP address of the TURN server
  --turn defines what TURN server to be used, syntax: --turn 127.0.0.1:19303
    default value: as above, IP address downloaded from https://api.ipify.org; in case if download failure it is set to 127.0.0.1
  --stun defined what STUN server to be used, syntax: --stun stun.l.google.com:19302
    default value as above
  Other options: stored and passed to the Cirrus server.  All parameters printed once the script values are set.
  Command line options might be omitted to run with defaults and it is a good practice to omit specific ones when just starting the TURN or the STUN server alone, not the whole set of scripts.
 "
 exit 1
}

function print_parameters {
 echo ""
 echo "$scriptname is running with the following parameters:"
 echo "--------------------------------------"
 if ($global:StunServer -ne $null) { echo "STUN server       : $global:StunServer" }
 if ($global:TurnServer -ne $null) { echo "TURN server       : $global:TurnServer" }
 echo "Public IP address : $global:PublicIP"
 echo "Cirrus server command line arguments: $global:CirrusCmd"
 echo ""
}

function set_start_default_values($SetTurnServerVar, $SetStunServerVar) {
 # publicip and cirruscmd are always needed
 $global:PublicIP = Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing
 if ($global:PublicIP -eq $null -Or $global:PublicIP.length -eq 0) {
  $global:PublicIP = "127.0.0.1"
 } else {
    $global:PublicIP = ($global:PublicIP).Content
 }
 $global:cirruscmd = ""

 if ($SetTurnServerVar -eq "y") {
  $global:TurnServer = $global:PublicIP + ":19303"
 }
 if ($SetStunServerVar -eq "y") {
  $global:StunServer = "stun.l.google.com:19302"
 }
}

function use_args($arg) {
 $CmdArgs = $arg -split (" ")
 while($CmdArgs.count -gt 0) {
  $Cmd, $CmdArgs = $CmdArgs
  if ($Cmd -eq "--stun") {
   $global:StunServer, $CmdArgs = $CmdArgs
  } elseif ($Cmd -eq "--turn") {
   $global:TurnServer, $CmdArgs = $CmdArgs
  } elseif ($Cmd -eq "--publicip") {
   $global:PublicIP, $CmdArgs = $CmdArgs
   $global:TurnServer = $global:publicip + ":19303"
  } elseif ($Cmd -eq "--build") {
   $global:BuildFrontend, $CmdArgs = $CmdArgs
  } elseif ($Cmd -eq "--help") {
   print_usage
  } else {
   echo "Unknown command, adding to cirrus command line: $Cmd"
   $global:CirrusCmd += " $Cmd"
  }
 }
}

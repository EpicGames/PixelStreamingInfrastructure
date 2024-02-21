# Copyright Epic Games, Inc. All Rights Reserved.

. "$PSScriptRoot\Start_Common.ps1" $args

set_start_default_values "n" "y" # Set both TURN and STUN server defaults
use_args($args)
print_parameters

$peerConnectionOptions = "{ \""iceServers\"": [{\""urls\"": [\""stun:" + $global:StunServer + "\""]}] }"

$ProcessExe = "platform_scripts\cmd\node\npm.cmd"
$Arguments = @("start", "--", "--serve", "--https_redirect", "--peer_options=""$peerConnectionOptions""", "--public_ip=$global:PublicIp")
# Add arguments passed to script to Arguments for executable
$Arguments += $global:ServerCmd

Push-Location $PSScriptRoot\..\..\
Write-Output "Running: $ProcessExe $Arguments"
Start-Process -FilePath $ProcessExe -ArgumentList "$Arguments" -Wait -NoNewWindow
Pop-Location

# Copyright Epic Games, Inc. All Rights Reserved.

. "$PSScriptRoot\Start_Common.ps1"

set_start_default_values "y" "y" # Set both TURN and STUN server defaults
use_args($args)
print_parameters

Push-Location $PSScriptRoot

Start-Process -FilePath "PowerShell" -ArgumentList ".\Start_TURNServer.ps1" -WorkingDirectory "$PSScriptRoot"

$peerConnectionOptions = "{ \""iceServers\"": [{\""urls\"": [\""stun:" + $global:StunServer + "\"",\""turn:" + $global:TurnServer + "\""], \""username\"": \""PixelStreamingUser\"", \""credential\"": \""AnotherTURNintheroad\""}] }"

$ProcessExe = "platform_scripts\cmd\node\node.exe"
$Arguments = @("cirrus", "--peerConnectionOptions=""$peerConnectionOptions""", "--PublicIp=$global:PublicIp")
# Add arguments passed to script to Arguments for executable
$Arguments += $args

Push-Location $PSScriptRoot\..\..\
Write-Output "Running: $ProcessExe $Arguments"
Start-Process -FilePath $ProcessExe -ArgumentList $Arguments -Wait -NoNewWindow
Pop-Location

Pop-Location
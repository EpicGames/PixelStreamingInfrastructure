How to use files in this directory:
- Files with .ps1 extension can be run with PowerShell[.exe] in Windows.  Powershell needs to be started as Administrator to run setup.ps1 so it can run installation / installation check steps
- Make sure that all of your dependencies are installed.  Use .\setup.ps1 what will install whatever is missing as long as you are on a supported operating system

- Run a local instance of the Cirrus server by using the .\run_local.ps1 script

- Use the following scripts to run locally or in your cloud instance:
 - Start_SignallingServer.ps1 - Start only the Signalling (STUN) server
 - Start_TURNServer.ps1 - Start only the TURN server
 - Start_WithTURN_SignallingServer.ps1 - Start a TURN server and the Cirrus server together
- The Start_Common.ps1 file contains shared functions for other Start_*.ps1 scripts and it is not supposed to run alone

- The local/cloud Start_*.ps1 powershell scripts can be invoked with the  --help  command line option to see how those can be configured.  The following options can be supplied: --publicip, --turn, --stun.  Please read the --help

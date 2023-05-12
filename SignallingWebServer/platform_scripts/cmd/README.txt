How to use files in this directory:

- Files with .ps1 extension can be run with PowerShell[.exe] in Windows. Powershell needs to be started as Administrator to run setup.ps1 so it can run installation / installation check steps;
- Run .\setup.bat to automatically install all required dependencies for your operating system. Note that .\setup.bat is called from every script designed to run;
- Run a local instance of the Cirrus server by using the .\run_local.ps1 script;
- Use the following scripts to run locally or on your cloud instance (note that TURN server is not expected to work locally due to the nature of its application):
   - Start_SignallingServer.ps1 - start only the Signalling (STUN) server;
   - Start_TURNServer.ps1 - start only the TURN server;
   - Start_WithTURN_SignallingServer.ps1 - start a TURN server and the Cirrus server together;

Tips:

- The Start_Common.ps1 file contains shared functions for other Start_*.ps1 scripts and it is not supposed to run alone.
- The local/cloud Start_*.ps1 powershell scripts can be invoked with the  --help  command line option to see how those can be configured.  The following options can be supplied: --publicip, --turn, --stun.  Please read the --help.

How to use files in this directory:
- Make sure that all of your dependencies are installed.  Use ./setup.sh what will install whatever is missing as long as you are on a supported operating system.  Please note that setup.sh is called from every script designed to run

- Run a local instance of the Cirrus server by using the ./run_local.sh script

- Use the following scripts to run locally or in your cloud instance:
 - Start_SignallingServer.sh  - Start only the Signalling (STUN) server
 - Start_TURNServer.sh - Start only the TURN server
 - Start_WithTURN_SignallingServer.sh - Start a TURN server and the Cirrus server together

- Please note that scripts intended to run need to be executable:  $ chmod +x *.sh  will do that job.
- The local/cloud Start_*.sh shell scripts can be invoked with the  --help  command line option to see how those can be configured.  The following options can be supplied: --publicip, --turn, --stun.  Please read the --help

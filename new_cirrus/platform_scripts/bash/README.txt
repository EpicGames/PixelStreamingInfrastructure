How to use files in this directory:

- Run ./setup.sh to automatically install all required dependencies for your operating system. Note that setup.sh is called from every script designed to run;
- Run a local instance of the Cirrus server by using the ./run_local.sh script;
- Use the following scripts to run locally or on your cloud instance (note that TURN server is not expected to work locally due to the nature of its application):
   - Start_SignallingServer.sh  - start only the Signalling (STUN) server;
   - Start_TURNServer.sh - start only the TURN server;
   - Start_WithTURN_SignallingServer.sh - start a TURN server and the Cirrus server together.
   
Tips:

- Please note that scripts intended to run need to be executable:  $ chmod +x *.sh  will do that job.
- The local/cloud Start_*.sh shell scripts can be invoked with the  --help  command line option to see how those can be configured.  The following options can be supplied: --publicip, --turn, --stun.  Please read the --help.

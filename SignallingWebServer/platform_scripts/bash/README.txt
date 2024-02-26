How to use files in this directory:

- setup.sh : Ensures the correct node is installed and builds the frontend if it isn't already
- start.sh : Starts the signalling server with basic settings
- start_turn.sh : Starts the turn server only with basic settings
- start_with_stun.sh : Starts the signalling server with basic STUN settings
- start_with_turn.sh : Starts the TURN server and then the signalling server with STUN and TURN parameters
- common.sh : Contains a bunch of helper functions for the contained scripts. Shouldn't be run directly.

Tips:

- Please note that scripts intended to run need to be executable:  $ chmod +x *.sh  will do that job.
- You can provide --help to start.sh to get a list of customizable arguments.

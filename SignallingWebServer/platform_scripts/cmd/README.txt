How to use files in this directory:

- setup.bat : Ensures the correct node is installed and builds the frontend if it isn't already
- start.bat : Starts the signalling server with basic settings
- common.bat : Contains a bunch of helper functions for the contained scripts. Shouldn't be run directly.

The following are provided as handy shortcuts but mostly leverage start.bat functionality
- start_turn.bat : Starts the turn server only with basic settings
- start_with_stun.bat : Starts the signalling server with basic STUN settings
- start_with_turn.bat : Starts the TURN server and then the signalling server with STUN and TURN parameters

Tips:

- You can provide --help to start.bat to get a list of customizable arguments.

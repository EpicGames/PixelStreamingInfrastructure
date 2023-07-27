# Use the current Long Term Support (LTS) version of Node.js
FROM node:lts

# Copy the signalling server and frontend source code from the build context
COPY /SignallingWebServer /SignallingWebServer
COPY /Frontend /Frontend

# Install the dependencies for the signalling server and build the frontend
RUN SignallingWebServer/platform_scripts/bash/setup.sh --build

# Expose TCP port 80 for player WebSocket connections and web server HTTP access
EXPOSE 80

# Expose TCP port 8888 for streamer WebSocket connections
EXPOSE 8888
EXPOSE 8888/udp

# Expose port for SFU connections
EXPOSE 8889

# Google stun
EXPOSE 19302

# Matchmaker
EXPOSE 9999

# Turn coturn
EXPOSE 3478
EXPOSE 3479

# Set the signalling server as the container's entrypoint
ENTRYPOINT ["/usr/local/bin/node", "/SignallingWebServer/cirrus.js"]

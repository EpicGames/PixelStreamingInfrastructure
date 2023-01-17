# Use the current Long Term Support (LTS) version of Node.js
FROM node:lts

# Copy the signalling server source code from the build context
COPY . /opt/SignallingWebServer

# Install the dependencies for the signalling server
WORKDIR /opt/SignallingWebServer
RUN npm install .

# Expose TCP ports 80 and 443 for player WebSocket connections and web server HTTP(S) access
EXPOSE 80
EXPOSE 443

# Expose TCP port 8888 for streamer WebSocket connections
EXPOSE 8888

# Expose TCP port 8889 for connections from the SFU
EXPOSE 8889

# Expose TCP port 9999 for connections from the Matchmaker
EXPOSE 9999

# Set the signalling server as the container's entrypoint
ENTRYPOINT ["/usr/local/bin/node", "/opt/SignallingWebServer/cirrus.js"]

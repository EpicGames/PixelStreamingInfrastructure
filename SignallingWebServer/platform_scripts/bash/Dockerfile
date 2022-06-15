#!/bin/bash
# Copyright Epic Games, Inc. All Rights Reserved.

FROM node:latest

# Copy the signalling server source code to the Docker build context
COPY . /opt/SignallingWebServer

# Install the dependencies for the signalling server
WORKDIR /opt/SignallingWebServer
RUN npm install .

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
ENTRYPOINT ["/usr/local/bin/node", "/opt/SignallingWebServer/cirrus.js"]


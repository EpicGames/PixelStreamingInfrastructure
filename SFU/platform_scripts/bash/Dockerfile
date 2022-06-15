# Copyright Epic Games, Inc. All Rights Reserved.

FROM node:latest

# Make sure Mediasoup requirements are met
RUN apt -y update
RUN apt -y install python3-pip

# Copy the Selective Forwarding Unit (SFU) to the Docker build context
COPY . /opt/SFU

# Install the dependencies for the mediasoup server
WORKDIR /opt/SFU
RUN npm update
RUN npm install .

# Expose TCP port 80 for player WebSocket connections and web server HTTP access
EXPOSE 40000-49999

# Expose TCP port 8888 for streamer WebSocket connections
EXPOSE 8889

# Set the signalling server as the container's entrypoint
ENTRYPOINT ["/usr/local/bin/node", "/opt/SFU/sfu_server.js"]


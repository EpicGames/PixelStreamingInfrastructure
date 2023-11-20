# Use the current Long Term Support (LTS) version of Node.js
FROM node:lts

COPY /SFU /SFU

RUN SFU/platform_scripts/bash/setup.sh

ENV SIGNALLING_URL ws://localhost:8889

EXPOSE 40000-49999/tcp
EXPOSE 40000-49999/udp

CMD node /SFU/sfu_server.js --signallingURL=${SIGNALLING_URL} 

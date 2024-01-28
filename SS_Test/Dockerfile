FROM node:18.17.0 as builder

COPY SS_Test/package*.json /SignallingTester/SS_Test/
COPY Common/protobuf/signalling_messages.proto /SignallingTester/Common/protobuf/signalling_messages.proto

WORKDIR /SignallingTester/SS_Test

RUN npm ci

COPY SS_Test/. .

RUN npm run build

USER node

CMD [ "node", "build/index.js" ]

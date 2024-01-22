FROM node:lts as builder

COPY SS_Test/package*.json /SignallingTester/SS_Test/
COPY Common/protobuf/signalling_messages.proto /SignallingTester/Common/protobuf/signalling_messages.proto

WORKDIR /SignallingTester/SS_Test

RUN npm ci

COPY SS_Test/. .

RUN npm run build

FROM node:lts-slim

ENV NODE_ENV production

COPY SS_Test/package*.json /SignallingTester/SS_Test/

WORKDIR /SignallingTester/SS_Test

RUN npm ci --production

COPY --from=builder /SignallingTester/SS_Test/build ./build

USER node

CMD [ "node", "build/index.js" ]

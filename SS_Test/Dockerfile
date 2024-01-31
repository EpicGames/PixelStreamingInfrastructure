FROM node:18.17.0 as builder

WORKDIR /SignallingTester

COPY Common/ .
COPY SS_Test/ .

WORKDIR /SignallingTester/SS_Test

RUN npm ci
RUN npm link ../Common
RUN npm run build

USER node

CMD [ "node", "build/index.js" ]


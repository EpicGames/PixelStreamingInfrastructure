FROM node:18.17.0 as builder

WORKDIR /SignallingTester

COPY Common/ Common
COPY SS_Test/ SS_Test

WORKDIR /SignallingTester/Common

RUN npm ci
RUN npm run build

WORKDIR /SignallingTester/SS_Test

RUN npm ci
RUN npm link ../Common
RUN npm run build

USER node

CMD [ "node", "build/index.js" ]


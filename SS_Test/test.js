const config = require('./config');
const WebSocket = require('ws');
const events = require('events');

function validateSignallingMessage(messageString) {
    var parsedMessage;
    try {
        parsedMessage = JSON.parse(messageString);
    } catch (e) {
        console.log(`Malformed JSON in message\n ${e}`);
        return null;
    }

    if (!parsedMessage.type) {
        console.log(`Message has no type`);
        return null;
    }

    return parsedMessage;
}

class SSConnection {
    constructor(name, url) {
        this.name = name;
        this.expecting = [];
        this.messageQueue = [];

        console.log(`${this.name}: Connecting to Signalling Server at ${url}`);
        this.ws = new WebSocket(url);
        this.ws.addEventListener("open", event => this.onConnectionOpen(event));
        this.ws.addEventListener("error", event => this.onConnectionError(event));
        this.ws.addEventListener("close", closeEvent => this.onConnectionClose(closeEvent));
        this.ws.addEventListener("message", messageEvent => this.onMessage(messageEvent));
    }

    onConnectionOpen(event) {
        console.log(`${this.name}: Connected to signalling server`);
    }

    onConnectionError(event) {
        console.log(`${this.name}: Signalling connection error: ${event.message}`);
    }

    onConnectionClose(closeEvent) {
        console.log(`${this.name}: Disconnected from signalling server`);
    }

    onMessage(messageEvent) {
        console.log(`${this.name}: Got message: ${JSON.stringify(messageEvent.data)}`);
        const parsedMessage = validateSignallingMessage(messageEvent.data);
        if (parsedMessage) {
            const messageEvent = {
                type: 'message',
                message: parsedMessage,
                handled: false
            };
            this.messageQueue.push(parsedMessage);
        }
    }

    sendMessage(message) {
        const str = JSON.stringify(message);
        console.log(`${this.name}: sending: ${str}`);
        this.ws.send(str);
    }

    expect(messageType, callback) {
        this.expecting.push({type: messageType, handler: callback});
    }

    async waitFor(...conditions) {
      await Promise.any(conditions);
    }

    async validate(timeout) {
        var messageQueue = this.messageQueue;
        var expectingList = this.expecting;

        const pollingPromise = new Promise((resolve) => {
            const timeoutTimer = setTimeout(()=>{
                console.log(`${this.name}: Timed out waiting to clear messages/expected after ${timeout / 1000.0}s`);
                resolve();
            }, timeout);
            async function poll() {
                var messagesToRemove = [];
                var expectingToRemove = [];
                for (var qi = 0; qi < messageQueue.length; ++qi) {
                    for (var ei = 0; ei < expectingList.length; ++ei) {
                        const message = messageQueue[qi];
                        const expected = expectingList[ei];
                        if (expected.type == message.type) {
                            messagesToRemove.push(qi);
                            expectingToRemove.push(ei);
                            expected.handler(message);
                        }
                    }
                }
                for (var i = messagesToRemove.length - 1; i >= 0; --i) {
                    messageQueue.splice(messagesToRemove[i], 1);
                }
                for (var i = expectingToRemove.length - 1; i >= 0; --i) {
                    expectingList.splice(expectingToRemove[i], 1);
                }

                if (expectingList.length > 0 || messageQueue.length > 0) {
                    setTimeout(poll, 50);
                } else {
                    clearTimeout(timeoutTimer);
                    resolve();
                }
            }
            poll();
        });

        pollingPromise
            .then(() => {
                var success = true;

                if (this.expecting.length > 0) {
                    console.log(`${this.name}: Failed to receive expected messages:`);
                    for (const expected of this.expecting) {
                        console.log(`    ${expected.type}`);
                    }
                    success = false;
                }

                if (this.messageQueue.length > 0) {
                    console.log(`${this.name}: Messages in message queue:`);
                    for (const message of this.messageQueue) {
                        console.log(`    ${message.type}`);
                    }
                    success = false;
                }

                console.log(`${this.name}: Validation ${success?'successful':'failure'}.`);

                this.expecting = [];
                this.messageQueue = [];
            });

        return pollingPromise;
    }
}

async function main() {

    const streamer = new SSConnection('Streamer', config.streamerURL);
    
    streamer.expect('config', (msg) => {});
    streamer.expect('identify', (msg) => {
        const replyMessage = {
            type: 'endpointId',
            id: config.streamerId
        };
        streamer.sendMessage(replyMessage);
    });

    const player = new SSConnection('Player', config.playerURL);

    player.expect('config', (msg) => {});
    player.expect('playerCount', (msg) => {});

    var streamerPhase = streamer.validate(3000);
    var playerPhase = player.validate(3000);

    await Promise.all([streamerPhase, playerPhase]);

    player.sendMessage({type: 'listStreamers'});

    player.expect('streamerList', (msg) => {
        if (!msg.ids.includes(config.streamerId)) {
            console.log(`Streamer id ${config.streamerId} isnt included in streamer list.`);
        } else {
            player.sendMessage({type:'subscribe', streamerId: config.streamerId});
        }
    });

    streamer.expect('playerConnected', (msg) => {
        streamer.sendMessage({type: 'offer', sdp: 'mock sdp', playerId: msg.playerId});
    });

    player.expect('offer', (msg) => {
        if (msg.sdp != 'mock sdp') {
            console.log('got a bad offer payload');
        } else {
            player.sendMessage({type: 'answer', sdp: 'mock answer'});
        }
    });

    streamer.expect('answer', (msg) => {
        if (msg.sdp != 'mock answer') {
            console.log('got a bad answer payload');
        } else {

        }
    });

    streamerPhase = streamer.validate(3000);
    playerPhase = player.validate(3000);
    await Promise.all([streamerPhase, playerPhase]);

    console.log('Done.');
    process.exit(0);
}

main();

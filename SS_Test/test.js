const config = require('./config');
const SignallingConnection = require('./modules/signalling_tester.js');
const assert = require('node:assert/strict');

var failed = false;

function logFunction(connection, message) {
    console.log(`${connection.name}: ${message}`);
}

function processSuccess(connection) {
    console.log(`${connection.name}: Successful stage.`);
}

function processFailed(connection, errors, unsatisfiedExpects, unhandledEvents) {
    console.log(`${connection.name}: Failed stage.`);

    if (errors.length > 0) {
        console.log(`    Errors:`);
        for (const error of errors) {
            console.log(`        ${error}`);
        }
    }

    if (unsatisfiedExpects.length > 0) {
        const unsatisfiedMessages = unsatisfiedExpects.filter((expect) => expect.type == 'message');
        const unsatisfiedSocketEvents = unsatisfiedExpects.filter((expect) => expect.type == 'socketEvent');
        if (unsatisfiedMessages.length > 0) {
            console.log(`    Failed to receive expected messages:`);
            for (const expected of unsatisfiedMessages) {
                console.log(`        ${expected.match}`);
            }
        }
        if (unsatisfiedSocketEvents.length > 0) {
            console.log(`    Failed to receive expected socket events:`);
            for (const expected of unsatisfiedSocketEvents) {
                console.log(`        ${expected.match}`);
            }
        }
    }

    if (unhandledEvents.length > 0) {
        const unhandledMessages = unhandledEvents.filter((event) => event.type == 'message');
        const unhandledSocketEvents = unhandledEvents.filter((event) => event.type != 'message');
        if (unhandledMessages.length > 0) {
            console.log(`    Messages not handled:`);
            for (const message of unhandledMessages) {
                console.log(`        ${message.data.type}`);
            }
        }
        if (unhandledSocketEvents.length > 0) {
            console.log(`    Events not handled:`);
            for (const message of unhandledSocketEvents) {
                console.log(`        ${message.type}`);
            }
        }
    }

    failed = true;
}

function newConnection(name, url) {
    const connection = new SignallingConnection(name, url);
    connection.setLogCallback(logFunction);
    connection.setSuccessCallback(processSuccess);
    connection.setFailedCallback(processFailed);
    return connection;
}

async function main() {

    // test initial connections
    const streamer = newConnection('Streamer', config.streamerURL);
    
    streamer.addExpectEvent('socketOpen', (event) => {});
    streamer.addExpect('config', (msg) => {});
    streamer.addExpect('identify', (msg) => {
        const replyMessage = {
            type: 'endpointId',
            id: config.streamerId
        };
        streamer.sendMessage(replyMessage);
    });

    var playerId = null;
    var player = newConnection('Player', config.playerURL);

    player.addExpectEvent('socketOpen', (event) => {});
    player.addExpect('config', (msg) => {});
    player.addExpect('playerCount', (msg) => {});

    var streamerPhase = streamer.processMessages(3000);
    var playerPhase = player.processMessages(3000);
    await Promise.all([streamerPhase, playerPhase]);

    if (failed) {
        process.exit(0);
    }

    // test subscribing

    player.sendMessage({type: 'listStreamers'});

    player.addExpect('streamerList', (msg) => {
        if (!msg.ids.includes(config.streamerId)) {
            console.log(`Streamer id ${config.streamerId} isnt included in streamer list.`);
        } else {
            player.sendMessage({type:'subscribe', streamerId: config.streamerId});
        }
    });

    streamer.addExpect('playerConnected', (msg) => {
        playerId = msg.playerId;
        streamer.sendMessage({type: 'offer', sdp: 'mock sdp', playerId: msg.playerId});
    });

    player.addExpect('offer', (msg) => {
        if (msg.sdp != 'mock sdp') {
            console.log('got a bad offer payload');
        } else {
            player.sendMessage({type: 'answer', sdp: 'mock answer'});
        }
    });

    streamer.addExpect('answer', (msg) => {
        if (msg.sdp != 'mock answer') {
            console.log('got a bad answer payload');
        } else {
            streamer.sendMessage({type: 'iceCandidate', playerId: msg.playerId, candidate: 'mock ice candidate'});
        }
    });

    player.addExpect('iceCandidate', (msg) => {
        assert(msg.candidate == 'mock ice candidate');
    })

    streamerPhase = streamer.processMessages(3000);
    playerPhase = player.processMessages(3000);
    await Promise.all([streamerPhase, playerPhase]);

    if (failed) {
        process.exit(0);
    }

    // test force disconnect player

    streamer.sendMessage({type: 'disconnectPlayer', playerId: playerId});
    player.addExpectEvent('socketClose', (event) => {});
    streamer.addExpect('playerDisconnected', (msg) => {});

    streamerPhase = streamer.processMessages(3000);
    playerPhase = player.processMessages(3000);
    await Promise.all([streamerPhase, playerPhase]);

    // reconnect and test disconnect player

    player = newConnection('Player', config.playerURL);
    player.addExpectEvent('socketOpen', (event) => {});
    player.addExpect('config', (msg) => {});
    player.addExpect('playerCount', (msg) => {
        player.sendMessage({type: 'listStreamers'});
    });
    player.addExpect('streamerList', (msg) => {
        player.sendMessage({type:'subscribe', streamerId: config.streamerId});
    });
    streamer.addExpect('playerConnected', (msg) => {
        playerId = msg.playerId;
        streamer.sendMessage({type: 'offer', sdp: 'mock sdp', playerId: msg.playerId});
    });
    player.addExpect('offer', (msg) => {
        player.close(1000, "Done");
    });
    streamer.addExpect('playerDisconnected', (msg) => {});

    streamerPhase = streamer.processMessages(3000);
    playerPhase = player.processMessages(3000);
    await Promise.all([streamerPhase, playerPhase]);

    console.log('Done.');
    process.exit(0);
}

main();

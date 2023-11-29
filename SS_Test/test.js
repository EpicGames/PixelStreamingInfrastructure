const config = require('./config');
const SignallingConnection = require('./modules/signalling_tester.js');

function logFunction(connection, message) {
    console.log(`${connection.name}: ${message}`);
}

function processSuccess(connection) {
    console.log(`${connection.name}: Successful stage.`);
}

function processFailed(connection, errors, unsatisfiedExpects, unhandledMessages) {
    console.log(`${connection.name}: Failed stage.`);

    if (errors.length > 0) {
        console.log(`    Errors:`);
        for (const error of errors) {
            console.log(`        ${error}`);
        }
    }

    if (unsatisfiedExpects.length > 0) {
        console.log(`    Failed to receive expected messages:`);
        for (const expected of unsatisfiedExpects) {
            console.log(`        ${expected}`);
        }
    }

    if (unhandledMessages.length > 0) {
        console.log(`    Messages not handled:`);
        for (const message of unhandledMessages) {
            console.log(`        ${message.type}`);
        }
    }

    process.exit(1);
}

function newConnection(name, url) {
    const connection = new SignallingConnection(name, url);
    connection.setLogCallback(logFunction);
    connection.setSuccessCallback(processSuccess);
    connection.setFailedCallback(processFailed);
    return connection;
}

async function main() {

    const streamer = newConnection('Streamer', config.streamerURL);
    
    streamer.addExpect('config', (msg) => {});
    streamer.addExpect('identify', (msg) => {
        const replyMessage = {
            type: 'endpointId',
            id: config.streamerId
        };
        streamer.sendMessage(replyMessage);
    });

    const player = newConnection('Player', config.playerURL);

    player.addExpect('config', (msg) => {});
    player.addExpect('playerCount', (msg) => {});

    var streamerPhase = streamer.processMessages(3000);
    var playerPhase = player.processMessages(3000);

    await Promise.all([streamerPhase, playerPhase]);

    player.sendMessage({type: 'listStreamers'});

    player.addExpect('streamerList', (msg) => {
        if (!msg.ids.includes(config.streamerId)) {
            console.log(`Streamer id ${config.streamerId} isnt included in streamer list.`);
        } else {
            player.sendMessage({type:'subscribe', streamerId: config.streamerId});
        }
    });

    streamer.addExpect('playerConnected', (msg) => {
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

        }
    });

    streamerPhase = streamer.processMessages(3000);
    playerPhase = player.processMessages(3000);
    await Promise.all([streamerPhase, playerPhase]);

    console.log('Done.');
    process.exit(0);
}

main();

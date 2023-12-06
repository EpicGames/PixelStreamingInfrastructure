import {
    SignallingConnection,
    Expected,
    ExpectedMessage,
    ExpectedEvent,
    Event,
    MessageEvent,
    SocketEvent,
    ErrorEvent } from './signalling_tester';
import config from './config';
import assert from 'assert';

let failed: boolean = false;

function logFunction(connection: SignallingConnection, message: string): void {
    console.log(`${connection.name}: ${message}`);
}

function processSuccess(connection: SignallingConnection): void {
    console.log(`${connection.name}: Successful stage.`);
}

function processFailed(
    connection: SignallingConnection,
    unsatisfiedExpects: Expected[],
    unhandledEvents: Event[]
): void {
    console.log(`${connection.name}: Failed stage.`);

    const unsatisfiedMessages = unsatisfiedExpects.filter((expect) => expect.type == 'message') as ExpectedMessage[];
    const unsatisfiedSocketEvents = unsatisfiedExpects.filter((expect) => expect.type == 'socket') as ExpectedEvent[];
    const unhandledMessages = unhandledEvents.filter((event) => event.type == 'message') as MessageEvent[];
    const unhandledSocketEvents = unhandledEvents.filter((event) => event.type == 'socket') as SocketEvent[];
    const errors = unhandledEvents.filter((event) => event.type == 'error') as ErrorEvent[];

    if (unsatisfiedMessages.length > 0) {
        console.log(`    Failed to receive expected messages:`);
        for (const expected of unsatisfiedMessages) {
            console.log(`        ${expected.messageType}`);
        }
    }

    if (unsatisfiedSocketEvents.length > 0) {
        console.log(`    Failed to receive expected socket events:`);
        for (const expected of unsatisfiedSocketEvents) {
            console.log(`        ${expected.eventType}`);
        }
    }

    if (unhandledMessages.length > 0) {
        console.log(`    Messages not handled:`);
        for (const message of unhandledMessages) {
            console.log(`        ${message.message.type}`);
        }
    }

    if (unhandledSocketEvents.length > 0) {
        console.log(`    Events not handled:`);
        for (const message of unhandledSocketEvents) {
            console.log(`        ${message.eventType}`);
        }
    }

    if (errors.length > 0) {
        console.log(`    Errors:`);
        for (const error of errors) {
            console.log(`        ${error}`);
        }
    }

    failed = true;
}

function newConnection(name: string, url: string): SignallingConnection {
    const connection = new SignallingConnection(name, url);
    connection.setLogCallback(logFunction);
    connection.setSuccessCallback(processSuccess);
    connection.setFailedCallback(processFailed);
    return connection;
}

async function main(): Promise<void> {
    // test initial connections
    const streamer: SignallingConnection = newConnection('Streamer', config.streamerURL);

    streamer.addEventExpect('open', (event: any) => {});
    streamer.addExpect('config', (msg: any) => {});
    streamer.addExpect('identify', (msg: any) => {
        const replyMessage = {
            type: 'endpointId',
            id: config.streamerId
        };
        streamer.sendMessage(replyMessage);
    });

    let playerId: string | null = null;
    let player: SignallingConnection = newConnection('Player', config.playerURL);

    player.addEventExpect('open', (event: any) => {});
    player.addExpect('config', (msg: any) => {});
    player.addExpect('playerCount', (msg: any) => {});

    let streamerPhase = streamer.processMessages(3000);
    let playerPhase = player.processMessages(3000);
    await Promise.all([streamerPhase, playerPhase]);

    if (failed) {
        process.exit(0);
    }

    // test subscribing

    player.sendMessage({ type: 'listStreamers' });

    player.addExpect('streamerList', (msg: any) => {
        if (!msg.ids.includes(config.streamerId)) {
            console.log(`Streamer id ${config.streamerId} isnt included in streamer list.`);
        } else {
            player.sendMessage({ type: 'subscribe', streamerId: config.streamerId });
        }
    });

    streamer.addExpect('playerConnected', (msg: any) => {
        playerId = msg.playerId;
        streamer.sendMessage({ type: 'offer', sdp: 'mock sdp', playerId: msg.playerId });
    });

    player.addExpect('offer', (msg: any) => {
        if (msg.sdp != 'mock sdp') {
            console.log('got a bad offer payload');
        } else {
            player.sendMessage({ type: 'answer', sdp: 'mock answer' });
        }
    });

    streamer.addExpect('answer', (msg: any) => {
        if (msg.sdp != 'mock answer') {
            console.log('got a bad answer payload');
        } else {
            streamer.sendMessage({ type: 'iceCandidate', playerId: msg.playerId, candidate: 'mock ice candidate' });
        }
    });

    player.addExpect('iceCandidate', (msg: any) => {
        assert(msg.candidate == 'mock ice candidate');
    });

    streamerPhase = streamer.processMessages(3000);
    playerPhase = player.processMessages(3000);
    await Promise.all([streamerPhase, playerPhase]);

    if (failed) {
        process.exit(0);
    }

    // test force disconnect player

    streamer.sendMessage({ type: 'disconnectPlayer', playerId: playerId });
    player.addEventExpect('close', (event: any) => {});
    streamer.addExpect('playerDisconnected', (msg: any) => {});

    streamerPhase = streamer.processMessages(3000);
    playerPhase = player.processMessages(3000);
    await Promise.all([streamerPhase, playerPhase]);

    // reconnect and test disconnect player

    player = newConnection('Player', config.playerURL);
    player.addEventExpect('open', (event: any) => {});
    player.addExpect('config', (msg: any) => {});
    player.addExpect('playerCount', (msg: any) => {
        player.sendMessage({ type: 'listStreamers' });
    });
    player.addExpect('streamerList', (msg: msg) => {
        player.sendMessage({ type: 'subscribe', streamerId: config.streamerId });
    });
    streamer.addExpect('playerConnected', (msg: any) => {
        playerId = msg.playerId;
        streamer.sendMessage({ type: 'offer', sdp: 'mock sdp', playerId: msg.playerId });
    });
    player.addExpect('offer', (msg: any) => {
        player.close(1000, 'Done');
    });
    streamer.addExpect('playerDisconnected', (msg: any) => {});

    streamerPhase = streamer.processMessages(3000);
    playerPhase = player.processMessages(3000);
    await Promise.all([streamerPhase, playerPhase]);

    console.log('Done.');
    process.exit(0);
}

main();

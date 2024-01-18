import { TestContext, SignallingConnection } from './signalling_tester';
import config from './config';
import assert from 'assert';

function logFunction(connection: SignallingConnection, message: string): void {
    console.log(`${connection.name}: ${message}`);
}

function onFailedPhase(phaseName: string, context: TestContext) {
    console.log(`Phase '${phaseName}' failed.`);
    for (let error of context.errors) {
        console.log(`  ${error}`);
    }
    process.exit(0);
}

async function main(): Promise<void> {

    // test initial connections
    const context = new TestContext(logFunction);
    const streamer: SignallingConnection = context.newConnection('Streamer', config.streamerURL);

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
    let player: SignallingConnection = context.newConnection('Player', config.playerURL);

    player.addEventExpect('open', (event: any) => {});
    player.addExpect('config', (msg: any) => {});
    player.addExpect('playerCount', (msg: any) => {});

    let streamerPhase = streamer.processMessages(3000);
    let playerPhase = player.processMessages(3000);
    if (!await context.validatePhases([streamerPhase, playerPhase])) {
        onFailedPhase('initial connection', context);
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

    const mockSpdPayload = 'mock sdp';
    const mockAnswerPayload = 'mock answer';
    const mockIceCandidatePayload = 'mock ice candidate';

    streamer.addExpect('playerConnected', (msg: any) => {
        playerId = msg.playerId;
        streamer.sendMessage({ type: 'offer', sdp: mockSpdPayload, playerId: msg.playerId });
    });

    player.addExpect('offer', (msg: any) => {
        if (msg.sdp != mockSpdPayload) {
            console.log('got a bad offer payload');
        } else {
            player.sendMessage({ type: 'answer', sdp: mockAnswerPayload });
        }
    });

    
    streamer.addExpect('answer', (msg: any) => {
        if (msg.sdp != mockAnswerPayload) {
            console.log('got a bad answer payload');
        } else {
            streamer.sendMessage({ type: 'iceCandidate', playerId: msg.playerId, candidate: mockIceCandidatePayload });
        }
    });

    player.addExpect('iceCandidate', (msg: any) => {
        if (msg.candidate != mockIceCandidatePayload) {
            console.log('got a bad ice candidate payload');
        }
    });

    streamerPhase = streamer.processMessages(3000);
    playerPhase = player.processMessages(3000);
    if (!await context.validatePhases([streamerPhase, playerPhase])) {
        onFailedPhase('subscribing', context);
    }

    // test force disconnect player

    streamer.sendMessage({ type: 'disconnectPlayer', playerId: playerId });
    player.addEventExpect('close', (event: any) => {});
    streamer.addExpect('playerDisconnected', (msg: any) => {});

    streamerPhase = streamer.processMessages(3000);
    playerPhase = player.processMessages(3000);
    if (!await context.validatePhases([streamerPhase, playerPhase])) {
        onFailedPhase('force disconnect', context);
    }

    // reconnect and test disconnect player

    player = context.newConnection('Player', config.playerURL);
    player.addEventExpect('open', (event: any) => {});
    player.addExpect('config', (msg: any) => {});
    player.addExpect('playerCount', (msg: any) => {
        player.sendMessage({ type: 'listStreamers' });
    });
    player.addExpect('streamerList', (msg: any) => {
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
    if (!await context.validatePhases([streamerPhase, playerPhase])) {
        onFailedPhase('disconnect notify', context);
    }

    console.log('Done.');
    process.exit(0);
}

main();

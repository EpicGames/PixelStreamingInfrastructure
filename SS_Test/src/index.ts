import { TestContext, SignallingConnection } from './signalling_tester';
import config from './config';
import assert from 'assert';
import * as Messages from './messages';

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
    streamer.addExpect(Messages.config, (msg: Messages.config) => {});
    streamer.addExpect(Messages.identify, (msg: Messages.identify) => streamer.sendMessage(Messages.endpointId, { id: config.streamerId }));

    let playerId: string | null = null;
    let player: SignallingConnection = context.newConnection('Player', config.playerURL);

    player.addEventExpect('open', (event: any) => {});
    player.addExpect(Messages.config, (msg: Messages.config) => {});
    player.addExpect(Messages.playerCount, (msg: Messages.playerCount) => {});

    if (!await context.validateStep(3000, [streamer, player])) {
        onFailedPhase('initial connection', context);
    }

    // test subscribing

    player.sendMessage(Messages.listStreamers);

    player.addExpect(Messages.streamerList, (msg: Messages.streamerList) => {
        if (!msg.ids.includes(config.streamerId)) {
            console.log(`Streamer id ${config.streamerId} isnt included in streamer list.`);
        } else {
            player.sendMessage(Messages.subscribe, { streamerId: config.streamerId });
        }
    });

    const mockSpdPayload = 'mock sdp';
    const mockAnswerPayload = 'mock answer';
    const mockIceCandidatePayload = 'mock ice candidate';

    streamer.addExpect(Messages.playerConnected, (msg: Messages.playerConnected) => {
        if (!msg.playerId) {
            console.log('expected player id');
        } else {
            playerId = msg.playerId;
            streamer.sendMessage(Messages.offer, { sdp: mockSpdPayload, playerId: msg.playerId });
        }
    });

    player.addExpect(Messages.offer, (msg: Messages.offer) => {
        if (msg.sdp != mockSpdPayload) {
            console.log('got a bad offer payload');
        } else {
            player.sendMessage(Messages.answer, { sdp: mockAnswerPayload });
        }
    });

    
    streamer.addExpect(Messages.answer, (msg: Messages.answer) => {
        if (msg.sdp != mockAnswerPayload) {
            console.log('got a bad answer payload');
        } else {
            streamer.sendMessage(Messages.iceCandidate, { playerId: msg.playerId, candidate: mockIceCandidatePayload });
        }
    });

    player.addExpect(Messages.iceCandidate, (msg: Messages.iceCandidate) => {
        if (msg.candidate != mockIceCandidatePayload) {
            console.log('got a bad ice candidate payload');
        }
    });

    if (!await context.validateStep(3000, [streamer, player])) {
        onFailedPhase('subscribing', context);
    }

    // test force disconnect player

    streamer.sendMessage(Messages.disconnectPlayer, { playerId: playerId });
    player.addEventExpect('close', (event: any) => {});
    streamer.addExpect(Messages.playerDisconnected, (msg: Messages.playerDisconnected) => {});

    if (!await context.validateStep(3000, [streamer, player])) {
        onFailedPhase('force disconnect', context);
    }

    // reconnect and test disconnect player

    player = context.newConnection('Player', config.playerURL);
    player.addEventExpect('open', (event: any) => {});
    player.addExpect(Messages.config, (msg: Messages.config) => {});
    player.addExpect(Messages.playerCount, (msg: Messages.playerCount) => player.sendMessage(Messages.listStreamers));
    player.addExpect(Messages.streamerList, (msg: Messages.streamerList) => player.sendMessage(Messages.subscribe, { streamerId: config.streamerId }));
    streamer.addExpect(Messages.playerConnected, (msg: Messages.playerConnected) => {
        if (!msg.playerId) {
            console.log('expected player id');
        } else {
            playerId = msg.playerId;
            streamer.sendMessage(Messages.offer, { sdp: 'mock sdp', playerId: msg.playerId });
        }
    });
    player.addExpect(Messages.offer, (msg: Messages.offer) => player.close(1000, 'Done'));
    streamer.addExpect(Messages.playerDisconnected, (msg: Messages.playerDisconnected) => {});

    if (!await context.validateStep(3000, [streamer, player])) {
        onFailedPhase('disconnect notify', context);
    }

    console.log('Done.');
    process.exit(0);
}

main();

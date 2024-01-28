import { TestContext, SignallingConnection } from './signalling_tester';
import config from './config';
import assert from 'assert';
import * as Messages from './signalling_messages';
import WebSocket from 'ws';

function logFunction(connection: SignallingConnection, message: string): void {
    console.log(`${connection.name}: ${message}`);
}

function onFailedPhase(phaseName: string, context: TestContext) {
    console.log(`Phase '${phaseName}' failed.`);
    for (let error of context.errors) {
        console.log(`  ${error}`);
    }
    process.exit(1);
}

function areObjectsEqual(obj1: any, obj2: any) {
  const entries1 = Object.entries(obj1);
  const entries2 = Object.entries(obj2);

  return (
    entries1.length === entries2.length &&
    entries1.every(([key, value]) => obj2.hasOwnProperty(key) && obj2[key] === value)
  );
}

// mocks a streamer and a player and checks some basic negotiations/interactions between them
// validating the results as we go.
// this happens in a series of "steps" that are validated by receiving a collection of expected
// events.
async function main(): Promise<void> {

    // test initial connections
    const context = new TestContext(logFunction);
    const streamer: SignallingConnection = context.newConnection('Streamer', config.streamerURL);

    streamer.addEventExpect('open', (event: WebSocket.Event) => {});
    streamer.addExpect(Messages.config, (msg: Messages.config) => {});
    streamer.addExpect(Messages.identify, (msg: Messages.identify) => streamer.sendMessage(Messages.endpointId, { id: config.streamerId }));

    let playerId: string | null = null;
    let player: SignallingConnection = context.newConnection('Player', config.playerURL);

    player.addEventExpect('open', (event: WebSocket.Event) => {});
    player.addExpect(Messages.config, (msg: Messages.config) => {});
    player.addExpect(Messages.playerCount, (msg: Messages.playerCount) => {});

    if (!await context.validateStep(3000, [streamer, player])) {
        onFailedPhase('initial connection', context);
    }

    // test subscribing

    player.sendMessage(Messages.listStreamers);

    player.addExpect(Messages.streamerList, (msg: Messages.streamerList) => {
        if (!msg.ids.includes(config.streamerId)) {
            return `Streamer id ${config.streamerId} isnt included in streamer list.`;
        } else {
            player.sendMessage(Messages.subscribe, { streamerId: config.streamerId });
        }
    });

    const mockSpdPayload = 'mock sdp';
    const mockAnswerPayload = 'mock answer';
    const mockIceCandidatePayload = { candidate: 'candidate1', sdpMid: 'spd mid', sdpMLineIndex: 0, usernameFragment: "frag1" };

    streamer.addExpect(Messages.playerConnected, (msg: Messages.playerConnected) => {
        playerId = msg.playerId!;
        streamer.sendMessage(Messages.offer, { sdp: mockSpdPayload, playerId: msg.playerId });
    });

    player.addExpect(Messages.offer, (msg: Messages.offer) => {
        if (msg.sdp != mockSpdPayload) {
            return 'Offer SDP payload did not match.';
        } else {
            player.sendMessage(Messages.answer, { sdp: mockAnswerPayload });
        }
    });

    streamer.addExpect(Messages.answer, (msg: Messages.answer) => {
        if (msg.sdp != mockAnswerPayload) {
            return 'Answer SDP payload did not match.';
        } else {
            streamer.sendMessage(Messages.iceCandidate, { playerId: msg.playerId, candidate: mockIceCandidatePayload });
        }
    });

    player.addExpect(Messages.iceCandidate, (msg: Messages.iceCandidate) => {
        if (!areObjectsEqual(msg.candidate, mockIceCandidatePayload)) {
            return 'ICE candidate payload did not match.';
        }
    });

    if (!await context.validateStep(3000, [streamer, player])) {
        onFailedPhase('subscribing', context);
    }

    // test force disconnect player

    streamer.sendMessage(Messages.disconnectPlayer, { playerId: playerId });
    player.addEventExpect('close', (event: WebSocket.Event) => {});
    streamer.addExpect(Messages.playerDisconnected, (msg: Messages.playerDisconnected) => {});

    if (!await context.validateStep(3000, [streamer, player])) {
        onFailedPhase('force disconnect', context);
    }

    // reconnect and test disconnect player

    player = context.newConnection('Player', config.playerURL);
    player.addEventExpect('open', (event: WebSocket.Event) => {});
    player.addExpect(Messages.config, (msg: Messages.config) => {});
    player.addExpect(Messages.playerCount, (msg: Messages.playerCount) => player.sendMessage(Messages.listStreamers));
    player.addExpect(Messages.streamerList, (msg: Messages.streamerList) => player.sendMessage(Messages.subscribe, { streamerId: config.streamerId }));
    streamer.addExpect(Messages.playerConnected, (msg: Messages.playerConnected) => {
        playerId = msg.playerId!;
        streamer.sendMessage(Messages.offer, { sdp: 'mock sdp', playerId: msg.playerId });
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

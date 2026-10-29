// Copyright Epic Games, Inc. All Rights Reserved.
import { BaseMessage } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.8';
import { StreamerConnection } from './StreamerConnection';
import { SignallingServer } from './SignallingServer';

// The streamer's own addresses, which must not reach the player, and the relay's, which must.
const LAN_IP = '192.168.1.20';
const PUBLIC_IP = '147.32.71.8';
const RELAY_IP = '203.0.113.10'; // RFC 5737 documentation address
const HOST = `candidate:1 1 udp 2122260223 ${LAN_IP} 54321 typ host generation 0`;
const RELAY = `candidate:2 1 udp 41885439 ${RELAY_IP} 49218 typ relay raddr ${PUBLIC_IP} rport 54321 generation 0`;

// The constructor wants a live websocket. Forwarding needs only the server config, the player registry
// and the subscriber set, so those are supplied directly - the approach SignallingServer.test.ts takes.
function streamerForwardingTo(hideStreamerAddresses: boolean) {
    const sent: BaseMessage[] = [];
    const player = {
        getReadableIdentifier: () => 'player-1',
        protocol: { sendMessage: (message: BaseMessage) => sent.push(message) }
    };
    const streamer = Object.create(StreamerConnection.prototype) as StreamerConnection;
    streamer.streamerId = 'streamer-1';
    streamer.subscribers = new Set(['player-1']);
    Object.assign(streamer, {
        server: {
            config: { hideStreamerAddresses },
            playerRegistry: { get: () => player }
        } as unknown as SignallingServer
    });
    // Private: reached through the type system, because what is under test is what a player receives.
    const forward = (message: BaseMessage) =>
        (streamer as unknown as { forwardMessage(message: BaseMessage): void }).forwardMessage(message);
    return { forward, sent };
}

function iceCandidate(candidate: string): BaseMessage {
    return {
        type: 'iceCandidate',
        playerId: 'player-1',
        candidate: { candidate, sdpMid: '0', sdpMLineIndex: 0 }
    } as BaseMessage;
}

describe('StreamerConnection forwarding with hideStreamerAddresses', () => {
    it('does not forward a host candidate at all', () => {
        const { forward, sent } = streamerForwardingTo(true);
        forward(iceCandidate(HOST));
        expect(sent).toEqual([]);
    });

    it('forwards a relay candidate with the public address taken out of it', () => {
        const { forward, sent } = streamerForwardingTo(true);
        forward(iceCandidate(RELAY));
        expect(sent).toHaveLength(1);
        expect(JSON.stringify(sent)).toContain(RELAY_IP);
        expect(JSON.stringify(sent)).not.toContain(PUBLIC_IP);
    });

    it.each(['offer', 'answer'])('scrubs the SDP of an %s', (type) => {
        const { forward, sent } = streamerForwardingTo(true);
        const sdp = `v=0\r\nc=IN IP4 ${PUBLIC_IP}\r\na=${HOST}\r\na=${RELAY}\r\n`;
        forward({ type, playerId: 'player-1', sdp } as BaseMessage);
        expect(sent).toHaveLength(1);
        expect(JSON.stringify(sent)).toContain(RELAY_IP);
        expect(JSON.stringify(sent)).not.toContain(PUBLIC_IP);
        expect(JSON.stringify(sent)).not.toContain(LAN_IP);
    });

    it('forwards everything exactly as sent when the option is off', () => {
        const { forward, sent } = streamerForwardingTo(false);
        const host = iceCandidate(HOST);
        forward(host);
        expect(sent).toEqual([host]);
    });
});

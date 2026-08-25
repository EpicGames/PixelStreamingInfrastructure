const config = require('./config');
const WebSocket = require('ws');
const mediasoup = require('mediasoup');
const mediasoupSdp = require('@epicgames-ps/mediasoup-sdp-bridge');
const minimist = require('minimist');

if (!config.retrySubscribeDelaySecs) {
    config.retrySubscribeDelaySecs = 10;
}

let signalServer = null;
let mediasoupRouter;
let streamer = null;
let peers = new Map();
let dataRouter;
let scalabilityMode = "L1T1"; // Scalability mode defaults to L1T1 and is set by the offer from the streamer

async function createDataRouter() {
    const MULTIPLEX_MESSAGE_ID = 199; // ID | 2 byte length | PlayerId | Original message
    const CHANNEL_RELAY_STATUS_MESSAGE_ID = 198; // ID | 2 byte length | PlayerId | 1 byte flag

    if (!mediasoupRouter) {
        console.error('cannot initialize direct transport, router is undefined');
        throw new Error('mediasoupRouter is undefined');
    }
    const transport = await mediasoupRouter.createDirectTransport({ maxMessageSize: 262144 });

    let streamerProducer;
    const producers = {};

    function createMultiplexHeader(playerId) {
        const byteLength = 1 + 2 + playerId.length * 2;
        const buffer = Buffer.alloc(byteLength);
        let byteOffset = 0;
        buffer.writeUInt8(MULTIPLEX_MESSAGE_ID, byteOffset);
        byteOffset++;
        buffer.writeUInt16LE(playerId.length * 2, byteOffset);
        byteOffset += 2;
        for (let i = 0; i < playerId.length; i++) {
            buffer.writeUInt16LE(playerId.charCodeAt(i), byteOffset);
            byteOffset += 2;
        }
        return buffer;
    }

    function parseMultiplexHeader(message) {
        const type = message.readUInt8(0);
        if (type !== MULTIPLEX_MESSAGE_ID) {
            console.log("Received non multiplexed message type [%d]", type);
            return {
                playerId: ""
            };
        }
        const length = message.readUInt16LE(1);
        const headerEnd = length + 3;
        return {
            playerId: new TextDecoder("utf-16").decode(message.subarray(3, headerEnd)),
            buffer: message.subarray(headerEnd, message.length)
        }
    }

    function createRelayStatusMessage(playerId, status) {
        const byteLength = 1 + 2 + playerId.length * 2 + 1;
        const buffer = Buffer.alloc(byteLength);
        let byteOffset = 0;
        buffer.writeUInt8(CHANNEL_RELAY_STATUS_MESSAGE_ID, byteOffset);
        byteOffset++;
        buffer.writeUInt16LE(playerId.length * 2, byteOffset);
        byteOffset += 2;
        for (let i = 0; i < playerId.length; i++) {
            buffer.writeUInt16LE(playerId.charCodeAt(i), byteOffset);
            byteOffset += 2;
        }
        buffer.writeUInt8(status, byteOffset);
        return buffer;
    }

    async function handleStreamer(dataProducer) {
        const consumer = await transport.consumeData({ dataProducerId: dataProducer.id });
        consumer.on('message', (message, ppid) => {
            const relayMessage = parseMultiplexHeader(message);
            if (relayMessage.playerId !== "" && producers.hasOwnProperty(relayMessage.playerId)) {
                producers[relayMessage.playerId].send(relayMessage.buffer, 53);
            }
        });

        dataProducer.on('close', () => {
            streamerProducer.close();
            streamerProducer = undefined;
        });

        streamerProducer = await transport.produceData({ label: 'streamer-producer' });
        return streamerProducer.id;
    }

    async function handlePlayer(dataProducer, playerId) {
        streamerProducer.send(createRelayStatusMessage(playerId, 1), 53);

        const consumer = await transport.consumeData({ dataProducerId: dataProducer.id });
        consumer.on('message', (message, ppid) => {
            if (streamerProducer) {
                const relayMessage = Buffer.concat([createMultiplexHeader(playerId), message]);
                streamerProducer.send(relayMessage, 53);
            }
        });
        const playerProducer = await transport.produceData({ label: 'player-producer' });
        producers[playerId] = playerProducer;

        dataProducer.on('close', () => {
            producers[playerId].close();
            delete producers[playerId];
            streamerProducer.send(createRelayStatusMessage(playerId, 0), 53);
        });

        return playerProducer.id;
    }

    return {
        handleStreamer,
        handlePlayer
    };
}

function connectSignalling(server) {
    console.log("Connecting to Signalling Server at %s", server);
    signalServer = new WebSocket(server);
    signalServer.addEventListener("open", _ => { console.log(`Connected to signalling server`); });
    signalServer.addEventListener("error", result => { console.log(`Error: ${result.message}`); });
    signalServer.addEventListener("message", result => onSignallingMessage(result.data));
    signalServer.addEventListener("close", result => {
        onStreamerDisconnected();
        console.log(`Disconnected from signalling server: ${result.code} ${result.reason}`);
        console.log("Attempting reconnect to signalling server...");
        setTimeout(() => {
            connectSignalling(server);
        }, 2000);
    });
}

async function onStreamerList(msg) {
    let success = false;

    // If we're reconnecting, this SFU id will be in the streamer list. We want to remove it 
    // as we don't want to subscribe to ourself
    const index = msg.ids.indexOf(config.SFUId);
    if (index > -1) {
        msg.ids.splice(index, 1);
    }

    // subscribe to either the configured streamer, or if not configured, just grab the first id
    if (msg.ids.length > 0) {
        if (!!config.subscribeStreamerId && config.subscribeStreamerId.length != 0) {
            if (msg.ids.includes(config.subscribeStreamerId)) {
                signalServer.send(JSON.stringify({ type: 'subscribe', streamerId: config.subscribeStreamerId }));
                success = true;
            }
        } else {
            signalServer.send(JSON.stringify({ type: 'subscribe', streamerId: msg.ids[0] }));
            success = true;
        }
    }

    if (!success) {
        // did not subscribe to anything
        setTimeout(function() {
            signalServer.send(JSON.stringify({ type: 'listStreamers' }));
        }, config.retrySubscribeDelaySecs * 1000);
    }
}

async function onIdentify(msg) {
    signalServer.send(JSON.stringify({ type: 'endpointId', id: config.SFUId }));
    signalServer.send(JSON.stringify({ type: 'listStreamers' }));
}

async function onStreamerOffer(msg) {
    console.log("Got offer from streamer");

    if (streamer !== null) {
        signalServer.close(1013 /* Try again later */, 'Producer is already connected');
        return;
    }

    if (msg.scalabilityMode) {
        scalabilityMode = msg.scalabilityMode;
    }

    const transport = await createWebRtcTransport("Streamer");
    const sdpEndpoint = mediasoupSdp.createSdpEndpoint(transport, mediasoupRouter.rtpCapabilities);
    const { producers, dataEnabled } = await sdpEndpoint.processOffer(msg.sdp, scalabilityMode);
    const multiplex = msg.multiplex;
    const sdpAnswer = sdpEndpoint.createAnswer();
    const answer = { type: "answer", sdp: sdpAnswer };

    console.log("Sending answer to streamer.");
    signalServer.send(JSON.stringify(answer));
    streamer = { transport: transport, producers: producers, dataEnabled: dataEnabled, multiplexChannels: multiplex };
}

function getNextStreamerSCTPId() {
    return streamer.transport.getNextSctpStreamId();
}

function onStreamerDisconnected() {
    console.log("Streamer disconnected");
    disconnectAllPeers();

    if (streamer !== null) {
        for (const mediaProducer of streamer.producers) {
            mediaProducer.close();
        }
        streamer.transport.close();
        streamer = null;
        signalServer.send(JSON.stringify({ type: 'stopStreaming' }));

        setTimeout(function() {
            signalServer.send(JSON.stringify({ type: 'listStreamers' }));
        }, config.retrySubscribeDelaySecs * 1000);
    }
}

async function onPeerConnected(peerId) {
    console.log("Player %s joined", peerId);

    if (streamer === null) {
        console.log("No streamer connected, ignoring player.");
        return;
    }

    const transport = await createWebRtcTransport("Peer " + peerId);
    const sdpEndpoint = mediasoupSdp.createSdpEndpoint(transport, mediasoupRouter.rtpCapabilities);

    // media consumers
    let consumers = [];
    try {
        for (const mediaProducer of streamer.producers) {
            const consumer = await transport.consume({ producerId: mediaProducer.id, rtpCapabilities: mediasoupRouter.rtpCapabilities });
            consumer.observer.on("layerschange", function() { console.log("layer changed!", consumer.currentLayers); });
            sdpEndpoint.addConsumer(consumer);
            consumers.push(consumer);
        }
    } catch (err) {
        console.error("transport.consume() failed:", err);
        return;
    }

    // data
    if (streamer.dataEnabled) {
        sdpEndpoint.receiveData();
    }

    const offerSignal = {
        type: "offer",
        playerId: peerId,
        sdp: sdpEndpoint.createOffer(),
        sfu: true, // indicate we're offering from sfu
        scalabilityMode: scalabilityMode
    };

    // send offer to peer
    signalServer.send(JSON.stringify(offerSignal));

    const newPeer = {
        id: peerId,
        transport: transport,
        sdpEndpoint: sdpEndpoint,
        consumers: consumers
    };

    // add the new peer
    peers.set(peerId, newPeer);
}

async function setupPeerDataChannels(peerId) {
    const peer = peers.get(peerId);
    if (!peer) {
        console.error(`Could not send browser any datachannels for peer=${peerId} because peer was not found.`);
        return;
    }

    if (streamer.multiplexChannels) {
        await setupMultiplexPeerDataChannels(peer);
        return;
    }

    const nextStreamerSCTPStreamId = getNextStreamerSCTPId();
    const nextPeerSCTPStreamId = getNextStreamerSCTPId();

    console.log(`Attempting streamer SCTP id=${nextStreamerSCTPStreamId}`);

    // streamer data producer (produces data for the peer)
    peer.streamerDataProducer = await streamer.transport.produceData({ label: 'send-datachannel', sctpStreamParameters: { streamId: nextStreamerSCTPStreamId, ordered: true } });

    console.log(`Attempting peer SCTP id=${nextPeerSCTPStreamId}`);

    // peer data producer (produces data for the streamer)
    peer.peerDataProducer = await peer.transport.produceData({ label: 'send-datachannel', sctpStreamParameters: { streamId: nextPeerSCTPStreamId, ordered: true } });

    // peer data consumer (consumes streamer data)
    peer.peerDataConsumer = await peer.transport.consumeData({ dataProducerId: peer.streamerDataProducer.id });

    // streamer data consumer (consumes peer data)
    peer.streamerDataConsumer = await streamer.transport.consumeData({ dataProducerId: peer.peerDataProducer.id });

    const peerSignal = {
        type: 'peerDataChannels',
        playerId: peerId,
        sendStreamId: peer.peerDataProducer.sctpStreamParameters.streamId,
        recvStreamId: peer.peerDataConsumer.sctpStreamParameters.streamId
    };

    // Send browser a message with a send/recv data channel SCTP stream id
    signalServer.send(JSON.stringify(peerSignal));

}

async function setupMultiplexPeerDataChannels(peer) {
    //this will be always 0 as we are using only one producer
    const nextPeerSCTPStreamId = peer.transport.getNextSctpStreamId();
    peer.peerDataProducer = await peer.transport.produceData({ label: 'send-datachannel', sctpStreamParameters: { streamId: nextPeerSCTPStreamId, ordered: true } });

    const dataProducerId = await dataRouter.handlePlayer(peer.peerDataProducer, peer.id);
    peer.peerDataConsumer = await peer.transport.consumeData({ dataProducerId });
    console.log('peerProducerId %s, peerConsumerId %s', peer.peerDataProducer.id, peer.peerDataConsumer.id);

    const peerSignal = {
        type: 'peerDataChannels',
        playerId: peer.id,
        sendStreamId: peer.peerDataProducer.sctpStreamParameters.streamId,
        recvStreamId: peer.peerDataConsumer.sctpStreamParameters.streamId
    };
    signalServer.send(JSON.stringify(peerSignal));
}

async function setupStreamerDataChannelsForPeer(peerId) {
    if (streamer.multiplexChannels) {
        return;
    }

    const peer = peers.get(peerId);
    if (!peer) {
        console.error(`Could not send streamer any datachannels for peer=${peerId} because peer was not found.`);
        return;
    }

    if (!peer.streamerDataProducer || !peer.streamerDataConsumer) {
        console.error(`There was no streamer data producer/consumer setup for peer=${peerId}. Did you make sure to send "dataChannelRequest" first?`);
        return;
    }

    const streamerSignal = {
        type: "streamerDataChannels",
        playerId: peerId,
        sendStreamId: peer.streamerDataProducer.sctpStreamParameters.streamId,
        recvStreamId: peer.streamerDataConsumer.sctpStreamParameters.streamId
    };

    // send streamer a message with a send/recv data channel SCTP stream id
    signalServer.send(JSON.stringify(streamerSignal));
}

async function onPeerAnswer(peerId, sdp) {
    console.log("Got answer from player %s", peerId);

    const consumer = peers.get(peerId);
    if (!consumer) {
        console.error(`Unable to find player ${peerId}`);
    }
    else {
        consumer.sdpEndpoint.processAnswer(sdp);
    }
}

function onPeerDisconnected(peerId) {
    console.log("Player %s disconnected", peerId);
    const peer = peers.get(peerId);
    if (peer) {
        for (const consumer of peer.consumers) {
            consumer.close();
        }
        if (peer.peerDataConsumer) {
            peer.peerDataConsumer.close();
            peer.peerDataProducer.close();
        }
        if (peer.streamerDataConsumer) {
            peer.streamerDataConsumer.close();
            peer.streamerDataProducer.close();
        }
        peer.transport.close();
    }
    peers.delete(peerId);
}

function disconnectAllPeers() {
    console.log("Disconnected all players");
    for (const [peerId, peer] of peers) {
        onPeerDisconnected(peerId);
    }
}

function onLayerPreference(msg) {
    console.log("onLayerPreference: " + JSON.stringify(msg));
    const peer = peers.get(`${msg.playerId}`);
    if (peer) {
        for (const consumer of peer.consumers) {
            consumer.setPreferredLayers({ spatialLayer: msg.spatialLayer, temporalLayer: msg.temporalLayer });
        }
    }
}

async function onSignallingMessage(message) {
    //console.log(`Got MSG: ${message}`);
    let msg;
    try {
        msg = JSON.parse(message);
    } catch (e) {
        console.error('Failed to parse signalling message: %s', e.message);
        return;
    }

    if (msg.type === 'offer') {
        onStreamerOffer(msg);
    }
    else if (msg.type === 'answer') {
        onPeerAnswer(msg.playerId, msg.sdp);
    }
    else if (msg.type === 'playerConnected') {
        onPeerConnected(msg.playerId);
    }
    else if (msg.type === 'playerDisconnected') {
        onPeerDisconnected(msg.playerId);
    }
    else if (msg.type === 'streamerDisconnected') {
        onStreamerDisconnected();
    }
    else if (msg.type === 'dataChannelRequest') {
        setupPeerDataChannels(msg.playerId);
    }
    else if (msg.type === 'peerDataChannelsReady') {
        setupStreamerDataChannelsForPeer(msg.playerId);
    }
    else if (msg.type === 'layerPreference') {
        onLayerPreference(msg);
    }
    else if (msg.type === 'streamerList') {
        onStreamerList(msg);
    }
    else if (msg.type === 'identify') {
        onIdentify(msg);
    }
}

async function startMediasoup() {
    let worker = await mediasoup.createWorker({
        logLevel: config.mediasoup.worker.logLevel,
        logTags: config.mediasoup.worker.logTags,
        rtcMinPort: config.mediasoup.worker.rtcMinPort,
        rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
    });

    worker.on('died', () => {
        console.error('mediasoup worker died (this should never happen)');
        process.exit(1);
    });

    const mediaCodecs = config.mediasoup.router.mediaCodecs;
    const mediasoupRouter = await worker.createRouter({ mediaCodecs });

    return mediasoupRouter;
}

async function onICEStateChange(identifier, iceState) {
    console.log("%s ICE state changed to %s", identifier, iceState);

    if (identifier === 'Streamer' && iceState === 'completed') {
        if (streamer.multiplexChannels) {
            const nextStreamerSCTPStreamId = streamer.transport.getNextSctpStreamId();
            //this will always be 0 since we are using one producer only
            console.log(`Attempting streamer SCTP id=${nextStreamerSCTPStreamId}`);

            const producer = await streamer.transport.produceData({
                label: 'send-datachannel',
                sctpStreamParameters: { streamId: nextStreamerSCTPStreamId, ordered: true }
            });
            const dataProducerId = await dataRouter.handleStreamer(producer);
            const streamerDataConsumer = await streamer.transport.consumeData({ dataProducerId });
            console.log('Setting up sctp for the streamer, producer sctp id %s, consumer sctp id %s', producer.sctpStreamParameters.streamId, streamerDataConsumer.sctpStreamParameters.streamId);
        }
        signalServer.send(JSON.stringify({ type: 'startStreaming' }));
    }
}

async function createWebRtcTransport(identifier) {
    const {
        listenIps,
        initialAvailableOutgoingBitrate
    } = config.mediasoup.webRtcTransport;

    const transport = await mediasoupRouter.createWebRtcTransport({
        listenIps: listenIps,
        enableUdp: true,
        enableTcp: false,
        preferUdp: true,
        enableSctp: true, // datachannels
        initialAvailableOutgoingBitrate: initialAvailableOutgoingBitrate
    });

    transport.on("icestatechange", (iceState) => onICEStateChange(identifier, iceState));
    transport.on("iceselectedtuplechange", (iceTuple) => { console.log("%s ICE selected tuple %s", identifier, JSON.stringify(iceTuple)); });
    transport.on("sctpstatechange", (sctpState) => { console.log("%s SCTP state changed to %s", identifier, sctpState); });

    return transport;
}

async function main() {
    var argv = minimist(process.argv.slice(2));

    if ('signallingURL' in argv) {
        config.signallingURL = argv['signallingURL'];
    }

    console.log('Starting Mediasoup...');
    console.log("Config = ");
    console.log(config);

    mediasoupRouter = await startMediasoup();
    dataRouter = await createDataRouter();

    connectSignalling(config.signallingURL);
}

main();

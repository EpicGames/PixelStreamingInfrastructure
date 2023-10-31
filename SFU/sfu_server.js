const config = require('./config');
const WebSocket = require('ws');
const mediasoup = require('mediasoup_prebuilt');
const mediasoupSdp = require('mediasoup-sdp-bridge');

if (!config.retrySubscribeDelaySecs) {
  config.retrySubscribeDelaySecs = 10;
}

let signalServer = null;
let mediasoupRouter;
let streamer = null;
let peers = new Map();

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
    setTimeout(()=> { 
      connectSignalling(server);
    }, 2000); 
  });
}

async function onStreamerList(msg) {
  let success = false;

  // subscribe to either the configured streamer, or if not configured, just grab the first id
  if (msg.ids.length > 0) {
    if (!!config.subscribeStreamerId && config.subscribeStreamerId.length != 0) {
      if (msg.ids.includes(config.subscribeStreamerId)) {
        signalServer.send(JSON.stringify({type: 'subscribe', streamerId: config.subscribeStreamerId}));
        success = true;
      }
    } else {
      signalServer.send(JSON.stringify({type: 'subscribe', streamerId: msg.ids[0]}));
      success = true;
    }
  }

  if (!success) {
    // did not subscribe to anything
    setTimeout(function() {
      signalServer.send(JSON.stringify({type: 'listStreamers'}));
    }, config.retrySubscribeDelaySecs * 1000);
  }
}

async function onIdentify(msg) {
  signalServer.send(JSON.stringify({type: 'endpointId', id: config.SFUId}));
  signalServer.send(JSON.stringify({type: 'listStreamers'}));
}

async function onStreamerOffer(sdp) {
  console.log("Got offer from streamer");

  if (streamer != null) {
    signalServer.close(1013 /* Try again later */, 'Producer is already connected');
    return;
  }

  const transport = await createWebRtcTransport("Streamer");
  const sdpEndpoint = mediasoupSdp.createSdpEndpoint(transport, mediasoupRouter.rtpCapabilities);
  const producers = await sdpEndpoint.processOffer(sdp);
  const sdpAnswer = sdpEndpoint.createAnswer();
  const answer = { type: "answer", sdp: sdpAnswer };

  console.log("Sending answer to streamer.");
  signalServer.send(JSON.stringify(answer));
  streamer = { transport: transport, producers: producers };
}

function getNextStreamerSCTPId() {
    return streamer.transport._getNextSctpStreamId();
}

function onStreamerDisconnected() {
  console.log("Streamer disconnected");
  disconnectAllPeers();

  if (streamer != null) {
    for (const mediaProducer of streamer.producers) {
      mediaProducer.close();
    }
    streamer.transport.close();
    streamer = null;
    signalServer.send(JSON.stringify({type: 'stopStreaming'}));

    setTimeout(function() {
      signalServer.send(JSON.stringify({type: 'listStreamers'}));
    }, config.retrySubscribeDelaySecs * 1000);
  }
}

async function onPeerConnected(peerId) {
  console.log("Player %s joined", peerId);

  if (streamer == null) {
    console.log("No streamer connected, ignoring player.");
    return;
  }

  const transport = await createWebRtcTransport("Peer " + peerId);
  const sdpEndpoint = mediasoupSdp.createSdpEndpoint( transport, mediasoupRouter.rtpCapabilities );
  sdpEndpoint.addConsumeData(); // adds the sctp 'application' section to the offer

  // media consumers
  let consumers = [];
  try {
    for (const mediaProducer of streamer.producers) {
      const consumer = await transport.consume({ producerId: mediaProducer.id, rtpCapabilities: mediasoupRouter.rtpCapabilities });
      consumer.observer.on("layerschange", function() { console.log("layer changed!", consumer.currentLayers); });
      sdpEndpoint.addConsumer(consumer);
      consumers.push(consumer);
    }
  } catch(err) {
    console.error("transport.consume() failed:", err);
    return;
  }

  const offerSignal = {
    type: "offer",
    playerId: peerId,
    sdp: sdpEndpoint.createOffer(),
    sfu: true // indicate we're offering from sfu
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

  const nextStreamerSCTPStreamId = getNextStreamerSCTPId();
  const nextPeerSCTPStreamId = getNextStreamerSCTPId();

  console.log(`Attempting streamer SCTP id=${nextStreamerSCTPStreamId}`);

  // streamer data producer (produces data for the peer)
  peer.streamerDataProducer = await streamer.transport.produceData({label: 'send-datachannel', sctpStreamParameters: {streamId: nextStreamerSCTPStreamId, ordered: true}});

  console.log(`Attempting peer SCTP id=${nextPeerSCTPStreamId}`);

  // peer data producer (produces data for the streamer)
  peer.peerDataProducer = await peer.transport.produceData({label: 'send-datachannel', sctpStreamParameters: {streamId: nextPeerSCTPStreamId, ordered: true}});

  // peer data consumer (consumes streamer data)
  peer.peerDataConsumer = await peer.transport.consumeData({ dataProducerId: peer.streamerDataProducer.id });

  // streamer data consumer (consumes peer data)
  peer.streamerDataConsumer = await streamer.transport.consumeData({ dataProducerId: peer.peerDataProducer.id });

  streamer.transport._sctpStreamIds[nextStreamerSCTPStreamId] = 1;
  streamer.transport._sctpStreamIds[nextPeerSCTPStreamId] = 1;

  const peerSignal = {
    type: 'peerDataChannels',
    playerId: peerId,
    sendStreamId: peer.peerDataProducer.sctpStreamParameters.streamId,
    recvStreamId: peer.peerDataConsumer.sctpStreamParameters.streamId
  };

  // Send browser a message with a send/recv data channel SCTP stream id
  signalServer.send(JSON.stringify(peerSignal));

}

async function setupStreamerDataChannelsForPeer(peerId) {

  const peer = peers.get(peerId);
  if (!peer) {
    console.error(`Could not send streamer any datachannels for peer=${peerId} because peer was not found.`);
    return;
  }

  if(!peer.streamerDataProducer || !peer.streamerDataConsumer){
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
  if (!consumer){
    console.error(`Unable to find player ${peerId}`);
  }
  else{
    consumer.sdpEndpoint.processAnswer(sdp);
  }
}

function onPeerDisconnected(peerId) {
  console.log("Player %s disconnected", peerId);
  const peer = peers.get(peerId);
  if (peer != null) {
    for (consumer of peer.consumers) {
      consumer.close();
    }
    if (peer.peerDataConsumer) {
      peer.peerDataConsumer.close();
      peer.peerDataProducer.close();
    }
    if(peer.streamerDataConsumer){
      // Set the streamer sctp id we generated back to zero indicating it can be reused.
      if(streamer && streamer.transport && streamer.transport._sctpStreamIds){
        const allocatedStreamId = peer.streamerDataProducer.sctpStreamParameters.streamId;
        const allocatedPeerStreamId = peer.peerDataProducer.sctpStreamParameters.streamId;
        streamer.transport._sctpStreamIds[allocatedStreamId] = 0;
        streamer.transport._sctpStreamIds[allocatedPeerStreamId] = 0;
      }
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
  const peer = peers.get(`${msg.playerId}`);
  if (peer != null) {
    for (consumer of peer.consumers) {
      consumer.setPreferredLayers({ spatialLayer: msg.spatialLayer, temporalLayer: msg.temporalLayer });
    }
  }
}

async function onSignallingMessage(message) {
  //console.log(`Got MSG: ${message}`);
  const msg = JSON.parse(message);

  if (msg.type == 'offer') {
    onStreamerOffer(msg.sdp);
  }
  else if (msg.type == 'answer') {
    onPeerAnswer(msg.playerId, msg.sdp);
  }
  else if (msg.type == 'playerConnected') {
    onPeerConnected(msg.playerId);
  }
  else if (msg.type == 'playerDisconnected') {
    onPeerDisconnected(msg.playerId);
  }
  else if (msg.type == 'streamerDisconnected') {
    onStreamerDisconnected();
  }
  else if (msg.type == 'dataChannelRequest') {
    setupPeerDataChannels(msg.playerId);
  }
  else if (msg.type == 'peerDataChannelsReady') {
    setupStreamerDataChannelsForPeer(msg.playerId);
  }
  else if (msg.type == 'layerPreference') {
    onLayerPreference(msg);
  }
  else if (msg.type == 'streamerList') {
    onStreamerList(msg);
  }
  else if (msg.type == 'identify') {
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

  if (identifier == 'Streamer' && iceState == 'completed') {
    signalServer.send(JSON.stringify({type: 'startStreaming'}));
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
  console.log('Starting Mediasoup...');
  console.log("Config = ");
  console.log(config);

  mediasoupRouter = await startMediasoup();

  connectSignalling(config.signallingURL);
}

main();

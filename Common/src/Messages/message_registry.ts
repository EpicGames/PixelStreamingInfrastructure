import { IMessageType } from "@protobuf-ts/runtime";
import * as Messages from './signalling_messages';
import { BaseMessage } from './base_message';

export const MessageRegistry: Record<string, IMessageType<BaseMessage>> = {
    'answer': Messages.answer,
    'config': Messages.config,
    'disconnectPlayer': Messages.disconnectPlayer,
    'endpointId': Messages.endpointId,
    'iceCandidate': Messages.iceCandidate,
    'identify': Messages.identify,
    'listStreamers': Messages.listStreamers,
    'offer': Messages.offer,
    'ping': Messages.ping,
    'playerConnected': Messages.playerConnected,
    'playerCount': Messages.playerCount,
    'playerDisconnected': Messages.playerDisconnected,
    'pong': Messages.pong,
    'stats': Messages.stats,
    'streamerDisconnected': Messages.streamerDisconnected,
    'streamerList': Messages.streamerList,
    'subscribe': Messages.subscribe,
    'unsubscribe': Messages.unsubscribe,

    'layerPreference': Messages.layerPreference,

    'dataChannelRequest': Messages.dataChannelRequest,
    'peerDataChannels': Messages.peerDataChannels,
    'peerDataChannelsReady': Messages.peerDataChannelsReady,
    'streamerDataChannels': Messages.streamerDataChannels,
    'startStreaming': Messages.startStreaming,
    'stopStreaming': Messages.stopStreaming,
}

import { IMessageType } from "@protobuf-ts/runtime";
import * as Messages from './signalling_messages';
import { BaseMessage } from './base_message';

export const MessageRegistry: Record<string, IMessageType<BaseMessage>> = {
    'answer': Messages.answer,
    'config': Messages.config,
    'dataChannelRequest': Messages.dataChannelRequest,
    'disconnectPlayer': Messages.disconnectPlayer,
    'endpointId': Messages.endpointId,
    'iceCandidate': Messages.iceCandidate,
    'identify': Messages.identify,
    'layerPreference': Messages.layerPreference,
    'listStreamers': Messages.listStreamers,
    'offer': Messages.offer,
    'peerDataChannelsReady': Messages.peerDataChannelsReady,
    'ping': Messages.ping,
    'playerConnected': Messages.playerConnected,
    'playerCount': Messages.playerCount,
    'playerDisconnected': Messages.playerDisconnected,
    'pong': Messages.pong,
    'stats': Messages.stats,
    'streamerDataChannels': Messages.streamerDataChannels,
    'streamerDisconnected': Messages.streamerDisconnected,
    'streamerList': Messages.streamerList,
    'subscribe': Messages.subscribe,
    'unsubscribe': Messages.unsubscribe,
}

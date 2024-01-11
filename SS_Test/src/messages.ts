/* eslint-disable */
import * as _m0 from "protobufjs/minimal";
import { messageTypeRegistry } from "./typeRegistry";

export const protobufPackage = "";

/** intermediate message to determine message type */
export interface baseMessage {
  $type: "base_message";
  type: string;
}

export interface answer {
  $type: "answer";
  type: string;
  sdp: string;
  playerId?: string | undefined;
}

export interface config {
  $type: "config";
  type: string;
  peerConnectionOptions: string;
}

export interface dataChannelRequest {
  $type: "dataChannelRequest";
  type: string;
}

export interface disconnectPlayer {
  $type: "disconnectPlayer";
  type: string;
  playerId: string;
  reason?: string | undefined;
}

export interface endpointId {
  $type: "endpointId";
  type: string;
  id: string;
}

export interface iceCandidate {
  $type: "iceCandidate";
  type: string;
  candidate: string;
  playerId?: string | undefined;
}

export interface identify {
  $type: "identify";
  type: string;
}

export interface layerPreference {
  $type: "layerPreference";
  type: string;
  spatialLayer: number;
  temporalLayer: number;
  playerId: string;
}

export interface listStreamers {
  $type: "listStreamers";
  type: string;
}

export interface offer {
  $type: "offer";
  type: string;
  sdp: string;
  playerId?: string | undefined;
}

export interface peerDataChannelsReady {
  $type: "peerDataChannelsReady";
  type: string;
}

export interface ping {
  $type: "ping";
  type: string;
  time: number;
}

export interface playerConnected {
  $type: "playerConnected";
  type: string;
  dataChannel: boolean;
  sfu: boolean;
  sendOffer: boolean;
  playerId?: string | undefined;
}

export interface playerCount {
  $type: "playerCount";
  type: string;
  count: number;
}

export interface playerDisconnected {
  $type: "playerDisconnected";
  type: string;
  playerId: string;
}

export interface pong {
  $type: "pong";
  type: string;
  time: number;
}

export interface stats {
  $type: "stats";
  type: string;
  data: string;
}

export interface streamerDataChannels {
  $type: "streamerDataChannels";
  type: string;
  sendStreamId: number;
  recvStreamId: number;
  playerId: string;
}

export interface streamerDisconnected {
  $type: "streamerDisconnected";
  type: string;
  /** NEW */
  streamerId: string;
}

export interface streamerList {
  $type: "streamerList";
  type: string;
  /** CHECK */
  ids: string[];
}

export interface subscribe {
  $type: "subscribe";
  type: string;
  streamerId: string;
}

export interface unsubscribe {
  $type: "unsubscribe";
  type: string;
}

function createBasebaseMessage(): baseMessage {
  return { $type: "base_message", type: "" };
}

export const baseMessage = {
  $type: "base_message" as const,

  encode(message: baseMessage, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): baseMessage {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasebaseMessage();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): baseMessage {
    return { $type: baseMessage.$type, type: isSet(object.type) ? globalThis.String(object.type) : "" };
  },

  toJSON(message: baseMessage): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<baseMessage>, I>>(base?: I): baseMessage {
    return baseMessage.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<baseMessage>, I>>(object: I): baseMessage {
    const message = createBasebaseMessage();
    message.type = object.type ?? "";
    return message;
  },
};

messageTypeRegistry.set(baseMessage.$type, baseMessage);

function createBaseanswer(): answer {
  return { $type: "answer", type: "", sdp: "", playerId: undefined };
}

export const answer = {
  $type: "answer" as const,

  encode(message: answer, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    if (message.sdp !== "") {
      writer.uint32(18).string(message.sdp);
    }
    if (message.playerId !== undefined) {
      writer.uint32(26).string(message.playerId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): answer {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseanswer();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.sdp = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.playerId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): answer {
    return {
      $type: answer.$type,
      type: isSet(object.type) ? globalThis.String(object.type) : "",
      sdp: isSet(object.sdp) ? globalThis.String(object.sdp) : "",
      playerId: isSet(object.playerId) ? globalThis.String(object.playerId) : undefined,
    };
  },

  toJSON(message: answer): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    if (message.sdp !== "") {
      obj.sdp = message.sdp;
    }
    if (message.playerId !== undefined) {
      obj.playerId = message.playerId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<answer>, I>>(base?: I): answer {
    return answer.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<answer>, I>>(object: I): answer {
    const message = createBaseanswer();
    message.type = object.type ?? "";
    message.sdp = object.sdp ?? "";
    message.playerId = object.playerId ?? undefined;
    return message;
  },
};

messageTypeRegistry.set(answer.$type, answer);

function createBaseconfig(): config {
  return { $type: "config", type: "", peerConnectionOptions: "" };
}

export const config = {
  $type: "config" as const,

  encode(message: config, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    if (message.peerConnectionOptions !== "") {
      writer.uint32(18).string(message.peerConnectionOptions);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): config {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseconfig();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.peerConnectionOptions = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): config {
    return {
      $type: config.$type,
      type: isSet(object.type) ? globalThis.String(object.type) : "",
      peerConnectionOptions: isSet(object.peerConnectionOptions) ? globalThis.String(object.peerConnectionOptions) : "",
    };
  },

  toJSON(message: config): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    if (message.peerConnectionOptions !== "") {
      obj.peerConnectionOptions = message.peerConnectionOptions;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<config>, I>>(base?: I): config {
    return config.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<config>, I>>(object: I): config {
    const message = createBaseconfig();
    message.type = object.type ?? "";
    message.peerConnectionOptions = object.peerConnectionOptions ?? "";
    return message;
  },
};

messageTypeRegistry.set(config.$type, config);

function createBasedataChannelRequest(): dataChannelRequest {
  return { $type: "dataChannelRequest", type: "" };
}

export const dataChannelRequest = {
  $type: "dataChannelRequest" as const,

  encode(message: dataChannelRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): dataChannelRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasedataChannelRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): dataChannelRequest {
    return { $type: dataChannelRequest.$type, type: isSet(object.type) ? globalThis.String(object.type) : "" };
  },

  toJSON(message: dataChannelRequest): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<dataChannelRequest>, I>>(base?: I): dataChannelRequest {
    return dataChannelRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<dataChannelRequest>, I>>(object: I): dataChannelRequest {
    const message = createBasedataChannelRequest();
    message.type = object.type ?? "";
    return message;
  },
};

messageTypeRegistry.set(dataChannelRequest.$type, dataChannelRequest);

function createBasedisconnectPlayer(): disconnectPlayer {
  return { $type: "disconnectPlayer", type: "", playerId: "", reason: undefined };
}

export const disconnectPlayer = {
  $type: "disconnectPlayer" as const,

  encode(message: disconnectPlayer, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    if (message.playerId !== "") {
      writer.uint32(18).string(message.playerId);
    }
    if (message.reason !== undefined) {
      writer.uint32(26).string(message.reason);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): disconnectPlayer {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasedisconnectPlayer();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.playerId = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.reason = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): disconnectPlayer {
    return {
      $type: disconnectPlayer.$type,
      type: isSet(object.type) ? globalThis.String(object.type) : "",
      playerId: isSet(object.playerId) ? globalThis.String(object.playerId) : "",
      reason: isSet(object.reason) ? globalThis.String(object.reason) : undefined,
    };
  },

  toJSON(message: disconnectPlayer): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    if (message.playerId !== "") {
      obj.playerId = message.playerId;
    }
    if (message.reason !== undefined) {
      obj.reason = message.reason;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<disconnectPlayer>, I>>(base?: I): disconnectPlayer {
    return disconnectPlayer.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<disconnectPlayer>, I>>(object: I): disconnectPlayer {
    const message = createBasedisconnectPlayer();
    message.type = object.type ?? "";
    message.playerId = object.playerId ?? "";
    message.reason = object.reason ?? undefined;
    return message;
  },
};

messageTypeRegistry.set(disconnectPlayer.$type, disconnectPlayer);

function createBaseendpointId(): endpointId {
  return { $type: "endpointId", type: "", id: "" };
}

export const endpointId = {
  $type: "endpointId" as const,

  encode(message: endpointId, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    if (message.id !== "") {
      writer.uint32(18).string(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): endpointId {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseendpointId();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.id = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): endpointId {
    return {
      $type: endpointId.$type,
      type: isSet(object.type) ? globalThis.String(object.type) : "",
      id: isSet(object.id) ? globalThis.String(object.id) : "",
    };
  },

  toJSON(message: endpointId): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    if (message.id !== "") {
      obj.id = message.id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<endpointId>, I>>(base?: I): endpointId {
    return endpointId.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<endpointId>, I>>(object: I): endpointId {
    const message = createBaseendpointId();
    message.type = object.type ?? "";
    message.id = object.id ?? "";
    return message;
  },
};

messageTypeRegistry.set(endpointId.$type, endpointId);

function createBaseiceCandidate(): iceCandidate {
  return { $type: "iceCandidate", type: "", candidate: "", playerId: undefined };
}

export const iceCandidate = {
  $type: "iceCandidate" as const,

  encode(message: iceCandidate, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    if (message.candidate !== "") {
      writer.uint32(18).string(message.candidate);
    }
    if (message.playerId !== undefined) {
      writer.uint32(26).string(message.playerId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): iceCandidate {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseiceCandidate();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.candidate = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.playerId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): iceCandidate {
    return {
      $type: iceCandidate.$type,
      type: isSet(object.type) ? globalThis.String(object.type) : "",
      candidate: isSet(object.candidate) ? globalThis.String(object.candidate) : "",
      playerId: isSet(object.playerId) ? globalThis.String(object.playerId) : undefined,
    };
  },

  toJSON(message: iceCandidate): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    if (message.candidate !== "") {
      obj.candidate = message.candidate;
    }
    if (message.playerId !== undefined) {
      obj.playerId = message.playerId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<iceCandidate>, I>>(base?: I): iceCandidate {
    return iceCandidate.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<iceCandidate>, I>>(object: I): iceCandidate {
    const message = createBaseiceCandidate();
    message.type = object.type ?? "";
    message.candidate = object.candidate ?? "";
    message.playerId = object.playerId ?? undefined;
    return message;
  },
};

messageTypeRegistry.set(iceCandidate.$type, iceCandidate);

function createBaseidentify(): identify {
  return { $type: "identify", type: "" };
}

export const identify = {
  $type: "identify" as const,

  encode(message: identify, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): identify {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseidentify();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): identify {
    return { $type: identify.$type, type: isSet(object.type) ? globalThis.String(object.type) : "" };
  },

  toJSON(message: identify): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<identify>, I>>(base?: I): identify {
    return identify.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<identify>, I>>(object: I): identify {
    const message = createBaseidentify();
    message.type = object.type ?? "";
    return message;
  },
};

messageTypeRegistry.set(identify.$type, identify);

function createBaselayerPreference(): layerPreference {
  return { $type: "layerPreference", type: "", spatialLayer: 0, temporalLayer: 0, playerId: "" };
}

export const layerPreference = {
  $type: "layerPreference" as const,

  encode(message: layerPreference, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    if (message.spatialLayer !== 0) {
      writer.uint32(16).int32(message.spatialLayer);
    }
    if (message.temporalLayer !== 0) {
      writer.uint32(24).int32(message.temporalLayer);
    }
    if (message.playerId !== "") {
      writer.uint32(34).string(message.playerId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): layerPreference {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaselayerPreference();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.spatialLayer = reader.int32();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.temporalLayer = reader.int32();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.playerId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): layerPreference {
    return {
      $type: layerPreference.$type,
      type: isSet(object.type) ? globalThis.String(object.type) : "",
      spatialLayer: isSet(object.spatialLayer) ? globalThis.Number(object.spatialLayer) : 0,
      temporalLayer: isSet(object.temporalLayer) ? globalThis.Number(object.temporalLayer) : 0,
      playerId: isSet(object.playerId) ? globalThis.String(object.playerId) : "",
    };
  },

  toJSON(message: layerPreference): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    if (message.spatialLayer !== 0) {
      obj.spatialLayer = Math.round(message.spatialLayer);
    }
    if (message.temporalLayer !== 0) {
      obj.temporalLayer = Math.round(message.temporalLayer);
    }
    if (message.playerId !== "") {
      obj.playerId = message.playerId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<layerPreference>, I>>(base?: I): layerPreference {
    return layerPreference.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<layerPreference>, I>>(object: I): layerPreference {
    const message = createBaselayerPreference();
    message.type = object.type ?? "";
    message.spatialLayer = object.spatialLayer ?? 0;
    message.temporalLayer = object.temporalLayer ?? 0;
    message.playerId = object.playerId ?? "";
    return message;
  },
};

messageTypeRegistry.set(layerPreference.$type, layerPreference);

function createBaselistStreamers(): listStreamers {
  return { $type: "listStreamers", type: "" };
}

export const listStreamers = {
  $type: "listStreamers" as const,

  encode(message: listStreamers, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): listStreamers {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaselistStreamers();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): listStreamers {
    return { $type: listStreamers.$type, type: isSet(object.type) ? globalThis.String(object.type) : "" };
  },

  toJSON(message: listStreamers): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<listStreamers>, I>>(base?: I): listStreamers {
    return listStreamers.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<listStreamers>, I>>(object: I): listStreamers {
    const message = createBaselistStreamers();
    message.type = object.type ?? "";
    return message;
  },
};

messageTypeRegistry.set(listStreamers.$type, listStreamers);

function createBaseoffer(): offer {
  return { $type: "offer", type: "", sdp: "", playerId: undefined };
}

export const offer = {
  $type: "offer" as const,

  encode(message: offer, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    if (message.sdp !== "") {
      writer.uint32(18).string(message.sdp);
    }
    if (message.playerId !== undefined) {
      writer.uint32(26).string(message.playerId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): offer {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseoffer();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.sdp = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.playerId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): offer {
    return {
      $type: offer.$type,
      type: isSet(object.type) ? globalThis.String(object.type) : "",
      sdp: isSet(object.sdp) ? globalThis.String(object.sdp) : "",
      playerId: isSet(object.playerId) ? globalThis.String(object.playerId) : undefined,
    };
  },

  toJSON(message: offer): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    if (message.sdp !== "") {
      obj.sdp = message.sdp;
    }
    if (message.playerId !== undefined) {
      obj.playerId = message.playerId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<offer>, I>>(base?: I): offer {
    return offer.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<offer>, I>>(object: I): offer {
    const message = createBaseoffer();
    message.type = object.type ?? "";
    message.sdp = object.sdp ?? "";
    message.playerId = object.playerId ?? undefined;
    return message;
  },
};

messageTypeRegistry.set(offer.$type, offer);

function createBasepeerDataChannelsReady(): peerDataChannelsReady {
  return { $type: "peerDataChannelsReady", type: "" };
}

export const peerDataChannelsReady = {
  $type: "peerDataChannelsReady" as const,

  encode(message: peerDataChannelsReady, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): peerDataChannelsReady {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasepeerDataChannelsReady();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): peerDataChannelsReady {
    return { $type: peerDataChannelsReady.$type, type: isSet(object.type) ? globalThis.String(object.type) : "" };
  },

  toJSON(message: peerDataChannelsReady): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<peerDataChannelsReady>, I>>(base?: I): peerDataChannelsReady {
    return peerDataChannelsReady.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<peerDataChannelsReady>, I>>(object: I): peerDataChannelsReady {
    const message = createBasepeerDataChannelsReady();
    message.type = object.type ?? "";
    return message;
  },
};

messageTypeRegistry.set(peerDataChannelsReady.$type, peerDataChannelsReady);

function createBaseping(): ping {
  return { $type: "ping", type: "", time: 0 };
}

export const ping = {
  $type: "ping" as const,

  encode(message: ping, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    if (message.time !== 0) {
      writer.uint32(16).int32(message.time);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ping {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseping();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.time = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ping {
    return {
      $type: ping.$type,
      type: isSet(object.type) ? globalThis.String(object.type) : "",
      time: isSet(object.time) ? globalThis.Number(object.time) : 0,
    };
  },

  toJSON(message: ping): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    if (message.time !== 0) {
      obj.time = Math.round(message.time);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ping>, I>>(base?: I): ping {
    return ping.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ping>, I>>(object: I): ping {
    const message = createBaseping();
    message.type = object.type ?? "";
    message.time = object.time ?? 0;
    return message;
  },
};

messageTypeRegistry.set(ping.$type, ping);

function createBaseplayerConnected(): playerConnected {
  return { $type: "playerConnected", type: "", dataChannel: false, sfu: false, sendOffer: false, playerId: undefined };
}

export const playerConnected = {
  $type: "playerConnected" as const,

  encode(message: playerConnected, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    if (message.dataChannel === true) {
      writer.uint32(16).bool(message.dataChannel);
    }
    if (message.sfu === true) {
      writer.uint32(24).bool(message.sfu);
    }
    if (message.sendOffer === true) {
      writer.uint32(32).bool(message.sendOffer);
    }
    if (message.playerId !== undefined) {
      writer.uint32(42).string(message.playerId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): playerConnected {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseplayerConnected();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.dataChannel = reader.bool();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.sfu = reader.bool();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.sendOffer = reader.bool();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.playerId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): playerConnected {
    return {
      $type: playerConnected.$type,
      type: isSet(object.type) ? globalThis.String(object.type) : "",
      dataChannel: isSet(object.dataChannel) ? globalThis.Boolean(object.dataChannel) : false,
      sfu: isSet(object.sfu) ? globalThis.Boolean(object.sfu) : false,
      sendOffer: isSet(object.sendOffer) ? globalThis.Boolean(object.sendOffer) : false,
      playerId: isSet(object.playerId) ? globalThis.String(object.playerId) : undefined,
    };
  },

  toJSON(message: playerConnected): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    if (message.dataChannel === true) {
      obj.dataChannel = message.dataChannel;
    }
    if (message.sfu === true) {
      obj.sfu = message.sfu;
    }
    if (message.sendOffer === true) {
      obj.sendOffer = message.sendOffer;
    }
    if (message.playerId !== undefined) {
      obj.playerId = message.playerId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<playerConnected>, I>>(base?: I): playerConnected {
    return playerConnected.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<playerConnected>, I>>(object: I): playerConnected {
    const message = createBaseplayerConnected();
    message.type = object.type ?? "";
    message.dataChannel = object.dataChannel ?? false;
    message.sfu = object.sfu ?? false;
    message.sendOffer = object.sendOffer ?? false;
    message.playerId = object.playerId ?? undefined;
    return message;
  },
};

messageTypeRegistry.set(playerConnected.$type, playerConnected);

function createBaseplayerCount(): playerCount {
  return { $type: "playerCount", type: "", count: 0 };
}

export const playerCount = {
  $type: "playerCount" as const,

  encode(message: playerCount, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    if (message.count !== 0) {
      writer.uint32(16).int32(message.count);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): playerCount {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseplayerCount();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.count = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): playerCount {
    return {
      $type: playerCount.$type,
      type: isSet(object.type) ? globalThis.String(object.type) : "",
      count: isSet(object.count) ? globalThis.Number(object.count) : 0,
    };
  },

  toJSON(message: playerCount): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    if (message.count !== 0) {
      obj.count = Math.round(message.count);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<playerCount>, I>>(base?: I): playerCount {
    return playerCount.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<playerCount>, I>>(object: I): playerCount {
    const message = createBaseplayerCount();
    message.type = object.type ?? "";
    message.count = object.count ?? 0;
    return message;
  },
};

messageTypeRegistry.set(playerCount.$type, playerCount);

function createBaseplayerDisconnected(): playerDisconnected {
  return { $type: "playerDisconnected", type: "", playerId: "" };
}

export const playerDisconnected = {
  $type: "playerDisconnected" as const,

  encode(message: playerDisconnected, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    if (message.playerId !== "") {
      writer.uint32(18).string(message.playerId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): playerDisconnected {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseplayerDisconnected();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.playerId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): playerDisconnected {
    return {
      $type: playerDisconnected.$type,
      type: isSet(object.type) ? globalThis.String(object.type) : "",
      playerId: isSet(object.playerId) ? globalThis.String(object.playerId) : "",
    };
  },

  toJSON(message: playerDisconnected): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    if (message.playerId !== "") {
      obj.playerId = message.playerId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<playerDisconnected>, I>>(base?: I): playerDisconnected {
    return playerDisconnected.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<playerDisconnected>, I>>(object: I): playerDisconnected {
    const message = createBaseplayerDisconnected();
    message.type = object.type ?? "";
    message.playerId = object.playerId ?? "";
    return message;
  },
};

messageTypeRegistry.set(playerDisconnected.$type, playerDisconnected);

function createBasepong(): pong {
  return { $type: "pong", type: "", time: 0 };
}

export const pong = {
  $type: "pong" as const,

  encode(message: pong, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    if (message.time !== 0) {
      writer.uint32(16).int32(message.time);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): pong {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasepong();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.time = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): pong {
    return {
      $type: pong.$type,
      type: isSet(object.type) ? globalThis.String(object.type) : "",
      time: isSet(object.time) ? globalThis.Number(object.time) : 0,
    };
  },

  toJSON(message: pong): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    if (message.time !== 0) {
      obj.time = Math.round(message.time);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<pong>, I>>(base?: I): pong {
    return pong.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<pong>, I>>(object: I): pong {
    const message = createBasepong();
    message.type = object.type ?? "";
    message.time = object.time ?? 0;
    return message;
  },
};

messageTypeRegistry.set(pong.$type, pong);

function createBasestats(): stats {
  return { $type: "stats", type: "", data: "" };
}

export const stats = {
  $type: "stats" as const,

  encode(message: stats, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    if (message.data !== "") {
      writer.uint32(18).string(message.data);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): stats {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasestats();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.data = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): stats {
    return {
      $type: stats.$type,
      type: isSet(object.type) ? globalThis.String(object.type) : "",
      data: isSet(object.data) ? globalThis.String(object.data) : "",
    };
  },

  toJSON(message: stats): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    if (message.data !== "") {
      obj.data = message.data;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<stats>, I>>(base?: I): stats {
    return stats.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<stats>, I>>(object: I): stats {
    const message = createBasestats();
    message.type = object.type ?? "";
    message.data = object.data ?? "";
    return message;
  },
};

messageTypeRegistry.set(stats.$type, stats);

function createBasestreamerDataChannels(): streamerDataChannels {
  return { $type: "streamerDataChannels", type: "", sendStreamId: 0, recvStreamId: 0, playerId: "" };
}

export const streamerDataChannels = {
  $type: "streamerDataChannels" as const,

  encode(message: streamerDataChannels, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    if (message.sendStreamId !== 0) {
      writer.uint32(16).int32(message.sendStreamId);
    }
    if (message.recvStreamId !== 0) {
      writer.uint32(24).int32(message.recvStreamId);
    }
    if (message.playerId !== "") {
      writer.uint32(34).string(message.playerId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): streamerDataChannels {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasestreamerDataChannels();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.sendStreamId = reader.int32();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.recvStreamId = reader.int32();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.playerId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): streamerDataChannels {
    return {
      $type: streamerDataChannels.$type,
      type: isSet(object.type) ? globalThis.String(object.type) : "",
      sendStreamId: isSet(object.sendStreamId) ? globalThis.Number(object.sendStreamId) : 0,
      recvStreamId: isSet(object.recvStreamId) ? globalThis.Number(object.recvStreamId) : 0,
      playerId: isSet(object.playerId) ? globalThis.String(object.playerId) : "",
    };
  },

  toJSON(message: streamerDataChannels): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    if (message.sendStreamId !== 0) {
      obj.sendStreamId = Math.round(message.sendStreamId);
    }
    if (message.recvStreamId !== 0) {
      obj.recvStreamId = Math.round(message.recvStreamId);
    }
    if (message.playerId !== "") {
      obj.playerId = message.playerId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<streamerDataChannels>, I>>(base?: I): streamerDataChannels {
    return streamerDataChannels.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<streamerDataChannels>, I>>(object: I): streamerDataChannels {
    const message = createBasestreamerDataChannels();
    message.type = object.type ?? "";
    message.sendStreamId = object.sendStreamId ?? 0;
    message.recvStreamId = object.recvStreamId ?? 0;
    message.playerId = object.playerId ?? "";
    return message;
  },
};

messageTypeRegistry.set(streamerDataChannels.$type, streamerDataChannels);

function createBasestreamerDisconnected(): streamerDisconnected {
  return { $type: "streamerDisconnected", type: "", streamerId: "" };
}

export const streamerDisconnected = {
  $type: "streamerDisconnected" as const,

  encode(message: streamerDisconnected, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    if (message.streamerId !== "") {
      writer.uint32(18).string(message.streamerId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): streamerDisconnected {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasestreamerDisconnected();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.streamerId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): streamerDisconnected {
    return {
      $type: streamerDisconnected.$type,
      type: isSet(object.type) ? globalThis.String(object.type) : "",
      streamerId: isSet(object.streamerId) ? globalThis.String(object.streamerId) : "",
    };
  },

  toJSON(message: streamerDisconnected): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    if (message.streamerId !== "") {
      obj.streamerId = message.streamerId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<streamerDisconnected>, I>>(base?: I): streamerDisconnected {
    return streamerDisconnected.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<streamerDisconnected>, I>>(object: I): streamerDisconnected {
    const message = createBasestreamerDisconnected();
    message.type = object.type ?? "";
    message.streamerId = object.streamerId ?? "";
    return message;
  },
};

messageTypeRegistry.set(streamerDisconnected.$type, streamerDisconnected);

function createBasestreamerList(): streamerList {
  return { $type: "streamerList", type: "", ids: [] };
}

export const streamerList = {
  $type: "streamerList" as const,

  encode(message: streamerList, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    for (const v of message.ids) {
      writer.uint32(18).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): streamerList {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasestreamerList();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.ids.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): streamerList {
    return {
      $type: streamerList.$type,
      type: isSet(object.type) ? globalThis.String(object.type) : "",
      ids: globalThis.Array.isArray(object?.ids) ? object.ids.map((e: any) => globalThis.String(e)) : [],
    };
  },

  toJSON(message: streamerList): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    if (message.ids?.length) {
      obj.ids = message.ids;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<streamerList>, I>>(base?: I): streamerList {
    return streamerList.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<streamerList>, I>>(object: I): streamerList {
    const message = createBasestreamerList();
    message.type = object.type ?? "";
    message.ids = object.ids?.map((e) => e) || [];
    return message;
  },
};

messageTypeRegistry.set(streamerList.$type, streamerList);

function createBasesubscribe(): subscribe {
  return { $type: "subscribe", type: "", streamerId: "" };
}

export const subscribe = {
  $type: "subscribe" as const,

  encode(message: subscribe, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    if (message.streamerId !== "") {
      writer.uint32(18).string(message.streamerId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): subscribe {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasesubscribe();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.streamerId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): subscribe {
    return {
      $type: subscribe.$type,
      type: isSet(object.type) ? globalThis.String(object.type) : "",
      streamerId: isSet(object.streamerId) ? globalThis.String(object.streamerId) : "",
    };
  },

  toJSON(message: subscribe): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    if (message.streamerId !== "") {
      obj.streamerId = message.streamerId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<subscribe>, I>>(base?: I): subscribe {
    return subscribe.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<subscribe>, I>>(object: I): subscribe {
    const message = createBasesubscribe();
    message.type = object.type ?? "";
    message.streamerId = object.streamerId ?? "";
    return message;
  },
};

messageTypeRegistry.set(subscribe.$type, subscribe);

function createBaseunsubscribe(): unsubscribe {
  return { $type: "unsubscribe", type: "" };
}

export const unsubscribe = {
  $type: "unsubscribe" as const,

  encode(message: unsubscribe, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== "") {
      writer.uint32(10).string(message.type);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): unsubscribe {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseunsubscribe();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.type = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): unsubscribe {
    return { $type: unsubscribe.$type, type: isSet(object.type) ? globalThis.String(object.type) : "" };
  },

  toJSON(message: unsubscribe): unknown {
    const obj: any = {};
    if (message.type !== "") {
      obj.type = message.type;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<unsubscribe>, I>>(base?: I): unsubscribe {
    return unsubscribe.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<unsubscribe>, I>>(object: I): unsubscribe {
    const message = createBaseunsubscribe();
    message.type = object.type ?? "";
    return message;
  },
};

messageTypeRegistry.set(unsubscribe.$type, unsubscribe);

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in Exclude<keyof T, "$type">]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P> | "$type">]: never };

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}

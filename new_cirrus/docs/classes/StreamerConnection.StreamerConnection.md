[new-cirrus](../README.md) / [Exports](../modules.md) / [StreamerConnection](../modules/StreamerConnection.md) / StreamerConnection

# Class: StreamerConnection

[StreamerConnection](../modules/StreamerConnection.md).StreamerConnection

A connection between the signalling server and a streamer connection.
This is where messages expected to be handled by the streamer come in
and where messages are sent to the streamer.

Interesting internals:
streamerId: The unique id string of this streamer.
transport: The ITransport where transport events can be subscribed to
protocol: The SignallingProtocol where signalling messages can be
subscribed to.
streaming: True when the streamer is ready to accept subscriptions.

## Hierarchy

- `EventEmitter`

  ↳ **`StreamerConnection`**

## Implements

- [`IStreamer`](../interfaces/StreamerRegistry.IStreamer.md)
- [`IMessageLogger`](../interfaces/LoggingUtils.IMessageLogger.md)

## Table of contents

### Constructors

- [constructor](StreamerConnection.StreamerConnection.md#constructor)

### Properties

- [protocol](StreamerConnection.StreamerConnection.md#protocol)
- [remoteAddress](StreamerConnection.StreamerConnection.md#remoteaddress)
- [streamerId](StreamerConnection.StreamerConnection.md#streamerid)
- [streaming](StreamerConnection.StreamerConnection.md#streaming)
- [transport](StreamerConnection.StreamerConnection.md#transport)

### Methods

- [getReadableIdentifier](StreamerConnection.StreamerConnection.md#getreadableidentifier)
- [getStreamerInfo](StreamerConnection.StreamerConnection.md#getstreamerinfo)
- [sendMessage](StreamerConnection.StreamerConnection.md#sendmessage)

## Constructors

### constructor

• **new StreamerConnection**(`server`, `ws`, `request`): [`StreamerConnection`](StreamerConnection.StreamerConnection.md)

Construct a new streamer connection.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `server` | [`SignallingServer`](SignallingServer.SignallingServer.md) | The signalling server object that spawned this streamer. |
| `ws` | `WebSocket` | The websocket coupled to this streamer connection. |
| `request` | `IncomingMessage` | - |

#### Returns

[`StreamerConnection`](StreamerConnection.StreamerConnection.md)

#### Overrides

EventEmitter.constructor

#### Defined in

[StreamerConnection.ts:41](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/StreamerConnection.ts#L41)

## Properties

### protocol

• **protocol**: `SignallingProtocol`

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[protocol](../interfaces/StreamerRegistry.IStreamer.md#protocol)

#### Defined in

[StreamerConnection.ts:32](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/StreamerConnection.ts#L32)

___

### remoteAddress

• **remoteAddress**: `undefined` \| `string`

#### Defined in

[StreamerConnection.ts:34](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/StreamerConnection.ts#L34)

___

### streamerId

• **streamerId**: `string`

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[streamerId](../interfaces/StreamerRegistry.IStreamer.md#streamerid)

#### Defined in

[StreamerConnection.ts:30](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/StreamerConnection.ts#L30)

___

### streaming

• **streaming**: `boolean`

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[streaming](../interfaces/StreamerRegistry.IStreamer.md#streaming)

#### Defined in

[StreamerConnection.ts:33](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/StreamerConnection.ts#L33)

___

### transport

• **transport**: `ITransport`

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[transport](../interfaces/StreamerRegistry.IStreamer.md#transport)

#### Defined in

[StreamerConnection.ts:31](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/StreamerConnection.ts#L31)

## Methods

### getReadableIdentifier

▸ **getReadableIdentifier**(): `string`

#### Returns

`string`

#### Implementation of

[IMessageLogger](../interfaces/LoggingUtils.IMessageLogger.md).[getReadableIdentifier](../interfaces/LoggingUtils.IMessageLogger.md#getreadableidentifier)

#### Defined in

[StreamerConnection.ts:57](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/StreamerConnection.ts#L57)

___

### getStreamerInfo

▸ **getStreamerInfo**(): [`IStreamerInfo`](../interfaces/StreamerRegistry.IStreamerInfo.md)

#### Returns

[`IStreamerInfo`](../interfaces/StreamerRegistry.IStreamerInfo.md)

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[getStreamerInfo](../interfaces/StreamerRegistry.IStreamer.md#getstreamerinfo)

#### Defined in

[StreamerConnection.ts:67](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/StreamerConnection.ts#L67)

___

### sendMessage

▸ **sendMessage**(`message`): `void`

Sends a signalling message to the player.

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `BaseMessage` |

#### Returns

`void`

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[sendMessage](../interfaces/StreamerRegistry.IStreamer.md#sendmessage)

#### Defined in

[StreamerConnection.ts:62](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/StreamerConnection.ts#L62)

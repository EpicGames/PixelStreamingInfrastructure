[@epicgames-ps/lib-pixelstreamingsignalling-ue5.5](../README.md) / [StreamerConnection](../modules/StreamerConnection.md) / StreamerConnection

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

• **new StreamerConnection**(`server`, `ws`, `remoteAddress?`): [`StreamerConnection`](StreamerConnection.StreamerConnection.md)

Initializes a new connection with given and sane values. Adds listeners for the
websocket close and error and will emit a disconnected event when disconneted.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `server` | [`SignallingServer`](SignallingServer.SignallingServer.md) | The signalling server object that spawned this streamer. |
| `ws` | `WebSocket` | The websocket coupled to this streamer connection. |
| `remoteAddress?` | `string` | The remote address of this connection. Only used as display. |

#### Returns

[`StreamerConnection`](StreamerConnection.StreamerConnection.md)

#### Overrides

EventEmitter.constructor

#### Defined in

[StreamerConnection.ts:48](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/8a78930/Signalling/src/StreamerConnection.ts#L48)

## Properties

### protocol

• **protocol**: `SignallingProtocol`

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[protocol](../interfaces/StreamerRegistry.IStreamer.md#protocol)

#### Defined in

[StreamerConnection.ts:33](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/8a78930/Signalling/src/StreamerConnection.ts#L33)

___

### remoteAddress

• `Optional` **remoteAddress**: `string`

#### Defined in

[StreamerConnection.ts:37](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/8a78930/Signalling/src/StreamerConnection.ts#L37)

___

### streamerId

• **streamerId**: `string`

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[streamerId](../interfaces/StreamerRegistry.IStreamer.md#streamerid)

#### Defined in

[StreamerConnection.ts:29](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/8a78930/Signalling/src/StreamerConnection.ts#L29)

___

### streaming

• **streaming**: `boolean`

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[streaming](../interfaces/StreamerRegistry.IStreamer.md#streaming)

#### Defined in

[StreamerConnection.ts:35](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/8a78930/Signalling/src/StreamerConnection.ts#L35)

___

### transport

• **transport**: `ITransport`

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[transport](../interfaces/StreamerRegistry.IStreamer.md#transport)

#### Defined in

[StreamerConnection.ts:31](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/8a78930/Signalling/src/StreamerConnection.ts#L31)

## Methods

### getReadableIdentifier

▸ **getReadableIdentifier**(): `string`

Returns an identifier that is displayed in logs.

#### Returns

`string`

A string describing this connection.

#### Implementation of

[IMessageLogger](../interfaces/LoggingUtils.IMessageLogger.md).[getReadableIdentifier](../interfaces/LoggingUtils.IMessageLogger.md#getreadableidentifier)

#### Defined in

[StreamerConnection.ts:68](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/8a78930/Signalling/src/StreamerConnection.ts#L68)

___

### getStreamerInfo

▸ **getStreamerInfo**(): [`IStreamerInfo`](../interfaces/StreamerRegistry.IStreamerInfo.md)

Returns a descriptive object for the REST API inspection operations.

#### Returns

[`IStreamerInfo`](../interfaces/StreamerRegistry.IStreamerInfo.md)

An IStreamerInfo object containing viewable information about this connection.

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[getStreamerInfo](../interfaces/StreamerRegistry.IStreamer.md#getstreamerinfo)

#### Defined in

[StreamerConnection.ts:83](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/8a78930/Signalling/src/StreamerConnection.ts#L83)

___

### sendMessage

▸ **sendMessage**(`message`): `void`

Sends a signalling message to the player.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `BaseMessage` | The message to send. |

#### Returns

`void`

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[sendMessage](../interfaces/StreamerRegistry.IStreamer.md#sendmessage)

#### Defined in

[StreamerConnection.ts:74](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/8a78930/Signalling/src/StreamerConnection.ts#L74)

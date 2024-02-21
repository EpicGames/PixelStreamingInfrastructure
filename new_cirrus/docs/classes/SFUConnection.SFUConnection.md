[wilbur](../README.md) / [Exports](../modules.md) / [SFUConnection](../modules/SFUConnection.md) / SFUConnection

# Class: SFUConnection

[SFUConnection](../modules/SFUConnection.md).SFUConnection

A SFU connection to the signalling server.
An SFU can act as both a streamer and a player. It can subscribe to
streamers like a player, and other players can subscribe to the sfu.
Therefore the SFU will have a streamer id and a player id and be
registered in both streamer registries and player registries.

Interesting internals:
playerId: The player id of this connectiom.
streamerId: The streamer id of this connection.
transport: The ITransport where transport events can be subscribed to
protocol: The SignallingProtocol where signalling messages can be
subscribed to.
streaming: True when the streamer is ready to accept subscriptions.

## Hierarchy

- `EventEmitter`

  ↳ **`SFUConnection`**

## Implements

- [`IPlayer`](../interfaces/PlayerRegistry.IPlayer.md)
- [`IStreamer`](../interfaces/StreamerRegistry.IStreamer.md)
- [`IMessageLogger`](../interfaces/LoggingUtils.IMessageLogger.md)

## Table of contents

### Constructors

- [constructor](SFUConnection.SFUConnection.md#constructor)

### Properties

- [playerId](SFUConnection.SFUConnection.md#playerid)
- [protocol](SFUConnection.SFUConnection.md#protocol)
- [remoteAddress](SFUConnection.SFUConnection.md#remoteaddress)
- [streamerId](SFUConnection.SFUConnection.md#streamerid)
- [streaming](SFUConnection.SFUConnection.md#streaming)
- [subscribedStreamer](SFUConnection.SFUConnection.md#subscribedstreamer)
- [transport](SFUConnection.SFUConnection.md#transport)

### Methods

- [getPlayerInfo](SFUConnection.SFUConnection.md#getplayerinfo)
- [getReadableIdentifier](SFUConnection.SFUConnection.md#getreadableidentifier)
- [getStreamerInfo](SFUConnection.SFUConnection.md#getstreamerinfo)
- [sendMessage](SFUConnection.SFUConnection.md#sendmessage)

## Constructors

### constructor

• **new SFUConnection**(`server`, `ws`, `remoteAddress?`): [`SFUConnection`](SFUConnection.SFUConnection.md)

Construct a new SFU connection.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `server` | [`SignallingServer`](SignallingServer.SignallingServer.md) | The signalling server object that spawned this sfu. |
| `ws` | `WebSocket` | The websocket coupled to this sfu connection. |
| `remoteAddress?` | `string` | The remote address of this connection. Only used as display. |

#### Returns

[`SFUConnection`](SFUConnection.SFUConnection.md)

#### Overrides

EventEmitter.constructor

#### Defined in

[SFUConnection.ts:50](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/ebacbf2/new_cirrus/src/SFUConnection.ts#L50)

## Properties

### playerId

• **playerId**: `string`

#### Implementation of

[IPlayer](../interfaces/PlayerRegistry.IPlayer.md).[playerId](../interfaces/PlayerRegistry.IPlayer.md#playerid)

#### Defined in

[SFUConnection.ts:34](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/ebacbf2/new_cirrus/src/SFUConnection.ts#L34)

___

### protocol

• **protocol**: `SignallingProtocol`

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[protocol](../interfaces/StreamerRegistry.IStreamer.md#protocol)

#### Defined in

[SFUConnection.ts:33](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/ebacbf2/new_cirrus/src/SFUConnection.ts#L33)

___

### remoteAddress

• `Optional` **remoteAddress**: `string`

#### Defined in

[SFUConnection.ts:37](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/ebacbf2/new_cirrus/src/SFUConnection.ts#L37)

___

### streamerId

• **streamerId**: `string`

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[streamerId](../interfaces/StreamerRegistry.IStreamer.md#streamerid)

#### Defined in

[SFUConnection.ts:35](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/ebacbf2/new_cirrus/src/SFUConnection.ts#L35)

___

### streaming

• **streaming**: `boolean`

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[streaming](../interfaces/StreamerRegistry.IStreamer.md#streaming)

#### Defined in

[SFUConnection.ts:36](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/ebacbf2/new_cirrus/src/SFUConnection.ts#L36)

___

### subscribedStreamer

• **subscribedStreamer**: ``null`` \| [`IStreamer`](../interfaces/StreamerRegistry.IStreamer.md)

#### Implementation of

[IPlayer](../interfaces/PlayerRegistry.IPlayer.md).[subscribedStreamer](../interfaces/PlayerRegistry.IPlayer.md#subscribedstreamer)

#### Defined in

[SFUConnection.ts:38](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/ebacbf2/new_cirrus/src/SFUConnection.ts#L38)

___

### transport

• **transport**: `ITransport`

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[transport](../interfaces/StreamerRegistry.IStreamer.md#transport)

#### Defined in

[SFUConnection.ts:32](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/ebacbf2/new_cirrus/src/SFUConnection.ts#L32)

## Methods

### getPlayerInfo

▸ **getPlayerInfo**(): [`IPlayerInfo`](../interfaces/PlayerRegistry.IPlayerInfo.md)

Returns a descriptive object for the REST API inspection operations.

#### Returns

[`IPlayerInfo`](../interfaces/PlayerRegistry.IPlayerInfo.md)

An IPlayerInfo object containing viewable information about this connection.

#### Implementation of

[IPlayer](../interfaces/PlayerRegistry.IPlayer.md).[getPlayerInfo](../interfaces/PlayerRegistry.IPlayer.md#getplayerinfo)

#### Defined in

[SFUConnection.ts:105](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/ebacbf2/new_cirrus/src/SFUConnection.ts#L105)

___

### getReadableIdentifier

▸ **getReadableIdentifier**(): `string`

Returns an identifier that is displayed in logs.

#### Returns

`string`

A string describing this connection.

#### Implementation of

[IMessageLogger](../interfaces/LoggingUtils.IMessageLogger.md).[getReadableIdentifier](../interfaces/LoggingUtils.IMessageLogger.md#getreadableidentifier)

#### Defined in

[SFUConnection.ts:76](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/ebacbf2/new_cirrus/src/SFUConnection.ts#L76)

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

[SFUConnection.ts:91](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/ebacbf2/new_cirrus/src/SFUConnection.ts#L91)

___

### sendMessage

▸ **sendMessage**(`message`): `void`

Sends a signalling message to the SFU.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `BaseMessage` | The message to send. |

#### Returns

`void`

#### Implementation of

[IStreamer](../interfaces/StreamerRegistry.IStreamer.md).[sendMessage](../interfaces/StreamerRegistry.IStreamer.md#sendmessage)

#### Defined in

[SFUConnection.ts:82](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/ebacbf2/new_cirrus/src/SFUConnection.ts#L82)

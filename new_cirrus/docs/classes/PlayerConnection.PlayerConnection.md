[new-cirrus](../README.md) / [Exports](../modules.md) / [PlayerConnection](../modules/PlayerConnection.md) / PlayerConnection

# Class: PlayerConnection

[PlayerConnection](../modules/PlayerConnection.md).PlayerConnection

A connection between the signalling server and a player connection.
This is where messages expected to be handled by the player come in
and where messages are sent to the player.

Interesting internals:
playerId: The unique id string of this player.
transport: The ITransport where transport events can be subscribed to
protocol: The SignallingProtocol where signalling messages can be
subscribed to.

## Implements

- [`IPlayer`](../interfaces/PlayerRegistry.IPlayer.md)
- [`IMessageLogger`](../interfaces/LoggingUtils.IMessageLogger.md)

## Table of contents

### Constructors

- [constructor](PlayerConnection.PlayerConnection.md#constructor)

### Properties

- [playerId](PlayerConnection.PlayerConnection.md#playerid)
- [protocol](PlayerConnection.PlayerConnection.md#protocol)
- [remoteAddress](PlayerConnection.PlayerConnection.md#remoteaddress)
- [subscribedStreamer](PlayerConnection.PlayerConnection.md#subscribedstreamer)
- [transport](PlayerConnection.PlayerConnection.md#transport)

### Methods

- [getPlayerInfo](PlayerConnection.PlayerConnection.md#getplayerinfo)
- [getReadableIdentifier](PlayerConnection.PlayerConnection.md#getreadableidentifier)
- [sendMessage](PlayerConnection.PlayerConnection.md#sendmessage)

## Constructors

### constructor

• **new PlayerConnection**(`server`, `ws`, `request`, `sendOffer`): [`PlayerConnection`](PlayerConnection.PlayerConnection.md)

Construct a new player connection.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `server` | [`SignallingServer`](SignallingServer.SignallingServer.md) | The signalling server object that spawned this player. |
| `ws` | `WebSocket` | The websocket coupled to this player connection. |
| `request` | `IncomingMessage` | - |
| `sendOffer` | `boolean` | True if the player is requesting to receive offers from streamers. |

#### Returns

[`PlayerConnection`](PlayerConnection.PlayerConnection.md)

#### Defined in

[PlayerConnection.ts:45](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/PlayerConnection.ts#L45)

## Properties

### playerId

• **playerId**: `string`

#### Implementation of

[IPlayer](../interfaces/PlayerRegistry.IPlayer.md).[playerId](../interfaces/PlayerRegistry.IPlayer.md#playerid)

#### Defined in

[PlayerConnection.ts:28](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/PlayerConnection.ts#L28)

___

### protocol

• **protocol**: `SignallingProtocol`

#### Implementation of

[IPlayer](../interfaces/PlayerRegistry.IPlayer.md).[protocol](../interfaces/PlayerRegistry.IPlayer.md#protocol)

#### Defined in

[PlayerConnection.ts:30](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/PlayerConnection.ts#L30)

___

### remoteAddress

• **remoteAddress**: `undefined` \| `string`

#### Defined in

[PlayerConnection.ts:32](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/PlayerConnection.ts#L32)

___

### subscribedStreamer

• **subscribedStreamer**: ``null`` \| [`IStreamer`](../interfaces/StreamerRegistry.IStreamer.md)

#### Implementation of

[IPlayer](../interfaces/PlayerRegistry.IPlayer.md).[subscribedStreamer](../interfaces/PlayerRegistry.IPlayer.md#subscribedstreamer)

#### Defined in

[PlayerConnection.ts:31](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/PlayerConnection.ts#L31)

___

### transport

• **transport**: `ITransport`

#### Defined in

[PlayerConnection.ts:29](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/PlayerConnection.ts#L29)

## Methods

### getPlayerInfo

▸ **getPlayerInfo**(): [`IPlayerInfo`](../interfaces/PlayerRegistry.IPlayerInfo.md)

#### Returns

[`IPlayerInfo`](../interfaces/PlayerRegistry.IPlayerInfo.md)

#### Implementation of

[IPlayer](../interfaces/PlayerRegistry.IPlayer.md).[getPlayerInfo](../interfaces/PlayerRegistry.IPlayer.md#getplayerinfo)

#### Defined in

[PlayerConnection.ts:73](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/PlayerConnection.ts#L73)

___

### getReadableIdentifier

▸ **getReadableIdentifier**(): `string`

#### Returns

`string`

#### Implementation of

[IMessageLogger](../interfaces/LoggingUtils.IMessageLogger.md).[getReadableIdentifier](../interfaces/LoggingUtils.IMessageLogger.md#getreadableidentifier)

#### Defined in

[PlayerConnection.ts:63](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/PlayerConnection.ts#L63)

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

[IPlayer](../interfaces/PlayerRegistry.IPlayer.md).[sendMessage](../interfaces/PlayerRegistry.IPlayer.md#sendmessage)

#### Defined in

[PlayerConnection.ts:68](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/PlayerConnection.ts#L68)

[wilbur](../README.md) / [Exports](../modules.md) / [PlayerConnection](../modules/PlayerConnection.md) / PlayerConnection

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

• **new PlayerConnection**(`server`, `ws`, `sendOffer`, `remoteAddress?`): [`PlayerConnection`](PlayerConnection.PlayerConnection.md)

Initializes a new connection with given and sane values. Adds listeners for the
websocket close and error so it can react by unsubscribing and resetting itself.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `server` | [`SignallingServer`](SignallingServer.SignallingServer.md) | The signalling server object that spawned this player. |
| `ws` | `WebSocket` | The websocket coupled to this player connection. |
| `sendOffer` | `boolean` | True if the player is requesting to receive offers from streamers. |
| `remoteAddress?` | `string` | The remote address of this connection. Only used as display. |

#### Returns

[`PlayerConnection`](PlayerConnection.PlayerConnection.md)

#### Defined in

[PlayerConnection.ts:46](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/e8a95da/new_cirrus/src/PlayerConnection.ts#L46)

## Properties

### playerId

• **playerId**: `string`

#### Implementation of

[IPlayer](../interfaces/PlayerRegistry.IPlayer.md).[playerId](../interfaces/PlayerRegistry.IPlayer.md#playerid)

#### Defined in

[PlayerConnection.ts:27](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/e8a95da/new_cirrus/src/PlayerConnection.ts#L27)

___

### protocol

• **protocol**: `SignallingProtocol`

#### Implementation of

[IPlayer](../interfaces/PlayerRegistry.IPlayer.md).[protocol](../interfaces/PlayerRegistry.IPlayer.md#protocol)

#### Defined in

[PlayerConnection.ts:29](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/e8a95da/new_cirrus/src/PlayerConnection.ts#L29)

___

### remoteAddress

• `Optional` **remoteAddress**: `string`

#### Defined in

[PlayerConnection.ts:31](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/e8a95da/new_cirrus/src/PlayerConnection.ts#L31)

___

### subscribedStreamer

• **subscribedStreamer**: ``null`` \| [`IStreamer`](../interfaces/StreamerRegistry.IStreamer.md)

#### Implementation of

[IPlayer](../interfaces/PlayerRegistry.IPlayer.md).[subscribedStreamer](../interfaces/PlayerRegistry.IPlayer.md#subscribedstreamer)

#### Defined in

[PlayerConnection.ts:30](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/e8a95da/new_cirrus/src/PlayerConnection.ts#L30)

___

### transport

• **transport**: `ITransport`

#### Defined in

[PlayerConnection.ts:28](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/e8a95da/new_cirrus/src/PlayerConnection.ts#L28)

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

[PlayerConnection.ts:83](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/e8a95da/new_cirrus/src/PlayerConnection.ts#L83)

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

[PlayerConnection.ts:68](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/e8a95da/new_cirrus/src/PlayerConnection.ts#L68)

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

[IPlayer](../interfaces/PlayerRegistry.IPlayer.md).[sendMessage](../interfaces/PlayerRegistry.IPlayer.md#sendmessage)

#### Defined in

[PlayerConnection.ts:74](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/e8a95da/new_cirrus/src/PlayerConnection.ts#L74)

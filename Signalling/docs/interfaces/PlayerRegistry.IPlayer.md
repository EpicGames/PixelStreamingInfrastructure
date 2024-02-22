[@epicgames-ps/lib-pixelstreamingsignalling-ue5.5](../README.md) / [PlayerRegistry](../modules/PlayerRegistry.md) / IPlayer

# Interface: IPlayer

[PlayerRegistry](../modules/PlayerRegistry.md).IPlayer

An interface that describes a player that can be added to the
player registry.

## Hierarchy

- [`IMessageLogger`](LoggingUtils.IMessageLogger.md)

  ↳ **`IPlayer`**

## Implemented by

- [`PlayerConnection`](../classes/PlayerConnection.PlayerConnection.md)
- [`SFUConnection`](../classes/SFUConnection.SFUConnection.md)

## Table of contents

### Properties

- [playerId](PlayerRegistry.IPlayer.md#playerid)
- [protocol](PlayerRegistry.IPlayer.md#protocol)
- [subscribedStreamer](PlayerRegistry.IPlayer.md#subscribedstreamer)

### Methods

- [getPlayerInfo](PlayerRegistry.IPlayer.md#getplayerinfo)
- [getReadableIdentifier](PlayerRegistry.IPlayer.md#getreadableidentifier)
- [sendMessage](PlayerRegistry.IPlayer.md#sendmessage)

## Properties

### playerId

• **playerId**: `string`

#### Defined in

[PlayerRegistry.ts:12](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/a6184ae/Signalling/src/PlayerRegistry.ts#L12)

___

### protocol

• **protocol**: `SignallingProtocol`

#### Defined in

[PlayerRegistry.ts:13](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/a6184ae/Signalling/src/PlayerRegistry.ts#L13)

___

### subscribedStreamer

• **subscribedStreamer**: [`IStreamer`](StreamerRegistry.IStreamer.md)

#### Defined in

[PlayerRegistry.ts:14](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/a6184ae/Signalling/src/PlayerRegistry.ts#L14)

## Methods

### getPlayerInfo

▸ **getPlayerInfo**(): [`IPlayerInfo`](PlayerRegistry.IPlayerInfo.md)

#### Returns

[`IPlayerInfo`](PlayerRegistry.IPlayerInfo.md)

#### Defined in

[PlayerRegistry.ts:17](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/a6184ae/Signalling/src/PlayerRegistry.ts#L17)

___

### getReadableIdentifier

▸ **getReadableIdentifier**(): `string`

#### Returns

`string`

#### Inherited from

[IMessageLogger](LoggingUtils.IMessageLogger.md).[getReadableIdentifier](LoggingUtils.IMessageLogger.md#getreadableidentifier)

#### Defined in

[LoggingUtils.ts:9](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/a6184ae/Signalling/src/LoggingUtils.ts#L9)

___

### sendMessage

▸ **sendMessage**(`message`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `BaseMessage` |

#### Returns

`void`

#### Defined in

[PlayerRegistry.ts:16](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/a6184ae/Signalling/src/PlayerRegistry.ts#L16)

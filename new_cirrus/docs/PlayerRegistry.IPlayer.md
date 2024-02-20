# Interface: IPlayer

[PlayerRegistry](../wiki/PlayerRegistry).IPlayer

An interface that describes a player that can be added to the
player registry.

## Hierarchy

- [`IMessageLogger`](../wiki/LoggingUtils.IMessageLogger)

  ↳ **`IPlayer`**

## Implemented by

- [`PlayerConnection`](../wiki/PlayerConnection.PlayerConnection)
- [`SFUConnection`](../wiki/SFUConnection.SFUConnection)

## Table of contents

### Properties

- [playerId](../wiki/PlayerRegistry.IPlayer#playerid)
- [protocol](../wiki/PlayerRegistry.IPlayer#protocol)
- [subscribedStreamer](../wiki/PlayerRegistry.IPlayer#subscribedstreamer)

### Methods

- [getPlayerInfo](../wiki/PlayerRegistry.IPlayer#getplayerinfo)
- [getReadableIdentifier](../wiki/PlayerRegistry.IPlayer#getreadableidentifier)
- [sendMessage](../wiki/PlayerRegistry.IPlayer#sendmessage)

## Properties

### playerId

• **playerId**: `string`

#### Defined in

[src/PlayerRegistry.ts:12](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerRegistry.ts#L12)

___

### protocol

• **protocol**: `SignallingProtocol`

#### Defined in

[src/PlayerRegistry.ts:13](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerRegistry.ts#L13)

___

### subscribedStreamer

• **subscribedStreamer**: ``null`` \| [`IStreamer`](../wiki/StreamerRegistry.IStreamer)

#### Defined in

[src/PlayerRegistry.ts:14](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerRegistry.ts#L14)

## Methods

### getPlayerInfo

▸ **getPlayerInfo**(): [`IPlayerInfo`](../wiki/PlayerRegistry.IPlayerInfo)

#### Returns

[`IPlayerInfo`](../wiki/PlayerRegistry.IPlayerInfo)

#### Defined in

[src/PlayerRegistry.ts:17](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerRegistry.ts#L17)

___

### getReadableIdentifier

▸ **getReadableIdentifier**(): `string`

#### Returns

`string`

#### Inherited from

[IMessageLogger](../wiki/LoggingUtils.IMessageLogger).[getReadableIdentifier](../wiki/LoggingUtils.IMessageLogger#getreadableidentifier)

#### Defined in

[src/LoggingUtils.ts:9](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/LoggingUtils.ts#L9)

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

[src/PlayerRegistry.ts:16](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerRegistry.ts#L16)

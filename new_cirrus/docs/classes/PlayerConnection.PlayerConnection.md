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
- [sendOffer](PlayerConnection.PlayerConnection.md#sendoffer)
- [server](PlayerConnection.PlayerConnection.md#server)
- [streamerDisconnectedListener](PlayerConnection.PlayerConnection.md#streamerdisconnectedlistener)
- [streamerIdChangeListener](PlayerConnection.PlayerConnection.md#streameridchangelistener)
- [subscribedStreamer](PlayerConnection.PlayerConnection.md#subscribedstreamer)
- [transport](PlayerConnection.PlayerConnection.md#transport)

### Methods

- [disconnect](PlayerConnection.PlayerConnection.md#disconnect)
- [getPlayerInfo](PlayerConnection.PlayerConnection.md#getplayerinfo)
- [getReadableIdentifier](PlayerConnection.PlayerConnection.md#getreadableidentifier)
- [onListStreamers](PlayerConnection.PlayerConnection.md#onliststreamers)
- [onStreamerDisconnected](PlayerConnection.PlayerConnection.md#onstreamerdisconnected)
- [onStreamerIdChanged](PlayerConnection.PlayerConnection.md#onstreameridchanged)
- [onStreamerRemoved](PlayerConnection.PlayerConnection.md#onstreamerremoved)
- [onSubscribeMessage](PlayerConnection.PlayerConnection.md#onsubscribemessage)
- [onTransportClose](PlayerConnection.PlayerConnection.md#ontransportclose)
- [onTransportError](PlayerConnection.PlayerConnection.md#ontransporterror)
- [onUnsubscribeMessage](PlayerConnection.PlayerConnection.md#onunsubscribemessage)
- [registerMessageHandlers](PlayerConnection.PlayerConnection.md#registermessagehandlers)
- [sendMessage](PlayerConnection.PlayerConnection.md#sendmessage)
- [sendToStreamer](PlayerConnection.PlayerConnection.md#sendtostreamer)
- [subscribe](PlayerConnection.PlayerConnection.md#subscribe)
- [unsubscribe](PlayerConnection.PlayerConnection.md#unsubscribe)

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

[src/PlayerConnection.ts:45](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L45)

## Properties

### playerId

• **playerId**: `string`

#### Implementation of

[IPlayer](../interfaces/PlayerRegistry.IPlayer.md).[playerId](../interfaces/PlayerRegistry.IPlayer.md#playerid)

#### Defined in

[src/PlayerConnection.ts:28](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L28)

___

### protocol

• **protocol**: `SignallingProtocol`

#### Implementation of

[IPlayer](../interfaces/PlayerRegistry.IPlayer.md).[protocol](../interfaces/PlayerRegistry.IPlayer.md#protocol)

#### Defined in

[src/PlayerConnection.ts:30](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L30)

___

### remoteAddress

• **remoteAddress**: `undefined` \| `string`

#### Defined in

[src/PlayerConnection.ts:32](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L32)

___

### sendOffer

• `Private` **sendOffer**: `boolean`

#### Defined in

[src/PlayerConnection.ts:34](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L34)

___

### server

• `Private` **server**: [`SignallingServer`](SignallingServer.SignallingServer.md)

#### Defined in

[src/PlayerConnection.ts:27](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L27)

___

### streamerDisconnectedListener

• `Private` **streamerDisconnectedListener**: () => `void`

#### Type declaration

▸ (): `void`

##### Returns

`void`

#### Defined in

[src/PlayerConnection.ts:36](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L36)

___

### streamerIdChangeListener

• `Private` **streamerIdChangeListener**: (`newId`: `string`) => `void`

#### Type declaration

▸ (`newId`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `newId` | `string` |

##### Returns

`void`

#### Defined in

[src/PlayerConnection.ts:35](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L35)

___

### subscribedStreamer

• **subscribedStreamer**: ``null`` \| [`IStreamer`](../interfaces/StreamerRegistry.IStreamer.md)

#### Implementation of

[IPlayer](../interfaces/PlayerRegistry.IPlayer.md).[subscribedStreamer](../interfaces/PlayerRegistry.IPlayer.md#subscribedstreamer)

#### Defined in

[src/PlayerConnection.ts:31](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L31)

___

### transport

• **transport**: `ITransport`

#### Defined in

[src/PlayerConnection.ts:29](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L29)

## Methods

### disconnect

▸ **disconnect**(): `void`

#### Returns

`void`

#### Defined in

[src/PlayerConnection.ts:150](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L150)

___

### getPlayerInfo

▸ **getPlayerInfo**(): [`IPlayerInfo`](../interfaces/PlayerRegistry.IPlayerInfo.md)

#### Returns

[`IPlayerInfo`](../interfaces/PlayerRegistry.IPlayerInfo.md)

#### Implementation of

[IPlayer](../interfaces/PlayerRegistry.IPlayer.md).[getPlayerInfo](../interfaces/PlayerRegistry.IPlayer.md#getplayerinfo)

#### Defined in

[src/PlayerConnection.ts:73](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L73)

___

### getReadableIdentifier

▸ **getReadableIdentifier**(): `string`

#### Returns

`string`

#### Implementation of

[IMessageLogger](../interfaces/LoggingUtils.IMessageLogger.md).[getReadableIdentifier](../interfaces/LoggingUtils.IMessageLogger.md#getreadableidentifier)

#### Defined in

[src/PlayerConnection.ts:63](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L63)

___

### onListStreamers

▸ **onListStreamers**(`_message`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `_message` | `listStreamers` |

#### Returns

`void`

#### Defined in

[src/PlayerConnection.ts:176](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L176)

___

### onStreamerDisconnected

▸ **onStreamerDisconnected**(): `void`

#### Returns

`void`

#### Defined in

[src/PlayerConnection.ts:155](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L155)

___

### onStreamerIdChanged

▸ **onStreamerIdChanged**(`newId`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `newId` | `string` |

#### Returns

`void`

#### Defined in

[src/PlayerConnection.ts:181](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L181)

___

### onStreamerRemoved

▸ **onStreamerRemoved**(): `void`

#### Returns

`void`

#### Defined in

[src/PlayerConnection.ts:186](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L186)

___

### onSubscribeMessage

▸ **onSubscribeMessage**(`message`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `subscribe` |

#### Returns

`void`

#### Defined in

[src/PlayerConnection.ts:168](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L168)

___

### onTransportClose

▸ **onTransportClose**(`_event`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `_event` | `CloseEvent` |

#### Returns

`void`

#### Defined in

[src/PlayerConnection.ts:163](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L163)

___

### onTransportError

▸ **onTransportError**(`error`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `ErrorEvent` |

#### Returns

`void`

#### Defined in

[src/PlayerConnection.ts:159](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L159)

___

### onUnsubscribeMessage

▸ **onUnsubscribeMessage**(`_message`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `_message` | `unsubscribe` |

#### Returns

`void`

#### Defined in

[src/PlayerConnection.ts:172](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L172)

___

### registerMessageHandlers

▸ **registerMessageHandlers**(): `void`

#### Returns

`void`

#### Defined in

[src/PlayerConnection.ts:83](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L83)

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

[src/PlayerConnection.ts:68](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L68)

___

### sendToStreamer

▸ **sendToStreamer**(`message`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `BaseMessage` |

#### Returns

`void`

#### Defined in

[src/PlayerConnection.ts:95](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L95)

___

### subscribe

▸ **subscribe**(`streamerId`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `streamerId` | `string` |

#### Returns

`void`

#### Defined in

[src/PlayerConnection.ts:114](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L114)

___

### unsubscribe

▸ **unsubscribe**(): `void`

#### Returns

`void`

#### Defined in

[src/PlayerConnection.ts:137](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/PlayerConnection.ts#L137)

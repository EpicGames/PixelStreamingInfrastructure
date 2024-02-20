# Class: PlayerConnection

[PlayerConnection](../wiki/PlayerConnection).PlayerConnection

A connection between the signalling server and a player connection.
This is where messages expected to be handled by the player come in
and where messages are sent to the player.

Interesting internals:
playerId: The unique id string of this player.
transport: The ITransport where transport events can be subscribed to
protocol: The SignallingProtocol where signalling messages can be
subscribed to.

## Implements

- [`IPlayer`](../wiki/PlayerRegistry.IPlayer)
- [`IMessageLogger`](../wiki/LoggingUtils.IMessageLogger)

## Table of contents

### Constructors

- [constructor](../wiki/PlayerConnection.PlayerConnection#constructor)

### Properties

- [playerId](../wiki/PlayerConnection.PlayerConnection#playerid)
- [protocol](../wiki/PlayerConnection.PlayerConnection#protocol)
- [remoteAddress](../wiki/PlayerConnection.PlayerConnection#remoteaddress)
- [sendOffer](../wiki/PlayerConnection.PlayerConnection#sendoffer)
- [server](../wiki/PlayerConnection.PlayerConnection#server)
- [streamerDisconnectedListener](../wiki/PlayerConnection.PlayerConnection#streamerdisconnectedlistener)
- [streamerIdChangeListener](../wiki/PlayerConnection.PlayerConnection#streameridchangelistener)
- [subscribedStreamer](../wiki/PlayerConnection.PlayerConnection#subscribedstreamer)
- [transport](../wiki/PlayerConnection.PlayerConnection#transport)

### Methods

- [disconnect](../wiki/PlayerConnection.PlayerConnection#disconnect)
- [getPlayerInfo](../wiki/PlayerConnection.PlayerConnection#getplayerinfo)
- [getReadableIdentifier](../wiki/PlayerConnection.PlayerConnection#getreadableidentifier)
- [onListStreamers](../wiki/PlayerConnection.PlayerConnection#onliststreamers)
- [onStreamerDisconnected](../wiki/PlayerConnection.PlayerConnection#onstreamerdisconnected)
- [onStreamerIdChanged](../wiki/PlayerConnection.PlayerConnection#onstreameridchanged)
- [onStreamerRemoved](../wiki/PlayerConnection.PlayerConnection#onstreamerremoved)
- [onSubscribeMessage](../wiki/PlayerConnection.PlayerConnection#onsubscribemessage)
- [onTransportClose](../wiki/PlayerConnection.PlayerConnection#ontransportclose)
- [onTransportError](../wiki/PlayerConnection.PlayerConnection#ontransporterror)
- [onUnsubscribeMessage](../wiki/PlayerConnection.PlayerConnection#onunsubscribemessage)
- [registerMessageHandlers](../wiki/PlayerConnection.PlayerConnection#registermessagehandlers)
- [sendMessage](../wiki/PlayerConnection.PlayerConnection#sendmessage)
- [sendToStreamer](../wiki/PlayerConnection.PlayerConnection#sendtostreamer)
- [subscribe](../wiki/PlayerConnection.PlayerConnection#subscribe)
- [unsubscribe](../wiki/PlayerConnection.PlayerConnection#unsubscribe)

## Constructors

### constructor

• **new PlayerConnection**(`server`, `ws`, `request`, `sendOffer`): [`PlayerConnection`](../wiki/PlayerConnection.PlayerConnection)

Construct a new player connection.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `server` | [`SignallingServer`](../wiki/SignallingServer.SignallingServer) | The signalling server object that spawned this player. |
| `ws` | `WebSocket` | The websocket coupled to this player connection. |
| `request` | `IncomingMessage` | - |
| `sendOffer` | `boolean` | True if the player is requesting to receive offers from streamers. |

#### Returns

[`PlayerConnection`](../wiki/PlayerConnection.PlayerConnection)

#### Defined in

[src/PlayerConnection.ts:45](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L45)

## Properties

### playerId

• **playerId**: `string`

#### Implementation of

[IPlayer](../wiki/PlayerRegistry.IPlayer).[playerId](../wiki/PlayerRegistry.IPlayer#playerid)

#### Defined in

[src/PlayerConnection.ts:28](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L28)

___

### protocol

• **protocol**: `SignallingProtocol`

#### Implementation of

[IPlayer](../wiki/PlayerRegistry.IPlayer).[protocol](../wiki/PlayerRegistry.IPlayer#protocol)

#### Defined in

[src/PlayerConnection.ts:30](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L30)

___

### remoteAddress

• **remoteAddress**: `undefined` \| `string`

#### Defined in

[src/PlayerConnection.ts:32](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L32)

___

### sendOffer

• `Private` **sendOffer**: `boolean`

#### Defined in

[src/PlayerConnection.ts:34](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L34)

___

### server

• `Private` **server**: [`SignallingServer`](../wiki/SignallingServer.SignallingServer)

#### Defined in

[src/PlayerConnection.ts:27](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L27)

___

### streamerDisconnectedListener

• `Private` **streamerDisconnectedListener**: () => `void`

#### Type declaration

▸ (): `void`

##### Returns

`void`

#### Defined in

[src/PlayerConnection.ts:36](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L36)

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

[src/PlayerConnection.ts:35](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L35)

___

### subscribedStreamer

• **subscribedStreamer**: ``null`` \| [`IStreamer`](../wiki/StreamerRegistry.IStreamer)

#### Implementation of

[IPlayer](../wiki/PlayerRegistry.IPlayer).[subscribedStreamer](../wiki/PlayerRegistry.IPlayer#subscribedstreamer)

#### Defined in

[src/PlayerConnection.ts:31](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L31)

___

### transport

• **transport**: `ITransport`

#### Defined in

[src/PlayerConnection.ts:29](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L29)

## Methods

### disconnect

▸ **disconnect**(): `void`

#### Returns

`void`

#### Defined in

[src/PlayerConnection.ts:150](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L150)

___

### getPlayerInfo

▸ **getPlayerInfo**(): [`IPlayerInfo`](../wiki/PlayerRegistry.IPlayerInfo)

#### Returns

[`IPlayerInfo`](../wiki/PlayerRegistry.IPlayerInfo)

#### Implementation of

[IPlayer](../wiki/PlayerRegistry.IPlayer).[getPlayerInfo](../wiki/PlayerRegistry.IPlayer#getplayerinfo)

#### Defined in

[src/PlayerConnection.ts:73](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L73)

___

### getReadableIdentifier

▸ **getReadableIdentifier**(): `string`

#### Returns

`string`

#### Implementation of

[IMessageLogger](../wiki/LoggingUtils.IMessageLogger).[getReadableIdentifier](../wiki/LoggingUtils.IMessageLogger#getreadableidentifier)

#### Defined in

[src/PlayerConnection.ts:63](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L63)

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

[src/PlayerConnection.ts:176](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L176)

___

### onStreamerDisconnected

▸ **onStreamerDisconnected**(): `void`

#### Returns

`void`

#### Defined in

[src/PlayerConnection.ts:155](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L155)

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

[src/PlayerConnection.ts:181](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L181)

___

### onStreamerRemoved

▸ **onStreamerRemoved**(): `void`

#### Returns

`void`

#### Defined in

[src/PlayerConnection.ts:186](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L186)

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

[src/PlayerConnection.ts:168](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L168)

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

[src/PlayerConnection.ts:163](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L163)

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

[src/PlayerConnection.ts:159](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L159)

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

[src/PlayerConnection.ts:172](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L172)

___

### registerMessageHandlers

▸ **registerMessageHandlers**(): `void`

#### Returns

`void`

#### Defined in

[src/PlayerConnection.ts:83](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L83)

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

[IPlayer](../wiki/PlayerRegistry.IPlayer).[sendMessage](../wiki/PlayerRegistry.IPlayer#sendmessage)

#### Defined in

[src/PlayerConnection.ts:68](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L68)

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

[src/PlayerConnection.ts:95](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L95)

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

[src/PlayerConnection.ts:114](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L114)

___

### unsubscribe

▸ **unsubscribe**(): `void`

#### Returns

`void`

#### Defined in

[src/PlayerConnection.ts:137](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/PlayerConnection.ts#L137)

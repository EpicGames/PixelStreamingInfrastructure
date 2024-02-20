# Class: SignallingServer

[SignallingServer](../wiki/SignallingServer).SignallingServer

The main signalling server object.
Contains a streamer and player registry and handles setting up of websockets
to listen for incoming connections.

## Table of contents

### Constructors

- [constructor](../wiki/SignallingServer.SignallingServer#constructor)

### Properties

- [config](../wiki/SignallingServer.SignallingServer#config)
- [playerRegistry](../wiki/SignallingServer.SignallingServer#playerregistry)
- [protocolConfig](../wiki/SignallingServer.SignallingServer#protocolconfig)
- [startTime](../wiki/SignallingServer.SignallingServer#starttime)
- [streamerRegistry](../wiki/SignallingServer.SignallingServer#streamerregistry)

### Methods

- [onPlayerConnected](../wiki/SignallingServer.SignallingServer#onplayerconnected)
- [onSFUConnected](../wiki/SignallingServer.SignallingServer#onsfuconnected)
- [onStreamerConnected](../wiki/SignallingServer.SignallingServer#onstreamerconnected)

## Constructors

### constructor

• **new SignallingServer**(`config`): [`SignallingServer`](../wiki/SignallingServer.SignallingServer)

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IServerConfig`](../wiki/SignallingServer.IServerConfig) |

#### Returns

[`SignallingServer`](../wiki/SignallingServer.SignallingServer)

#### Defined in

[src/SignallingServer.ts:55](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/SignallingServer.ts#L55)

## Properties

### config

• **config**: [`IServerConfig`](../wiki/SignallingServer.IServerConfig)

#### Defined in

[src/SignallingServer.ts:49](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/SignallingServer.ts#L49)

___

### playerRegistry

• **playerRegistry**: [`PlayerRegistry`](../wiki/PlayerRegistry.PlayerRegistry)

#### Defined in

[src/SignallingServer.ts:52](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/SignallingServer.ts#L52)

___

### protocolConfig

• **protocolConfig**: `any`

#### Defined in

[src/SignallingServer.ts:50](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/SignallingServer.ts#L50)

___

### startTime

• **startTime**: `Date`

#### Defined in

[src/SignallingServer.ts:53](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/SignallingServer.ts#L53)

___

### streamerRegistry

• **streamerRegistry**: [`StreamerRegistry`](../wiki/StreamerRegistry.StreamerRegistry)

#### Defined in

[src/SignallingServer.ts:51](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/SignallingServer.ts#L51)

## Methods

### onPlayerConnected

▸ **onPlayerConnected**(`ws`, `request`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `ws` | `WebSocket` |
| `request` | `IncomingMessage` |

#### Returns

`void`

#### Defined in

[src/SignallingServer.ts:107](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/SignallingServer.ts#L107)

___

### onSFUConnected

▸ **onSFUConnected**(`ws`, `request`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `ws` | `WebSocket` |
| `request` | `IncomingMessage` |

#### Returns

`void`

#### Defined in

[src/SignallingServer.ts:128](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/SignallingServer.ts#L128)

___

### onStreamerConnected

▸ **onStreamerConnected**(`ws`, `request`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `ws` | `WebSocket` |
| `request` | `IncomingMessage` |

#### Returns

`void`

#### Defined in

[src/SignallingServer.ts:95](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/SignallingServer.ts#L95)

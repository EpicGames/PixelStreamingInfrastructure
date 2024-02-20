[new-cirrus](../README.md) / [Exports](../modules.md) / [SignallingServer](../modules/SignallingServer.md) / SignallingServer

# Class: SignallingServer

[SignallingServer](../modules/SignallingServer.md).SignallingServer

The main signalling server object.
Contains a streamer and player registry and handles setting up of websockets
to listen for incoming connections.

## Table of contents

### Constructors

- [constructor](SignallingServer.SignallingServer.md#constructor)

### Properties

- [config](SignallingServer.SignallingServer.md#config)
- [playerRegistry](SignallingServer.SignallingServer.md#playerregistry)
- [protocolConfig](SignallingServer.SignallingServer.md#protocolconfig)
- [startTime](SignallingServer.SignallingServer.md#starttime)
- [streamerRegistry](SignallingServer.SignallingServer.md#streamerregistry)

### Methods

- [onPlayerConnected](SignallingServer.SignallingServer.md#onplayerconnected)
- [onSFUConnected](SignallingServer.SignallingServer.md#onsfuconnected)
- [onStreamerConnected](SignallingServer.SignallingServer.md#onstreamerconnected)

## Constructors

### constructor

• **new SignallingServer**(`config`): [`SignallingServer`](SignallingServer.SignallingServer.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IServerConfig`](../interfaces/SignallingServer.IServerConfig.md) |

#### Returns

[`SignallingServer`](SignallingServer.SignallingServer.md)

#### Defined in

[src/SignallingServer.ts:55](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/SignallingServer.ts#L55)

## Properties

### config

• **config**: [`IServerConfig`](../interfaces/SignallingServer.IServerConfig.md)

#### Defined in

[src/SignallingServer.ts:49](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/SignallingServer.ts#L49)

___

### playerRegistry

• **playerRegistry**: [`PlayerRegistry`](PlayerRegistry.PlayerRegistry.md)

#### Defined in

[src/SignallingServer.ts:52](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/SignallingServer.ts#L52)

___

### protocolConfig

• **protocolConfig**: `any`

#### Defined in

[src/SignallingServer.ts:50](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/SignallingServer.ts#L50)

___

### startTime

• **startTime**: `Date`

#### Defined in

[src/SignallingServer.ts:53](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/SignallingServer.ts#L53)

___

### streamerRegistry

• **streamerRegistry**: [`StreamerRegistry`](StreamerRegistry.StreamerRegistry.md)

#### Defined in

[src/SignallingServer.ts:51](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/SignallingServer.ts#L51)

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

[src/SignallingServer.ts:107](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/SignallingServer.ts#L107)

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

[src/SignallingServer.ts:128](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/SignallingServer.ts#L128)

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

[src/SignallingServer.ts:95](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/33ba8d3/new_cirrus/src/SignallingServer.ts#L95)

[wilbur](../README.md) / [Exports](../modules.md) / [SignallingServer](../modules/SignallingServer.md) / SignallingServer

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

## Constructors

### constructor

• **new SignallingServer**(`config`): [`SignallingServer`](SignallingServer.SignallingServer.md)

Initializes the server object and sets up listening sockets for streamers
players and optionally SFU connections.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `config` | [`IServerConfig`](../interfaces/SignallingServer.IServerConfig.md) | A collection of options for this server. |

#### Returns

[`SignallingServer`](SignallingServer.SignallingServer.md)

#### Defined in

[SignallingServer.ts:60](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/4b7b7a5/new_cirrus/src/SignallingServer.ts#L60)

## Properties

### config

• **config**: [`IServerConfig`](../interfaces/SignallingServer.IServerConfig.md)

#### Defined in

[SignallingServer.ts:49](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/4b7b7a5/new_cirrus/src/SignallingServer.ts#L49)

___

### playerRegistry

• **playerRegistry**: [`PlayerRegistry`](PlayerRegistry.PlayerRegistry.md)

#### Defined in

[SignallingServer.ts:52](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/4b7b7a5/new_cirrus/src/SignallingServer.ts#L52)

___

### protocolConfig

• **protocolConfig**: `any`

#### Defined in

[SignallingServer.ts:50](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/4b7b7a5/new_cirrus/src/SignallingServer.ts#L50)

___

### startTime

• **startTime**: `Date`

#### Defined in

[SignallingServer.ts:53](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/4b7b7a5/new_cirrus/src/SignallingServer.ts#L53)

___

### streamerRegistry

• **streamerRegistry**: [`StreamerRegistry`](StreamerRegistry.StreamerRegistry.md)

#### Defined in

[SignallingServer.ts:51](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/4b7b7a5/new_cirrus/src/SignallingServer.ts#L51)

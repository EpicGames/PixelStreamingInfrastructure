[@epicgames-ps/lib-pixelstreamingsignalling-ue5.5](../README.md) / [SignallingServer](../modules/SignallingServer.md) / SignallingServer

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

[SignallingServer.ts:86](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Signalling/src/SignallingServer.ts#L86)

## Properties

### config

• **config**: [`IServerConfig`](../interfaces/SignallingServer.IServerConfig.md)

#### Defined in

[SignallingServer.ts:75](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Signalling/src/SignallingServer.ts#L75)

___

### playerRegistry

• **playerRegistry**: [`PlayerRegistry`](PlayerRegistry.PlayerRegistry.md)

#### Defined in

[SignallingServer.ts:78](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Signalling/src/SignallingServer.ts#L78)

___

### protocolConfig

• **protocolConfig**: `any`

#### Defined in

[SignallingServer.ts:76](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Signalling/src/SignallingServer.ts#L76)

___

### startTime

• **startTime**: `Date`

#### Defined in

[SignallingServer.ts:79](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Signalling/src/SignallingServer.ts#L79)

___

### streamerRegistry

• **streamerRegistry**: [`StreamerRegistry`](StreamerRegistry.StreamerRegistry.md)

#### Defined in

[SignallingServer.ts:77](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Signalling/src/SignallingServer.ts#L77)

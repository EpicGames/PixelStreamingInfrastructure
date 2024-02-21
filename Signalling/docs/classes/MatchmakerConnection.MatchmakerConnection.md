[@epicgames-ps/lib-pixelstreamingsignalling-ue5.5](../README.md) / [MatchmakerConnection](../modules/MatchmakerConnection.md) / MatchmakerConnection

# Class: MatchmakerConnection

[MatchmakerConnection](../modules/MatchmakerConnection.md).MatchmakerConnection

This class handles connecting and reconnecting to a matchmaker service and
will notify the matchmaker of streamer and player added/removed events that
are emitted from the respective registries.

## Table of contents

### Constructors

- [constructor](MatchmakerConnection.MatchmakerConnection.md#constructor)

### Properties

- [config](MatchmakerConnection.MatchmakerConnection.md#config)

## Constructors

### constructor

• **new MatchmakerConnection**(`config`, `streamerRegistry`, `playerRegistry`): [`MatchmakerConnection`](MatchmakerConnection.MatchmakerConnection.md)

Initializes the matchmaker connection and attempts a connection to the given
address and port immediately. Will automatically try to reconnect on connection
loss.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `config` | [`IMatchmakerConfig`](../interfaces/MatchmakerConnection.IMatchmakerConfig.md) | The matchmaker configuration. |
| `streamerRegistry` | [`StreamerRegistry`](StreamerRegistry.StreamerRegistry.md) | The signalling server streamer registry. This is used to notify the matchmaker of streamers being added/removed. |
| `playerRegistry` | [`PlayerRegistry`](PlayerRegistry.PlayerRegistry.md) | The signalling server player registry. This is used to notify the matchmaker of players being added/removed. |

#### Returns

[`MatchmakerConnection`](MatchmakerConnection.MatchmakerConnection.md)

#### Defined in

[MatchmakerConnection.ts:49](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/8a78930/Signalling/src/MatchmakerConnection.ts#L49)

## Properties

### config

• **config**: [`IMatchmakerConfig`](../interfaces/MatchmakerConnection.IMatchmakerConfig.md)

#### Defined in

[MatchmakerConnection.ts:36](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/8a78930/Signalling/src/MatchmakerConnection.ts#L36)

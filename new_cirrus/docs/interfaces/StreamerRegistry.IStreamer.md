[new-cirrus](../README.md) / [Exports](../modules.md) / [StreamerRegistry](../modules/StreamerRegistry.md) / IStreamer

# Interface: IStreamer

[StreamerRegistry](../modules/StreamerRegistry.md).IStreamer

An interface that describes a streamer that can be added to the
streamer registry.

## Hierarchy

- `EventEmitter`

- [`IMessageLogger`](LoggingUtils.IMessageLogger.md)

  ↳ **`IStreamer`**

## Implemented by

- [`SFUConnection`](../classes/SFUConnection.SFUConnection.md)
- [`StreamerConnection`](../classes/StreamerConnection.StreamerConnection.md)

## Table of contents

### Properties

- [protocol](StreamerRegistry.IStreamer.md#protocol)
- [streamerId](StreamerRegistry.IStreamer.md#streamerid)
- [streaming](StreamerRegistry.IStreamer.md#streaming)
- [transport](StreamerRegistry.IStreamer.md#transport)

### Methods

- [getReadableIdentifier](StreamerRegistry.IStreamer.md#getreadableidentifier)
- [getStreamerInfo](StreamerRegistry.IStreamer.md#getstreamerinfo)
- [sendMessage](StreamerRegistry.IStreamer.md#sendmessage)

## Properties

### protocol

• **protocol**: `SignallingProtocol`

#### Defined in

[StreamerRegistry.ts:14](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/StreamerRegistry.ts#L14)

___

### streamerId

• **streamerId**: `string`

#### Defined in

[StreamerRegistry.ts:12](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/StreamerRegistry.ts#L12)

___

### streaming

• **streaming**: `boolean`

#### Defined in

[StreamerRegistry.ts:15](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/StreamerRegistry.ts#L15)

___

### transport

• **transport**: `ITransport`

#### Defined in

[StreamerRegistry.ts:13](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/StreamerRegistry.ts#L13)

## Methods

### getReadableIdentifier

▸ **getReadableIdentifier**(): `string`

#### Returns

`string`

#### Inherited from

[IMessageLogger](LoggingUtils.IMessageLogger.md).[getReadableIdentifier](LoggingUtils.IMessageLogger.md#getreadableidentifier)

#### Defined in

[LoggingUtils.ts:9](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/LoggingUtils.ts#L9)

___

### getStreamerInfo

▸ **getStreamerInfo**(): [`IStreamerInfo`](StreamerRegistry.IStreamerInfo.md)

#### Returns

[`IStreamerInfo`](StreamerRegistry.IStreamerInfo.md)

#### Defined in

[StreamerRegistry.ts:18](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/StreamerRegistry.ts#L18)

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

[StreamerRegistry.ts:17](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/95d2b15/new_cirrus/src/StreamerRegistry.ts#L17)

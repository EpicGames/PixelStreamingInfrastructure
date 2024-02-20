# Interface: IMessageLogger

[LoggingUtils](../wiki/LoggingUtils).IMessageLogger

Most methods in here rely on connections implementing this interface so we can identify
who is sending or receiving etc.

## Hierarchy

- **`IMessageLogger`**

  ↳ [`IPlayer`](../wiki/PlayerRegistry.IPlayer)

  ↳ [`IStreamer`](../wiki/StreamerRegistry.IStreamer)

## Implemented by

- [`PlayerConnection`](../wiki/PlayerConnection.PlayerConnection)
- [`SFUConnection`](../wiki/SFUConnection.SFUConnection)
- [`StreamerConnection`](../wiki/StreamerConnection.StreamerConnection)

## Table of contents

### Methods

- [getReadableIdentifier](../wiki/LoggingUtils.IMessageLogger#getreadableidentifier)

## Methods

### getReadableIdentifier

▸ **getReadableIdentifier**(): `string`

#### Returns

`string`

#### Defined in

[src/LoggingUtils.ts:9](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/LoggingUtils.ts#L9)

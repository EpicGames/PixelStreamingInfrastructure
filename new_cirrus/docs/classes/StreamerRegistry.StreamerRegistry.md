[wilbur](../README.md) / [StreamerRegistry](../modules/StreamerRegistry.md) / StreamerRegistry

# Class: StreamerRegistry

[StreamerRegistry](../modules/StreamerRegistry.md).StreamerRegistry

Handles all the streamer connections of a signalling server and
can be used to lookup connections by id etc.
Fires events when streamers are added or removed.
Events:
  'added': (playerId: string) Player was added.
  'removed': (playerId: string) Player was removed.

## Hierarchy

- `EventEmitter`

  ↳ **`StreamerRegistry`**

## Table of contents

### Constructors

- [constructor](StreamerRegistry.StreamerRegistry.md#constructor)

### Properties

- [defaultStreamerIdPrefix](StreamerRegistry.StreamerRegistry.md#defaultstreameridprefix)
- [streamers](StreamerRegistry.StreamerRegistry.md#streamers)

### Methods

- [add](StreamerRegistry.StreamerRegistry.md#add)
- [count](StreamerRegistry.StreamerRegistry.md#count)
- [empty](StreamerRegistry.StreamerRegistry.md#empty)
- [find](StreamerRegistry.StreamerRegistry.md#find)
- [getFirstStreamerId](StreamerRegistry.StreamerRegistry.md#getfirststreamerid)
- [remove](StreamerRegistry.StreamerRegistry.md#remove)

## Constructors

### constructor

• **new StreamerRegistry**(): [`StreamerRegistry`](StreamerRegistry.StreamerRegistry.md)

#### Returns

[`StreamerRegistry`](StreamerRegistry.StreamerRegistry.md)

#### Overrides

EventEmitter.constructor

#### Defined in

[StreamerRegistry.ts:44](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/59fc21f/new_cirrus/src/StreamerRegistry.ts#L44)

## Properties

### defaultStreamerIdPrefix

• **defaultStreamerIdPrefix**: `string` = `"UnknownStreamer"`

#### Defined in

[StreamerRegistry.ts:42](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/59fc21f/new_cirrus/src/StreamerRegistry.ts#L42)

___

### streamers

• **streamers**: [`IStreamer`](../interfaces/StreamerRegistry.IStreamer.md)[]

#### Defined in

[StreamerRegistry.ts:41](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/59fc21f/new_cirrus/src/StreamerRegistry.ts#L41)

## Methods

### add

▸ **add**(`streamer`): `boolean`

Adds a streamer to the registry. If the streamer already has an id
it will be sanitized (checked against existing ids and altered if
there are collisions), or if it has no id it will be assigned a
default unique id.

#### Parameters

| Name | Type |
| :------ | :------ |
| `streamer` | [`IStreamer`](../interfaces/StreamerRegistry.IStreamer.md) |

#### Returns

`boolean`

True if the add was successful.

#### Defined in

[StreamerRegistry.ts:56](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/59fc21f/new_cirrus/src/StreamerRegistry.ts#L56)

___

### count

▸ **count**(): `number`

Returns the total number of connected streamers.

#### Returns

`number`

#### Defined in

[StreamerRegistry.ts:121](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/59fc21f/new_cirrus/src/StreamerRegistry.ts#L121)

___

### empty

▸ **empty**(): `boolean`

Returns true when the registry is empty.

#### Returns

`boolean`

#### Defined in

[StreamerRegistry.ts:114](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/59fc21f/new_cirrus/src/StreamerRegistry.ts#L114)

___

### find

▸ **find**(`streamerId`): `undefined` \| [`IStreamer`](../interfaces/StreamerRegistry.IStreamer.md)

Attempts to find the given streamer id in the registry.

#### Parameters

| Name | Type |
| :------ | :------ |
| `streamerId` | `string` |

#### Returns

`undefined` \| [`IStreamer`](../interfaces/StreamerRegistry.IStreamer.md)

#### Defined in

[StreamerRegistry.ts:94](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/59fc21f/new_cirrus/src/StreamerRegistry.ts#L94)

___

### getFirstStreamerId

▸ **getFirstStreamerId**(): ``null`` \| `string`

Used by players who haven't subscribed but try to send a message.
This is to cover legacy connections that do not know how to subscribe.
The player will be assigned the first streamer in the list.

#### Returns

``null`` \| `string`

The first streamerId in the registry or null if there are none.

#### Defined in

[StreamerRegistry.ts:104](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/59fc21f/new_cirrus/src/StreamerRegistry.ts#L104)

___

### remove

▸ **remove**(`streamer`): `boolean`

Removes a streamer from the registry. If the streamer isn't found
it does nothing.

#### Parameters

| Name | Type |
| :------ | :------ |
| `streamer` | [`IStreamer`](../interfaces/StreamerRegistry.IStreamer.md) |

#### Returns

`boolean`

True if the streamer was removed.

#### Defined in

[StreamerRegistry.ts:80](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/59fc21f/new_cirrus/src/StreamerRegistry.ts#L80)

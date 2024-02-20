[wilbur](../README.md) / [Exports](../modules.md) / [PlayerRegistry](../modules/PlayerRegistry.md) / PlayerRegistry

# Class: PlayerRegistry

[PlayerRegistry](../modules/PlayerRegistry.md).PlayerRegistry

Handles all the player connections of a signalling server and
can be used to lookup connections by id etc.
Fires events when players are added or removed.
Events:
  'added': (playerId: string) Player was added.
  'removed': (playerId: string) Player was removed.

## Hierarchy

- `EventEmitter`

  ↳ **`PlayerRegistry`**

## Table of contents

### Constructors

- [constructor](PlayerRegistry.PlayerRegistry.md#constructor)

### Methods

- [add](PlayerRegistry.PlayerRegistry.md#add)
- [count](PlayerRegistry.PlayerRegistry.md#count)
- [get](PlayerRegistry.PlayerRegistry.md#get)
- [has](PlayerRegistry.PlayerRegistry.md#has)
- [listPlayers](PlayerRegistry.PlayerRegistry.md#listplayers)
- [remove](PlayerRegistry.PlayerRegistry.md#remove)

## Constructors

### constructor

• **new PlayerRegistry**(): [`PlayerRegistry`](PlayerRegistry.PlayerRegistry.md)

#### Returns

[`PlayerRegistry`](PlayerRegistry.PlayerRegistry.md)

#### Overrides

EventEmitter.constructor

#### Defined in

[PlayerRegistry.ts:44](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/32068e1/new_cirrus/src/PlayerRegistry.ts#L44)

## Methods

### add

▸ **add**(`player`): `void`

Assigns a unique id to the player and adds it to the registry

#### Parameters

| Name | Type |
| :------ | :------ |
| `player` | [`IPlayer`](../interfaces/PlayerRegistry.IPlayer.md) |

#### Returns

`void`

#### Defined in

[PlayerRegistry.ts:54](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/32068e1/new_cirrus/src/PlayerRegistry.ts#L54)

___

### count

▸ **count**(): `number`

Gets the total number of connected players.

#### Returns

`number`

#### Defined in

[PlayerRegistry.ts:100](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/32068e1/new_cirrus/src/PlayerRegistry.ts#L100)

___

### get

▸ **get**(`playerId`): `undefined` \| [`IPlayer`](../interfaces/PlayerRegistry.IPlayer.md)

Gets a player from the registry using the player id.
Returns undefined if the player doesn't exist.

#### Parameters

| Name | Type |
| :------ | :------ |
| `playerId` | `string` |

#### Returns

`undefined` \| [`IPlayer`](../interfaces/PlayerRegistry.IPlayer.md)

#### Defined in

[PlayerRegistry.ts:89](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/32068e1/new_cirrus/src/PlayerRegistry.ts#L89)

___

### has

▸ **has**(`playerId`): `boolean`

Tests if a player id exists in the registry.

#### Parameters

| Name | Type |
| :------ | :------ |
| `playerId` | `string` |

#### Returns

`boolean`

#### Defined in

[PlayerRegistry.ts:81](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/32068e1/new_cirrus/src/PlayerRegistry.ts#L81)

___

### listPlayers

▸ **listPlayers**(): [`IPlayer`](../interfaces/PlayerRegistry.IPlayer.md)[]

#### Returns

[`IPlayer`](../interfaces/PlayerRegistry.IPlayer.md)[]

#### Defined in

[PlayerRegistry.ts:93](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/32068e1/new_cirrus/src/PlayerRegistry.ts#L93)

___

### remove

▸ **remove**(`player`): `void`

Removes a player from the registry. Does nothing if the id
does not exist.

#### Parameters

| Name | Type |
| :------ | :------ |
| `player` | [`IPlayer`](../interfaces/PlayerRegistry.IPlayer.md) |

#### Returns

`void`

#### Defined in

[PlayerRegistry.ts:66](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/32068e1/new_cirrus/src/PlayerRegistry.ts#L66)

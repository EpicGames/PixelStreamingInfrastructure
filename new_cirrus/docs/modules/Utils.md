[wilbur](../README.md) / [Exports](../modules.md) / Utils

# Module: Utils

## Table of contents

### Type Aliases

- [IProgramOptions](Utils.md#iprogramoptions)

### Functions

- [beautify](Utils.md#beautify)
- [stringify](Utils.md#stringify)

## Type Aliases

### IProgramOptions

Ƭ **IProgramOptions**: `Record`\<`string`, `any`\>

#### Defined in

[Utils.ts:4](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/4b7b7a5/new_cirrus/src/Utils.ts#L4)

## Functions

### beautify

▸ **beautify**(`obj`): `string`

Circular reference save version of JSON.stringify with extra formatting.

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | `any` |

#### Returns

`string`

#### Defined in

[Utils.ts:16](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/4b7b7a5/new_cirrus/src/Utils.ts#L16)

___

### stringify

▸ **stringify**(`obj`): `string`

Cirular reference safe version of JSON.stringify

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | `any` |

#### Returns

`string`

#### Defined in

[Utils.ts:9](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/4b7b7a5/new_cirrus/src/Utils.ts#L9)

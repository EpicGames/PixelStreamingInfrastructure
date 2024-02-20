# Module: Logger

## Table of contents

### Interfaces

- [IConfig](../wiki/Logger.IConfig)

### Variables

- [Logger](../wiki/Logger#logger)

### Functions

- [InitLogging](../wiki/Logger#initlogging)

## Variables

### Logger

• **Logger**: `Logger`

The actual logger object. This is just a winston logger.
You can use InitLogging to get a decent result, or you can
completely create your own winston logger and assign it.

#### Defined in

[src/Logger.ts:13](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/Logger.ts#L13)

## Functions

### InitLogging

▸ **InitLogging**(`config`): `void`

Call this as early as possible to setup the logging module with your
preferred settings.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `config` | [`IConfig`](../wiki/Logger.IConfig) | The settings to init the logger with. See IConfig interface |

#### Returns

`void`

#### Defined in

[src/Logger.ts:34](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/Logger.ts#L34)

[@epicgames-ps/lib-pixelstreamingcommon-ue5.5](../README.md) / [Logger/Logger](../modules/Logger_Logger.md) / Logger

# Class: Logger

[Logger/Logger](../modules/Logger_Logger.md).Logger

A basic console logger utilized by the Pixel Streaming frontend to allow
logging to the browser console.

## Table of contents

### Constructors

- [constructor](Logger_Logger.Logger.md#constructor)

### Properties

- [verboseLogLevel](Logger_Logger.Logger.md#verboseloglevel)

### Methods

- [CommonLog](Logger_Logger.Logger.md#commonlog)
- [Error](Logger_Logger.Logger.md#error)
- [GetStackTrace](Logger_Logger.Logger.md#getstacktrace)
- [Info](Logger_Logger.Logger.md#info)
- [Log](Logger_Logger.Logger.md#log)
- [SetLoggerVerbosity](Logger_Logger.Logger.md#setloggerverbosity)
- [Warning](Logger_Logger.Logger.md#warning)

## Constructors

### constructor

• **new Logger**(): [`Logger`](Logger_Logger.Logger.md)

#### Returns

[`Logger`](Logger_Logger.Logger.md)

## Properties

### verboseLogLevel

▪ `Static` **verboseLogLevel**: `number` = `5`

#### Defined in

[Logger/Logger.ts:8](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/8a78930/Common/src/Logger/Logger.ts#L8)

## Methods

### CommonLog

▸ **CommonLog**(`level`, `stack`, `message`): `void`

The common log function that all other log functions call to.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `level` | `string` | the level of this log message. |
| `stack` | `string` | an optional stack trace string from where the log message was called. |
| `message` | `string` | the message to be logged. |

#### Returns

`void`

#### Defined in

[Logger/Logger.ts:87](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/8a78930/Common/src/Logger/Logger.ts#L87)

___

### Error

▸ **Error**(`stack`, `message`): `void`

The standard logging output

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `stack` | `string` | the stack trace |
| `message` | `string` | the message to be logged |

#### Returns

`void`

#### Defined in

[Logger/Logger.ts:68](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/8a78930/Common/src/Logger/Logger.ts#L68)

___

### GetStackTrace

▸ **GetStackTrace**(): `string`

Captures the stack and returns it

#### Returns

`string`

the current stack

#### Defined in

[Logger/Logger.ts:14](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/8a78930/Common/src/Logger/Logger.ts#L14)

___

### Info

▸ **Info**(`stack`, `message`, `verbosity?`): `void`

The standard logging output

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `stack` | `string` | the stack trace |
| `message` | `string` | the message to be logged |
| `verbosity?` | `number` | the verbosity level |

#### Returns

`void`

#### Defined in

[Logger/Logger.ts:55](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/8a78930/Common/src/Logger/Logger.ts#L55)

___

### Log

▸ **Log**(`stack`, `message`, `verbosity?`): `void`

The standard logging output

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `stack` | `string` | the stack trace |
| `message` | `string` | the message to be logged |
| `verbosity?` | `number` | the verbosity level |

#### Returns

`void`

#### Defined in

[Logger/Logger.ts:41](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/8a78930/Common/src/Logger/Logger.ts#L41)

___

### SetLoggerVerbosity

▸ **SetLoggerVerbosity**(`verboseLogLevel`): `void`

Set the log verbosity level

#### Parameters

| Name | Type |
| :------ | :------ |
| `verboseLogLevel` | `number` |

#### Returns

`void`

#### Defined in

[Logger/Logger.ts:29](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/8a78930/Common/src/Logger/Logger.ts#L29)

___

### Warning

▸ **Warning**(`stack`, `message`): `void`

The standard logging output

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `stack` | `string` | the stack trace |
| `message` | `string` | the message to be logged |

#### Returns

`void`

#### Defined in

[Logger/Logger.ts:77](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/8a78930/Common/src/Logger/Logger.ts#L77)

[@epicgames-ps/lib-pixelstreamingsignalling-ue5.5](../README.md) / [WebServer](../modules/WebServer.md) / WebServer

# Class: WebServer

[WebServer](../modules/WebServer.md).WebServer

An object to manage the initialization of a web server. Used to serve the
pixel streaming frontend.

## Table of contents

### Constructors

- [constructor](WebServer.WebServer.md#constructor)

### Properties

- [httpServer](WebServer.WebServer.md#httpserver)
- [httpsServer](WebServer.WebServer.md#httpsserver)

## Constructors

### constructor

• **new WebServer**(`app`, `config`): [`WebServer`](WebServer.WebServer.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `app` | `any` |
| `config` | [`IWebServerConfig`](../interfaces/WebServer.IWebServerConfig.md) |

#### Returns

[`WebServer`](WebServer.WebServer.md)

#### Defined in

[WebServer.ts:52](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/8a78930/Signalling/src/WebServer.ts#L52)

## Properties

### httpServer

• **httpServer**: `Server`\<typeof `IncomingMessage`, typeof `ServerResponse`\>

#### Defined in

[WebServer.ts:49](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/8a78930/Signalling/src/WebServer.ts#L49)

___

### httpsServer

• **httpsServer**: `Server`\<typeof `IncomingMessage`, typeof `ServerResponse`\>

#### Defined in

[WebServer.ts:50](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/8a78930/Signalling/src/WebServer.ts#L50)

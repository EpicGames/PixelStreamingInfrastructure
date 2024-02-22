[@epicgames-ps/lib-pixelstreamingsignalling-ue5.5](../README.md) / [SignallingServer](../modules/SignallingServer.md) / IServerConfig

# Interface: IServerConfig

[SignallingServer](../modules/SignallingServer.md).IServerConfig

An interface describing the possible options to pass when creating
a new SignallingServer object.

## Table of contents

### Properties

- [httpServer](SignallingServer.IServerConfig.md#httpserver)
- [httpsServer](SignallingServer.IServerConfig.md#httpsserver)
- [matchmakerAddress](SignallingServer.IServerConfig.md#matchmakeraddress)
- [matchmakerKeepAliveInterval](SignallingServer.IServerConfig.md#matchmakerkeepaliveinterval)
- [matchmakerPort](SignallingServer.IServerConfig.md#matchmakerport)
- [matchmakerRetryInterval](SignallingServer.IServerConfig.md#matchmakerretryinterval)
- [peerOptions](SignallingServer.IServerConfig.md#peeroptions)
- [playerPort](SignallingServer.IServerConfig.md#playerport)
- [playerWsOptions](SignallingServer.IServerConfig.md#playerwsoptions)
- [publicIp](SignallingServer.IServerConfig.md#publicip)
- [publicPort](SignallingServer.IServerConfig.md#publicport)
- [sfuPort](SignallingServer.IServerConfig.md#sfuport)
- [sfuWsOptions](SignallingServer.IServerConfig.md#sfuwsoptions)
- [streamerPort](SignallingServer.IServerConfig.md#streamerport)
- [streamerWsOptions](SignallingServer.IServerConfig.md#streamerwsoptions)
- [useMatchmaker](SignallingServer.IServerConfig.md#usematchmaker)

## Properties

### httpServer

• `Optional` **httpServer**: `Server`\<typeof `IncomingMessage`, typeof `ServerResponse`\>

#### Defined in

[SignallingServer.ts:21](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Signalling/src/SignallingServer.ts#L21)

___

### httpsServer

• `Optional` **httpsServer**: `Server`\<typeof `IncomingMessage`, typeof `ServerResponse`\>

#### Defined in

[SignallingServer.ts:24](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Signalling/src/SignallingServer.ts#L24)

___

### matchmakerAddress

• `Optional` **matchmakerAddress**: `string`

#### Defined in

[SignallingServer.ts:51](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Signalling/src/SignallingServer.ts#L51)

___

### matchmakerKeepAliveInterval

• `Optional` **matchmakerKeepAliveInterval**: `number`

#### Defined in

[SignallingServer.ts:60](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Signalling/src/SignallingServer.ts#L60)

___

### matchmakerPort

• `Optional` **matchmakerPort**: `number`

#### Defined in

[SignallingServer.ts:54](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Signalling/src/SignallingServer.ts#L54)

___

### matchmakerRetryInterval

• `Optional` **matchmakerRetryInterval**: `number`

#### Defined in

[SignallingServer.ts:57](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Signalling/src/SignallingServer.ts#L57)

___

### peerOptions

• **peerOptions**: `any`

#### Defined in

[SignallingServer.ts:36](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Signalling/src/SignallingServer.ts#L36)

___

### playerPort

• `Optional` **playerPort**: `number`

#### Defined in

[SignallingServer.ts:30](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Signalling/src/SignallingServer.ts#L30)

___

### playerWsOptions

• `Optional` **playerWsOptions**: `any`

#### Defined in

[SignallingServer.ts:42](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Signalling/src/SignallingServer.ts#L42)

___

### publicIp

• `Optional` **publicIp**: `string`

#### Defined in

[SignallingServer.ts:63](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Signalling/src/SignallingServer.ts#L63)

___

### publicPort

• `Optional` **publicPort**: `number`

#### Defined in

[SignallingServer.ts:66](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Signalling/src/SignallingServer.ts#L66)

___

### sfuPort

• `Optional` **sfuPort**: `number`

#### Defined in

[SignallingServer.ts:33](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Signalling/src/SignallingServer.ts#L33)

___

### sfuWsOptions

• `Optional` **sfuWsOptions**: `any`

#### Defined in

[SignallingServer.ts:45](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Signalling/src/SignallingServer.ts#L45)

___

### streamerPort

• **streamerPort**: `number`

#### Defined in

[SignallingServer.ts:27](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Signalling/src/SignallingServer.ts#L27)

___

### streamerWsOptions

• `Optional` **streamerWsOptions**: `any`

#### Defined in

[SignallingServer.ts:39](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Signalling/src/SignallingServer.ts#L39)

___

### useMatchmaker

• `Optional` **useMatchmaker**: `boolean`

#### Defined in

[SignallingServer.ts:48](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Signalling/src/SignallingServer.ts#L48)

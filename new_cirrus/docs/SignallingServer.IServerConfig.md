# Interface: IServerConfig

[SignallingServer](../wiki/SignallingServer).IServerConfig

An interface describing the possible options to pass when creating
a new SignallingServer object.

## Table of contents

### Properties

- [httpServer](../wiki/SignallingServer.IServerConfig#httpserver)
- [peerOptions](../wiki/SignallingServer.IServerConfig#peeroptions)
- [playerPort](../wiki/SignallingServer.IServerConfig#playerport)
- [playerWsOptions](../wiki/SignallingServer.IServerConfig#playerwsoptions)
- [sfuPort](../wiki/SignallingServer.IServerConfig#sfuport)
- [sfuWsOptions](../wiki/SignallingServer.IServerConfig#sfuwsoptions)
- [streamerPort](../wiki/SignallingServer.IServerConfig#streamerport)
- [streamerWsOptions](../wiki/SignallingServer.IServerConfig#streamerwsoptions)

## Properties

### httpServer

• `Optional` **httpServer**: `Server`\<typeof `IncomingMessage`, typeof `ServerResponse`\>

#### Defined in

[src/SignallingServer.ts:19](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/SignallingServer.ts#L19)

___

### peerOptions

• **peerOptions**: `any`

#### Defined in

[src/SignallingServer.ts:31](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/SignallingServer.ts#L31)

___

### playerPort

• `Optional` **playerPort**: `number`

#### Defined in

[src/SignallingServer.ts:25](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/SignallingServer.ts#L25)

___

### playerWsOptions

• `Optional` **playerWsOptions**: `any`

#### Defined in

[src/SignallingServer.ts:37](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/SignallingServer.ts#L37)

___

### sfuPort

• `Optional` **sfuPort**: `number`

#### Defined in

[src/SignallingServer.ts:28](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/SignallingServer.ts#L28)

___

### sfuWsOptions

• `Optional` **sfuWsOptions**: `any`

#### Defined in

[src/SignallingServer.ts:40](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/SignallingServer.ts#L40)

___

### streamerPort

• **streamerPort**: `number`

#### Defined in

[src/SignallingServer.ts:22](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/SignallingServer.ts#L22)

___

### streamerWsOptions

• `Optional` **streamerWsOptions**: `any`

#### Defined in

[src/SignallingServer.ts:34](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/6b3496e/new_cirrus/src/SignallingServer.ts#L34)

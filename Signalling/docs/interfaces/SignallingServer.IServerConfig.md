[@epicgames-ps/lib-signalling](../README.md) / [SignallingServer](../modules/SignallingServer.md) / IServerConfig

# Interface: IServerConfig

[SignallingServer](../modules/SignallingServer.md).IServerConfig

An interface describing the possible options to pass when creating
a new SignallingServer object.

## Table of contents

### Properties

- [httpServer](SignallingServer.IServerConfig.md#httpserver)
- [peerOptions](SignallingServer.IServerConfig.md#peeroptions)
- [playerPort](SignallingServer.IServerConfig.md#playerport)
- [playerWsOptions](SignallingServer.IServerConfig.md#playerwsoptions)
- [sfuPort](SignallingServer.IServerConfig.md#sfuport)
- [sfuWsOptions](SignallingServer.IServerConfig.md#sfuwsoptions)
- [streamerPort](SignallingServer.IServerConfig.md#streamerport)
- [streamerWsOptions](SignallingServer.IServerConfig.md#streamerwsoptions)

## Properties

### httpServer

• `Optional` **httpServer**: `Server`\<typeof `IncomingMessage`, typeof `ServerResponse`\>

#### Defined in

SignallingServer.ts:19

___

### peerOptions

• **peerOptions**: `any`

#### Defined in

SignallingServer.ts:31

___

### playerPort

• `Optional` **playerPort**: `number`

#### Defined in

SignallingServer.ts:25

___

### playerWsOptions

• `Optional` **playerWsOptions**: `any`

#### Defined in

SignallingServer.ts:37

___

### sfuPort

• `Optional` **sfuPort**: `number`

#### Defined in

SignallingServer.ts:28

___

### sfuWsOptions

• `Optional` **sfuWsOptions**: `any`

#### Defined in

SignallingServer.ts:40

___

### streamerPort

• **streamerPort**: `number`

#### Defined in

SignallingServer.ts:22

___

### streamerWsOptions

• `Optional` **streamerWsOptions**: `any`

#### Defined in

SignallingServer.ts:34

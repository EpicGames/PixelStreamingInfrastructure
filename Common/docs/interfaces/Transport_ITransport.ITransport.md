[@epicgames-ps/lib-pixelstreamingcommon-ue5.5](../README.md) / [Transport/ITransport](../modules/Transport_ITransport.md) / ITransport

# Interface: ITransport

[Transport/ITransport](../modules/Transport_ITransport.md).ITransport

An interface to a transport protocol that is in charge of sending and receiving signalling messages.
Implement this interface to support your custom transport. You can then supply an instance of your
transport to the constructor of SignallingProtocol during startup.

## Hierarchy

- `EventEmitter`

  ↳ **`ITransport`**

## Implemented by

- [`WebSocketTransport`](../classes/Transport_WebSocketTransport.WebSocketTransport.md)
- [`WebSocketTransportNJS`](../classes/Transport_WebSocketTransportNJS.WebSocketTransportNJS.md)

## Table of contents

### Properties

- [onMessage](Transport_ITransport.ITransport.md#onmessage)

### Methods

- [connect](Transport_ITransport.ITransport.md#connect)
- [disconnect](Transport_ITransport.ITransport.md#disconnect)
- [isConnected](Transport_ITransport.ITransport.md#isconnected)
- [sendMessage](Transport_ITransport.ITransport.md#sendmessage)

## Properties

### onMessage

• **onMessage**: (`msg`: [`BaseMessage`](Messages_base_message.BaseMessage.md)) => `void`

Callback filled in by the SignallingProtocol and should be called by the transport when a new message arrives.

#### Type declaration

▸ (`msg`): `void`

Callback filled in by the SignallingProtocol and should be called by the transport when a new message arrives.

##### Parameters

| Name | Type |
| :------ | :------ |
| `msg` | [`BaseMessage`](Messages_base_message.BaseMessage.md) |

##### Returns

`void`

#### Defined in

[Transport/ITransport.ts:19](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/713ba47/Common/src/Transport/ITransport.ts#L19)

## Methods

### connect

▸ **connect**(`url`): `boolean`

Connect to a given URL.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `url` | `string` | The URL for the transport to connect to. |

#### Returns

`boolean`

True if the connection was successful.

#### Defined in

[Transport/ITransport.ts:26](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/713ba47/Common/src/Transport/ITransport.ts#L26)

___

### disconnect

▸ **disconnect**(`code?`, `reason?`): `void`

Disconnect this transport.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `code?` | `number` | An optional disconnect code. |
| `reason?` | `string` | A descriptive string for the disconnect reason. |

#### Returns

`void`

#### Defined in

[Transport/ITransport.ts:33](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/713ba47/Common/src/Transport/ITransport.ts#L33)

___

### isConnected

▸ **isConnected**(): `boolean`

Should return true when the transport is connected and ready to send/receive messages.

#### Returns

`boolean`

True if the transport is connected.

#### Defined in

[Transport/ITransport.ts:39](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/713ba47/Common/src/Transport/ITransport.ts#L39)

___

### sendMessage

▸ **sendMessage**(`msg`): `void`

Called when the protocol wants to send a message over the transport.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `msg` | [`BaseMessage`](Messages_base_message.BaseMessage.md) | The message to send over the transport. |

#### Returns

`void`

#### Defined in

[Transport/ITransport.ts:14](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/713ba47/Common/src/Transport/ITransport.ts#L14)

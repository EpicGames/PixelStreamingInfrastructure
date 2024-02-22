[@epicgames-ps/lib-pixelstreamingcommon-ue5.5](../README.md) / [Transport/WebSocketTransport](../modules/Transport_WebSocketTransport.md) / WebSocketTransport

# Class: WebSocketTransport

[Transport/WebSocketTransport](../modules/Transport_WebSocketTransport.md).WebSocketTransport

The controller for the WebSocket and all associated methods

## Hierarchy

- `EventEmitter`

  ↳ **`WebSocketTransport`**

## Implements

- [`ITransport`](../interfaces/Transport_ITransport.ITransport.md)

## Table of contents

### Constructors

- [constructor](Transport_WebSocketTransport.WebSocketTransport.md#constructor)

### Properties

- [WS\_OPEN\_STATE](Transport_WebSocketTransport.WebSocketTransport.md#ws_open_state)
- [onMessage](Transport_WebSocketTransport.WebSocketTransport.md#onmessage)
- [webSocket](Transport_WebSocketTransport.WebSocketTransport.md#websocket)

### Methods

- [close](Transport_WebSocketTransport.WebSocketTransport.md#close)
- [connect](Transport_WebSocketTransport.WebSocketTransport.md#connect)
- [disconnect](Transport_WebSocketTransport.WebSocketTransport.md#disconnect)
- [handleOnClose](Transport_WebSocketTransport.WebSocketTransport.md#handleonclose)
- [handleOnError](Transport_WebSocketTransport.WebSocketTransport.md#handleonerror)
- [handleOnMessage](Transport_WebSocketTransport.WebSocketTransport.md#handleonmessage)
- [handleOnMessageBinary](Transport_WebSocketTransport.WebSocketTransport.md#handleonmessagebinary)
- [handleOnOpen](Transport_WebSocketTransport.WebSocketTransport.md#handleonopen)
- [isConnected](Transport_WebSocketTransport.WebSocketTransport.md#isconnected)
- [sendMessage](Transport_WebSocketTransport.WebSocketTransport.md#sendmessage)

## Constructors

### constructor

• **new WebSocketTransport**(): [`WebSocketTransport`](Transport_WebSocketTransport.WebSocketTransport.md)

#### Returns

[`WebSocketTransport`](Transport_WebSocketTransport.WebSocketTransport.md)

#### Overrides

EventEmitter.constructor

#### Defined in

[Transport/WebSocketTransport.ts:22](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Transport/WebSocketTransport.ts#L22)

## Properties

### WS\_OPEN\_STATE

• **WS\_OPEN\_STATE**: `number` = `1`

#### Defined in

[Transport/WebSocketTransport.ts:19](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Transport/WebSocketTransport.ts#L19)

___

### onMessage

• **onMessage**: (`msg`: [`BaseMessage`](../interfaces/Messages_base_message.BaseMessage.md)) => `void`

Callback filled in by the SignallingProtocol and should be called by the transport when a new message arrives.

#### Type declaration

▸ (`msg`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `msg` | [`BaseMessage`](../interfaces/Messages_base_message.BaseMessage.md) |

##### Returns

`void`

#### Implementation of

[ITransport](../interfaces/Transport_ITransport.ITransport.md).[onMessage](../interfaces/Transport_ITransport.ITransport.md#onmessage)

#### Defined in

[Transport/WebSocketTransport.ts:35](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Transport/WebSocketTransport.ts#L35)

___

### webSocket

• **webSocket**: `WebSocket`

#### Defined in

[Transport/WebSocketTransport.ts:20](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Transport/WebSocketTransport.ts#L20)

## Methods

### close

▸ **close**(): `void`

Closes the Websocket connection

#### Returns

`void`

#### Defined in

[Transport/WebSocketTransport.ts:175](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Transport/WebSocketTransport.ts#L175)

___

### connect

▸ **connect**(`connectionURL`): `boolean`

Connect to the signaling server

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `connectionURL` | `string` | The Address of the signaling server |

#### Returns

`boolean`

If there is a connection

#### Implementation of

[ITransport](../interfaces/Transport_ITransport.ITransport.md).[connect](../interfaces/Transport_ITransport.ITransport.md#connect)

#### Defined in

[Transport/WebSocketTransport.ts:42](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Transport/WebSocketTransport.ts#L42)

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

#### Implementation of

[ITransport](../interfaces/Transport_ITransport.ITransport.md).[disconnect](../interfaces/Transport_ITransport.ITransport.md#disconnect)

#### Defined in

[Transport/WebSocketTransport.ts:63](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Transport/WebSocketTransport.ts#L63)

___

### handleOnClose

▸ **handleOnClose**(`event`): `void`

Handles when the Websocket is closed

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `event` | `CloseEvent` | Close Event |

#### Returns

`void`

#### Defined in

[Transport/WebSocketTransport.ts:161](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Transport/WebSocketTransport.ts#L161)

___

### handleOnError

▸ **handleOnError**(): `void`

Handles when there is an error on the websocket

#### Returns

`void`

#### Defined in

[Transport/WebSocketTransport.ts:152](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Transport/WebSocketTransport.ts#L152)

___

### handleOnMessage

▸ **handleOnMessage**(`event`): `void`

Handles what happens when a message is received

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `event` | `MessageEvent`\<`any`\> | Message Received |

#### Returns

`void`

#### Defined in

[Transport/WebSocketTransport.ts:112](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Transport/WebSocketTransport.ts#L112)

___

### handleOnMessageBinary

▸ **handleOnMessageBinary**(`event`): `void`

Handles what happens when a message is received in binary form

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `event` | `MessageEvent`\<`any`\> | Message Received |

#### Returns

`void`

#### Defined in

[Transport/WebSocketTransport.ts:79](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Transport/WebSocketTransport.ts#L79)

___

### handleOnOpen

▸ **handleOnOpen**(): `void`

Handles when the Websocket is opened

#### Returns

`void`

#### Defined in

[Transport/WebSocketTransport.ts:140](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Transport/WebSocketTransport.ts#L140)

___

### isConnected

▸ **isConnected**(): `boolean`

Should return true when the transport is connected and ready to send/receive messages.

#### Returns

`boolean`

True if the transport is connected.

#### Implementation of

[ITransport](../interfaces/Transport_ITransport.ITransport.md).[isConnected](../interfaces/Transport_ITransport.ITransport.md#isconnected)

#### Defined in

[Transport/WebSocketTransport.ts:71](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Transport/WebSocketTransport.ts#L71)

___

### sendMessage

▸ **sendMessage**(`msg`): `void`

Sends a message over the websocket.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `msg` | [`BaseMessage`](../interfaces/Messages_base_message.BaseMessage.md) | The message to send. |

#### Returns

`void`

#### Implementation of

[ITransport](../interfaces/Transport_ITransport.ITransport.md).[sendMessage](../interfaces/Transport_ITransport.ITransport.md#sendmessage)

#### Defined in

[Transport/WebSocketTransport.ts:30](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Transport/WebSocketTransport.ts#L30)

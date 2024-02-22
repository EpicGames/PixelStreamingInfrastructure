[@epicgames-ps/lib-pixelstreamingcommon-ue5.5](../README.md) / [Transport/WebSocketTransportNJS](../modules/Transport_WebSocketTransportNJS.md) / WebSocketTransportNJS

# Class: WebSocketTransportNJS

[Transport/WebSocketTransportNJS](../modules/Transport_WebSocketTransportNJS.md).WebSocketTransportNJS

An implementation of WebSocketTransport from pixelstreamingcommon that supports node.js websockets
This is needed because of the slight differences between the 'ws' node.js package and the websockets
supported in the browsers.
Do not use this code in a browser use 'WebSocketTransport' instead.

## Hierarchy

- `EventEmitter`

  ↳ **`WebSocketTransportNJS`**

## Implements

- [`ITransport`](../interfaces/Transport_ITransport.ITransport.md)

## Table of contents

### Constructors

- [constructor](Transport_WebSocketTransportNJS.WebSocketTransportNJS.md#constructor)

### Properties

- [WS\_OPEN\_STATE](Transport_WebSocketTransportNJS.WebSocketTransportNJS.md#ws_open_state)
- [onMessage](Transport_WebSocketTransportNJS.WebSocketTransportNJS.md#onmessage)
- [webSocket](Transport_WebSocketTransportNJS.WebSocketTransportNJS.md#websocket)
- [webSocketServer](Transport_WebSocketTransportNJS.WebSocketTransportNJS.md#websocketserver)

### Methods

- [close](Transport_WebSocketTransportNJS.WebSocketTransportNJS.md#close)
- [connect](Transport_WebSocketTransportNJS.WebSocketTransportNJS.md#connect)
- [disconnect](Transport_WebSocketTransportNJS.WebSocketTransportNJS.md#disconnect)
- [handleOnClose](Transport_WebSocketTransportNJS.WebSocketTransportNJS.md#handleonclose)
- [handleOnError](Transport_WebSocketTransportNJS.WebSocketTransportNJS.md#handleonerror)
- [handleOnMessage](Transport_WebSocketTransportNJS.WebSocketTransportNJS.md#handleonmessage)
- [handleOnOpen](Transport_WebSocketTransportNJS.WebSocketTransportNJS.md#handleonopen)
- [isConnected](Transport_WebSocketTransportNJS.WebSocketTransportNJS.md#isconnected)
- [sendMessage](Transport_WebSocketTransportNJS.WebSocketTransportNJS.md#sendmessage)

## Constructors

### constructor

• **new WebSocketTransportNJS**(`existingSocket?`): [`WebSocketTransportNJS`](Transport_WebSocketTransportNJS.WebSocketTransportNJS.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `existingSocket?` | `WebSocket` |

#### Returns

[`WebSocketTransportNJS`](Transport_WebSocketTransportNJS.WebSocketTransportNJS.md)

#### Overrides

EventEmitter.constructor

#### Defined in

[Transport/WebSocketTransportNJS.ts:19](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/9763671/Common/src/Transport/WebSocketTransportNJS.ts#L19)

## Properties

### WS\_OPEN\_STATE

• **WS\_OPEN\_STATE**: `number` = `1`

#### Defined in

[Transport/WebSocketTransportNJS.ts:15](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/9763671/Common/src/Transport/WebSocketTransportNJS.ts#L15)

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

[Transport/WebSocketTransportNJS.ts:37](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/9763671/Common/src/Transport/WebSocketTransportNJS.ts#L37)

___

### webSocket

• **webSocket**: `WebSocket`

#### Defined in

[Transport/WebSocketTransportNJS.ts:16](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/9763671/Common/src/Transport/WebSocketTransportNJS.ts#L16)

___

### webSocketServer

• **webSocketServer**: `Server`\<typeof `WebSocket`, typeof `IncomingMessage`\>

#### Defined in

[Transport/WebSocketTransportNJS.ts:17](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/9763671/Common/src/Transport/WebSocketTransportNJS.ts#L17)

## Methods

### close

▸ **close**(): `void`

Closes the Websocket connection

#### Returns

`void`

#### Defined in

[Transport/WebSocketTransportNJS.ts:109](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/9763671/Common/src/Transport/WebSocketTransportNJS.ts#L109)

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

[Transport/WebSocketTransportNJS.ts:44](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/9763671/Common/src/Transport/WebSocketTransportNJS.ts#L44)

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

[Transport/WebSocketTransportNJS.ts:55](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/9763671/Common/src/Transport/WebSocketTransportNJS.ts#L55)

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

[Transport/WebSocketTransportNJS.ts:102](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/9763671/Common/src/Transport/WebSocketTransportNJS.ts#L102)

___

### handleOnError

▸ **handleOnError**(`event`): `void`

Handles when there is an error on the websocket

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `event` | `ErrorEvent` | Error Payload |

#### Returns

`void`

#### Defined in

[Transport/WebSocketTransportNJS.ts:94](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/9763671/Common/src/Transport/WebSocketTransportNJS.ts#L94)

___

### handleOnMessage

▸ **handleOnMessage**(`event`): `void`

Handles what happens when a message is received

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `event` | `MessageEvent` | Message Received |

#### Returns

`void`

#### Defined in

[Transport/WebSocketTransportNJS.ts:71](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/9763671/Common/src/Transport/WebSocketTransportNJS.ts#L71)

___

### handleOnOpen

▸ **handleOnOpen**(`event`): `void`

Handles when the Websocket is opened

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `event` | `Event` | Not Used |

#### Returns

`void`

#### Defined in

[Transport/WebSocketTransportNJS.ts:86](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/9763671/Common/src/Transport/WebSocketTransportNJS.ts#L86)

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

[Transport/WebSocketTransportNJS.ts:63](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/9763671/Common/src/Transport/WebSocketTransportNJS.ts#L63)

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

[Transport/WebSocketTransportNJS.ts:32](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/9763671/Common/src/Transport/WebSocketTransportNJS.ts#L32)

[@epicgames-ps/lib-pixelstreamingcommon-ue5.5](../README.md) / [Protocol/SignallingProtocol](../modules/Protocol_SignallingProtocol.md) / SignallingProtocol

# Class: SignallingProtocol

[Protocol/SignallingProtocol](../modules/Protocol_SignallingProtocol.md).SignallingProtocol

Signalling protocol for handling messages from the signalling server.

Listen on this emitter for messages. Message type is the name of the event to listen for.
Example:  
     ```
     signallingProtocol.on('config', (message: Messages.config) => console.log(`Got a config message: ${message}`)));
     ```

The transport in this class will also emit on message events.

Events emitted on transport:  
  message:  
     Emitted any time a message is received by the transport. Listen on this if
     you wish to capture all messages, rather than specific messages on
     'messageHandlers'.

  out:  
     Emitted when sending a message out on the transport. Similar to 'message' but
     only for when messages are sent from this endpoint. Useful for debugging.

## Hierarchy

- `EventEmitter`

  ↳ **`SignallingProtocol`**

## Table of contents

### Constructors

- [constructor](Protocol_SignallingProtocol.SignallingProtocol.md#constructor)

### Properties

- [transport](Protocol_SignallingProtocol.SignallingProtocol.md#transport)

### Accessors

- [SIGNALLING\_VERSION](Protocol_SignallingProtocol.SignallingProtocol.md#signalling_version)

### Methods

- [connect](Protocol_SignallingProtocol.SignallingProtocol.md#connect)
- [disconnect](Protocol_SignallingProtocol.SignallingProtocol.md#disconnect)
- [isConnected](Protocol_SignallingProtocol.SignallingProtocol.md#isconnected)
- [requestStreamerList](Protocol_SignallingProtocol.SignallingProtocol.md#requeststreamerlist)
- [sendIceCandidate](Protocol_SignallingProtocol.SignallingProtocol.md#sendicecandidate)
- [sendMessage](Protocol_SignallingProtocol.SignallingProtocol.md#sendmessage)
- [sendSFURecvDataChannelReady](Protocol_SignallingProtocol.SignallingProtocol.md#sendsfurecvdatachannelready)
- [sendSubscribe](Protocol_SignallingProtocol.SignallingProtocol.md#sendsubscribe)
- [sendUnsubscribe](Protocol_SignallingProtocol.SignallingProtocol.md#sendunsubscribe)
- [sendWebRtcAnswer](Protocol_SignallingProtocol.SignallingProtocol.md#sendwebrtcanswer)
- [sendWebRtcDatachannelRequest](Protocol_SignallingProtocol.SignallingProtocol.md#sendwebrtcdatachannelrequest)
- [sendWebRtcOffer](Protocol_SignallingProtocol.SignallingProtocol.md#sendwebrtcoffer)

## Constructors

### constructor

• **new SignallingProtocol**(`transport`): [`SignallingProtocol`](Protocol_SignallingProtocol.SignallingProtocol.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `transport` | [`ITransport`](../interfaces/Transport_ITransport.ITransport.md) |

#### Returns

[`SignallingProtocol`](Protocol_SignallingProtocol.SignallingProtocol.md)

#### Overrides

EventEmitter.constructor

#### Defined in

[Protocol/SignallingProtocol.ts:36](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Protocol/SignallingProtocol.ts#L36)

## Properties

### transport

• **transport**: [`ITransport`](../interfaces/Transport_ITransport.ITransport.md)

#### Defined in

[Protocol/SignallingProtocol.ts:34](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Protocol/SignallingProtocol.ts#L34)

## Accessors

### SIGNALLING\_VERSION

• `get` **SIGNALLING_VERSION**(): `string`

#### Returns

`string`

#### Defined in

[Protocol/SignallingProtocol.ts:31](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Protocol/SignallingProtocol.ts#L31)

## Methods

### connect

▸ **connect**(`url`): `boolean`

Asks the transport to connect to the given URL.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `url` | `string` | The url to connect to. |

#### Returns

`boolean`

True if the connection call succeeded.

#### Defined in

[Protocol/SignallingProtocol.ts:58](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Protocol/SignallingProtocol.ts#L58)

___

### disconnect

▸ **disconnect**(`code?`, `reason?`): `void`

Asks the transport to disconnect from any connection it might have.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `code?` | `number` | An optional disconnection code. |
| `reason?` | `string` | An optional descriptive string for the disconnect reason. |

#### Returns

`void`

#### Defined in

[Protocol/SignallingProtocol.ts:67](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Protocol/SignallingProtocol.ts#L67)

___

### isConnected

▸ **isConnected**(): `boolean`

Returns true if the transport is connected and ready to send/receive messages.

#### Returns

`boolean`

True if the protocol is connected.

#### Defined in

[Protocol/SignallingProtocol.ts:75](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Protocol/SignallingProtocol.ts#L75)

___

### requestStreamerList

▸ **requestStreamerList**(): `void`

#### Returns

`void`

#### Defined in

[Protocol/SignallingProtocol.ts:90](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Protocol/SignallingProtocol.ts#L90)

___

### sendIceCandidate

▸ **sendIceCandidate**(`candidate`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `candidate` | `RTCIceCandidate` |

#### Returns

`void`

#### Defined in

[Protocol/SignallingProtocol.ts:125](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Protocol/SignallingProtocol.ts#L125)

___

### sendMessage

▸ **sendMessage**(`msg`): `void`

Passes a message to the transport to send to the other end.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `msg` | [`BaseMessage`](../interfaces/Messages_base_message.BaseMessage.md) | The message to send. |

#### Returns

`void`

#### Defined in

[Protocol/SignallingProtocol.ts:83](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Protocol/SignallingProtocol.ts#L83)

___

### sendSFURecvDataChannelReady

▸ **sendSFURecvDataChannelReady**(): `void`

#### Returns

`void`

#### Defined in

[Protocol/SignallingProtocol.ts:120](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Protocol/SignallingProtocol.ts#L120)

___

### sendSubscribe

▸ **sendSubscribe**(`streamerid`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `streamerid` | `string` |

#### Returns

`void`

#### Defined in

[Protocol/SignallingProtocol.ts:95](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Protocol/SignallingProtocol.ts#L95)

___

### sendUnsubscribe

▸ **sendUnsubscribe**(): `void`

#### Returns

`void`

#### Defined in

[Protocol/SignallingProtocol.ts:100](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Protocol/SignallingProtocol.ts#L100)

___

### sendWebRtcAnswer

▸ **sendWebRtcAnswer**(`extraParams`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `extraParams` | `object` |

#### Returns

`void`

#### Defined in

[Protocol/SignallingProtocol.ts:110](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Protocol/SignallingProtocol.ts#L110)

___

### sendWebRtcDatachannelRequest

▸ **sendWebRtcDatachannelRequest**(): `void`

#### Returns

`void`

#### Defined in

[Protocol/SignallingProtocol.ts:115](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Protocol/SignallingProtocol.ts#L115)

___

### sendWebRtcOffer

▸ **sendWebRtcOffer**(`extraParams`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `extraParams` | `object` |

#### Returns

`void`

#### Defined in

[Protocol/SignallingProtocol.ts:105](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/branch/Common/src/Protocol/SignallingProtocol.ts#L105)

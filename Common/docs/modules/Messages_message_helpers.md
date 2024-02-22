[@epicgames-ps/lib-pixelstreamingcommon-ue5.5](../README.md) / Messages/message\_helpers

# Module: Messages/message\_helpers

## Table of contents

### Functions

- [createMessage](Messages_message_helpers.md#createmessage)
- [validateMessage](Messages_message_helpers.md#validatemessage)

## Functions

### createMessage

▸ **createMessage**(`messageType`, `params?`): [`BaseMessage`](../interfaces/Messages_base_message.BaseMessage.md)

A helper for creating signalling messages. Takes in optional given parameters and
includes them in a message object with the 'type' field set properly for the message
type supplied.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `messageType` | `IMessageType`\<[`BaseMessage`](../interfaces/Messages_base_message.BaseMessage.md)\> | A message type from MessageRegistry that indicates the type of message to create. |
| `params?` | `object` | An optional object whose fields are added to the newly created message. |

#### Returns

[`BaseMessage`](../interfaces/Messages_base_message.BaseMessage.md)

The resulting message object.

#### Defined in

[Messages/message_helpers.ts:14](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/1d8a258/Common/src/Messages/message_helpers.ts#L14)

___

### validateMessage

▸ **validateMessage**(`msg`): `IMessageType`\<[`BaseMessage`](../interfaces/Messages_base_message.BaseMessage.md)\> \| ``null``

Tests that the supplied message is valid. That is contains all expected fields and
doesn't contain any unknown fields.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `msg` | [`BaseMessage`](../interfaces/Messages_base_message.BaseMessage.md) | The message object to test. |

#### Returns

`IMessageType`\<[`BaseMessage`](../interfaces/Messages_base_message.BaseMessage.md)\> \| ``null``

The message type from MessageRegistry of the supplied message object if it's valid, or null if invalid.

#### Defined in

[Messages/message_helpers.ts:29](https://github.com/mcottontensor/PixelStreamingInfrastructure/blob/1d8a258/Common/src/Messages/message_helpers.ts#L29)

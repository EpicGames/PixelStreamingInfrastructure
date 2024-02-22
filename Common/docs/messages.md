# Protocol Documentation
<a name="top"></a>

## Table of Contents

- [signalling_messages.proto](#signalling_messages-proto)
    - [answer](#-answer)
    - [base_message](#-base_message)
    - [config](#-config)
    - [dataChannelRequest](#-dataChannelRequest)
    - [disconnectPlayer](#-disconnectPlayer)
    - [endpointId](#-endpointId)
    - [endpointIdConfirm](#-endpointIdConfirm)
    - [iceCandidate](#-iceCandidate)
    - [iceCandidateData](#-iceCandidateData)
    - [identify](#-identify)
    - [layerPreference](#-layerPreference)
    - [listStreamers](#-listStreamers)
    - [offer](#-offer)
    - [peerConnectionOptions](#-peerConnectionOptions)
    - [peerDataChannels](#-peerDataChannels)
    - [peerDataChannelsReady](#-peerDataChannelsReady)
    - [ping](#-ping)
    - [playerConnected](#-playerConnected)
    - [playerCount](#-playerCount)
    - [playerDisconnected](#-playerDisconnected)
    - [pong](#-pong)
    - [startStreaming](#-startStreaming)
    - [stats](#-stats)
    - [stopStreaming](#-stopStreaming)
    - [streamerDataChannels](#-streamerDataChannels)
    - [streamerDisconnected](#-streamerDisconnected)
    - [streamerIdChanged](#-streamerIdChanged)
    - [streamerList](#-streamerList)
    - [subscribe](#-subscribe)
    - [unsubscribe](#-unsubscribe)
  
- [Scalar Value Types](#scalar-value-types)



<a name="signalling_messages-proto"></a>
<p align="right"><a href="#top">Top</a></p>

## signalling_messages.proto



<a name="-answer"></a>

### answer



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |
| sdp | [string](#string) |  |  |
| playerId | [string](#string) | optional |  |






<a name="-base_message"></a>

### base_message
intermediate message to determine message type


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |






<a name="-config"></a>

### config



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |
| peerConnectionOptions | [peerConnectionOptions](#peerConnectionOptions) |  |  |
| protocolVersion | [string](#string) | optional |  |






<a name="-dataChannelRequest"></a>

### dataChannelRequest



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |






<a name="-disconnectPlayer"></a>

### disconnectPlayer



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |
| playerId | [string](#string) |  |  |
| reason | [string](#string) | optional |  |






<a name="-endpointId"></a>

### endpointId



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |
| id | [string](#string) |  |  |
| protocolVersion | [string](#string) | optional |  |






<a name="-endpointIdConfirm"></a>

### endpointIdConfirm



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |
| committedId | [string](#string) |  |  |






<a name="-iceCandidate"></a>

### iceCandidate



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |
| candidate | [iceCandidateData](#iceCandidateData) |  |  |
| playerId | [string](#string) | optional |  |






<a name="-iceCandidateData"></a>

### iceCandidateData



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| candidate | [string](#string) |  |  |
| sdpMid | [string](#string) |  |  |
| sdpMLineIndex | [int32](#int32) |  |  |
| usernameFragment | [string](#string) | optional |  |






<a name="-identify"></a>

### identify



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |






<a name="-layerPreference"></a>

### layerPreference



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |
| spatialLayer | [int32](#int32) |  |  |
| temporalLayer | [int32](#int32) |  |  |
| playerId | [string](#string) |  |  |






<a name="-listStreamers"></a>

### listStreamers



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |






<a name="-offer"></a>

### offer



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |
| sdp | [string](#string) |  |  |
| playerId | [string](#string) | optional |  |
| sfu | [bool](#bool) | optional |  |






<a name="-peerConnectionOptions"></a>

### peerConnectionOptions







<a name="-peerDataChannels"></a>

### peerDataChannels



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |
| playerId | [string](#string) |  |  |
| sendStreamId | [int32](#int32) |  |  |
| recvStreamId | [int32](#int32) |  |  |






<a name="-peerDataChannelsReady"></a>

### peerDataChannelsReady



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |






<a name="-ping"></a>

### ping



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |
| time | [int32](#int32) |  |  |






<a name="-playerConnected"></a>

### playerConnected



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |
| dataChannel | [bool](#bool) |  |  |
| sfu | [bool](#bool) |  |  |
| sendOffer | [bool](#bool) |  |  |
| playerId | [string](#string) | optional |  |






<a name="-playerCount"></a>

### playerCount



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |
| count | [int32](#int32) |  |  |






<a name="-playerDisconnected"></a>

### playerDisconnected



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |
| playerId | [string](#string) |  |  |






<a name="-pong"></a>

### pong



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |
| time | [int32](#int32) |  |  |






<a name="-startStreaming"></a>

### startStreaming



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |






<a name="-stats"></a>

### stats



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |
| data | [string](#string) |  |  |






<a name="-stopStreaming"></a>

### stopStreaming



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |






<a name="-streamerDataChannels"></a>

### streamerDataChannels



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |
| sfuId | [string](#string) |  |  |
| sendStreamId | [int32](#int32) |  |  |
| recvStreamId | [int32](#int32) |  |  |






<a name="-streamerDisconnected"></a>

### streamerDisconnected
sent to the sfu only to notify it when the streamer its subscribed to disconnects


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |






<a name="-streamerIdChanged"></a>

### streamerIdChanged



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |
| newID | [string](#string) |  |  |






<a name="-streamerList"></a>

### streamerList



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |
| ids | [string](#string) | repeated |  |






<a name="-subscribe"></a>

### subscribe



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |
| streamerId | [string](#string) |  |  |






<a name="-unsubscribe"></a>

### unsubscribe



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  |  |





 

 

 

 



## Scalar Value Types

| .proto Type | Notes | C++ | Java | Python | Go | C# | PHP | Ruby |
| ----------- | ----- | --- | ---- | ------ | -- | -- | --- | ---- |
| <a name="double" /> double |  | double | double | float | float64 | double | float | Float |
| <a name="float" /> float |  | float | float | float | float32 | float | float | Float |
| <a name="int32" /> int32 | Uses variable-length encoding. Inefficient for encoding negative numbers – if your field is likely to have negative values, use sint32 instead. | int32 | int | int | int32 | int | integer | Bignum or Fixnum (as required) |
| <a name="int64" /> int64 | Uses variable-length encoding. Inefficient for encoding negative numbers – if your field is likely to have negative values, use sint64 instead. | int64 | long | int/long | int64 | long | integer/string | Bignum |
| <a name="uint32" /> uint32 | Uses variable-length encoding. | uint32 | int | int/long | uint32 | uint | integer | Bignum or Fixnum (as required) |
| <a name="uint64" /> uint64 | Uses variable-length encoding. | uint64 | long | int/long | uint64 | ulong | integer/string | Bignum or Fixnum (as required) |
| <a name="sint32" /> sint32 | Uses variable-length encoding. Signed int value. These more efficiently encode negative numbers than regular int32s. | int32 | int | int | int32 | int | integer | Bignum or Fixnum (as required) |
| <a name="sint64" /> sint64 | Uses variable-length encoding. Signed int value. These more efficiently encode negative numbers than regular int64s. | int64 | long | int/long | int64 | long | integer/string | Bignum |
| <a name="fixed32" /> fixed32 | Always four bytes. More efficient than uint32 if values are often greater than 2^28. | uint32 | int | int | uint32 | uint | integer | Bignum or Fixnum (as required) |
| <a name="fixed64" /> fixed64 | Always eight bytes. More efficient than uint64 if values are often greater than 2^56. | uint64 | long | int/long | uint64 | ulong | integer/string | Bignum |
| <a name="sfixed32" /> sfixed32 | Always four bytes. | int32 | int | int | int32 | int | integer | Bignum or Fixnum (as required) |
| <a name="sfixed64" /> sfixed64 | Always eight bytes. | int64 | long | int/long | int64 | long | integer/string | Bignum |
| <a name="bool" /> bool |  | bool | boolean | boolean | bool | bool | boolean | TrueClass/FalseClass |
| <a name="string" /> string | A string must always contain UTF-8 encoded or 7-bit ASCII text. | string | String | str/unicode | string | string | string | String (UTF-8) |
| <a name="bytes" /> bytes | May contain any arbitrary sequence of bytes. | string | ByteString | str | []byte | ByteString | string | String (ASCII-8BIT) |


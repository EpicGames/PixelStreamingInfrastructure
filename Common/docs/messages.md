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
This is a response to an `offer` message. It contains the answer `SDP`.
Part of the normal subscribe flow. A peer will subscribe to a streamer
and depending on whether `offer_to_receive` is set, one peer will make
an offer and the other should answer.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;answer&#39; |
| sdp | [string](#string) |  | The WebRTC SDP payload |
| playerId | [string](#string) | optional | If being sent to a player this should be set to a valid player ID. |






<a name="-base_message"></a>

### base_message
This is just a helper message type that allows us to use a &#34;base interface&#34;
in code to describe that all messages should at least have a &#39;type field&#39;.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | The type of the message. |






<a name="-config"></a>

### config
A config message is sent to each connecting peer when it connects to
describe to them the setup of the signalling server they&#39;re
connecting to.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;config&#39; |
| peerConnectionOptions | [peerConnectionOptions](#peerConnectionOptions) |  | The user defined peer connnection options |
| protocolVersion | [string](#string) | optional | The signalling protocol version the signalling server is using |






<a name="-dataChannelRequest"></a>

### dataChannelRequest
Message is forwarded to a connected SFU. Tells the SFU that the player
requests data channels to the streamer.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;dataChannelRequest&#39; |






<a name="-disconnectPlayer"></a>

### disconnectPlayer
Message is consumed by the Signalling Server. Requests that the
signalling server disconnect the given player matching the player ID.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;disconnectPlayer&#39; |
| playerId | [string](#string) |  | The ID of the player to disconnect. |
| reason | [string](#string) | optional | An optional reason string to send to the player. |






<a name="-endpointId"></a>

### endpointId
Message is consumed by the Signalling Server. Specifies an id for the
streamer. This is used to uniquely identify multiple streamers connected
to the same Signalling Server.
Note: to preserve backward compatibility when Streamer IDs were optional,
when a Streamer first connects it is assigned a temporary ID which
allows use of older Streamers if needed.
Note: Streamer IDs must be unique and so if the ID provided here clashes
with an existing ID, the ID may be altered slightly (usually just an
appended number). The streamer will be sent an `endpointIdConfirm`
message to notify it of it&#39;s final ID.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;endpointId&#39; |
| id | [string](#string) |  | The requested ID of the streamer. |
| protocolVersion | [string](#string) | optional | The signalling protocol version the streamer is using |






<a name="-endpointIdConfirm"></a>

### endpointIdConfirm
A response to `endpointId` that will notify the streamer of its final
ID given. Since streamer IDs must be unique the requested ID may not be
available and may need to be altered.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;endpointIdConfirm&#39; |
| committedId | [string](#string) |  | The final ID of the streamer. |






<a name="-iceCandidate"></a>

### iceCandidate
A single ICE candidate entry from WebRTC. Notifies a peer of a possible
connection option to another peer.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;iceCandidate&#39; |
| candidate | [iceCandidateData](#iceCandidateData) |  | The ICE candidate data from WebRTC |
| playerId | [string](#string) | optional | If being sent to a player this should be a valid player ID. |






<a name="-iceCandidateData"></a>

### iceCandidateData
A submessage that contains data from a WebRTC ICE candidate.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| candidate | [string](#string) |  |  |
| sdpMid | [string](#string) |  |  |
| sdpMLineIndex | [int32](#int32) |  |  |
| usernameFragment | [string](#string) | optional |  |






<a name="-identify"></a>

### identify
A request for a new streamer to give itself an ID. The flow for these
messages should be connect-&gt;identify-&gt;endpointId-&gt;endpointIdConfirm


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;identify&#39; |






<a name="-layerPreference"></a>

### layerPreference
Message is forwarded to a connected SFU. Sends a preferred layer index to a
connected SFU for a specified player. Useful for switching between SFU
quality layers to force a certain resolution/quality option either as part
of UX or testing.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;layerPreference&#39; |
| spatialLayer | [int32](#int32) |  | The requested spatial layer |
| temporalLayer | [int32](#int32) |  | The requested temporal layer |
| playerId | [string](#string) |  | The player ID this preference refers to |






<a name="-listStreamers"></a>

### listStreamers
A request to the signalling server to send the player a list of
available streamers it could possibly subscribe to.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;listStreamers&#39; |






<a name="-offer"></a>

### offer
An offer message can be an offer of a WebRTC stream, or an offer to
receive a WebRTC stream, depending on the configuration of the player.
The default behaviour is that when a player subscribes to a streamer
the streamer will offer the stream to the new player.
An alternative configuration exists where a player can be configured
to offer to receive and in that case the player will subscribe to a
streamer and then offer to receive the stream.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;offer&#39; |
| sdp | [string](#string) |  | The SDP payload from WebRTC |
| playerId | [string](#string) | optional | If being sent to a player this should be a valid player ID |
| sfu | [bool](#bool) | optional | Indiates that this offer is coming from an SFU. |






<a name="-peerConnectionOptions"></a>

### peerConnectionOptions
This is a user defined structure that is sent as part of the `config`
message. Left empty here because everything is optional.






<a name="-peerDataChannels"></a>

### peerDataChannels
Message is forwarded to a player. Sends information to the player about what
data channels to use for sending/receiving with the streamer.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;peerDataChannels&#39; |
| playerId | [string](#string) |  | The player ID this message refers to. |
| sendStreamId | [int32](#int32) |  | The channel ID to use for sending data. |
| recvStreamId | [int32](#int32) |  | The channel ID to use for receiving data. |






<a name="-peerDataChannelsReady"></a>

### peerDataChannelsReady
Message is forwarded to a connected SFU. Tells the SFU that the player is
ready for data channels to be negotiated.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;peerDataChannelsReady&#39; |






<a name="-ping"></a>

### ping
A keepalive ping message used to test that the connection is still open.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;ping&#39; |
| time | [int32](#int32) |  | The current time |






<a name="-playerConnected"></a>

### playerConnected
A message sent to a streamer to notify it that a player has just
subscribed to it.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;playerConnected&#39; |
| dataChannel | [bool](#bool) |  | True if the player should be given a datachannel for stream control purposes. |
| sfu | [bool](#bool) |  | True if the player connected is an SFU |
| sendOffer | [bool](#bool) |  | True if the streamer should send an offer. False if the player is offering to receive |
| playerId | [string](#string) |  | The ID of the player that connected. |






<a name="-playerCount"></a>

### playerCount
DEPRECATED Message is sent to players to indicate how many currently connected players
there are on this signalling server. (Note: This is mostly old behaviour and
is not influenced by multi streamers or who is subscribed to what streamer.
It just reports the number of players it knows about.)


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;playerCount&#39; |
| count | [int32](#int32) |  | The number of players connected. |






<a name="-playerDisconnected"></a>

### playerDisconnected
Message is used to notify a streamer that a player has
unsubscribed/disconnected from the stream.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;playerDisconnected&#39; |
| playerId | [string](#string) |  | The ID of the player that disconnected. |






<a name="-pong"></a>

### pong
Message is a reply to `ping` from a streamer. Replies with the time from the
ping message.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;pong&#39; |
| time | [int32](#int32) |  | The echoed time from the ping message |






<a name="-startStreaming"></a>

### startStreaming
Sent by the SFU to indicate that it is now streaming.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;startStreaming&#39; |






<a name="-stats"></a>

### stats
DEPRECATED Message is consumed by the signalling server. Will print out the provided
stats data on the console.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;stats&#39; |
| data | [string](#string) |  | The stats data to echo. |






<a name="-stopStreaming"></a>

### stopStreaming
Sent by the SFU to indicate that it is now no longer streaming.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;stopStreaming&#39; |






<a name="-streamerDataChannels"></a>

### streamerDataChannels
Message is forwarded to the streamer. Sends a request to the streamer to
open up data channels for a given player.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;streamerDataChannels&#39; |
| sfuId | [string](#string) |  | The SFU the player is connected to |
| sendStreamId | [int32](#int32) |  | The channel ID to use for sending data. |
| recvStreamId | [int32](#int32) |  | The channel ID to use for receiving data. |






<a name="-streamerDisconnected"></a>

### streamerDisconnected
Message is used to notify players when a Streamer disconnects from the
signalling server.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;streamerDisconnected&#39; |






<a name="-streamerIdChanged"></a>

### streamerIdChanged
Message is used to communicate to players that the streamer it is currently
subscribed to is changing its ID. This allows players to keep track of it&#39;s
currently subscribed streamer and allow auto reconnects to the correct
streamer. This happens if a streamer sends an `endpointID` message after it
already has an ID assigned. (Can happen if it is late to respond to the
`identify` message and is auto assigned a legacy ID.)


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;streamerIdChanged&#39; |
| newID | [string](#string) |  | The new ID of the streamer. |






<a name="-streamerList"></a>

### streamerList
Message is a reply to `listStreamers` from a player. Replies with a list of
currently active streamers connected to this server.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;streamerList&#39; |
| ids | [string](#string) | repeated | A list of streamer IDs active on the server. |






<a name="-subscribe"></a>

### subscribe
Message is consumed by the signalling server. Tells the signalling server
that the player requests to subscribe to the given stream.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;subscribe&#39; |
| streamerId | [string](#string) |  | The ID of the streamer the player wishes to subscribe to. |






<a name="-unsubscribe"></a>

### unsubscribe
Message is consumed by the signalling server. Tells the signalling server
that the player wishes to unsubscribe from the current stream. The player
must have previously used the `subscribe` message for this to have any effect.


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [string](#string) |  | Should always be &#39;unsubscribe&#39; |





 

 

 

 



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


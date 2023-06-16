## Player Sent Messages
### listStreamers

| Param Name | Description |
|-|-|

Message is consumed by the Signaling Server. Requests the list of streamer ids currently connected to the Signaling Server. The server will reply with a [streamerList](#streamerList)

### subscribe

| Param Name | Description |
|---|---|
| streamerId | The id of the stream to subscribe to. |

Message is consumed by the signaling server. Tells the signaling server that the player requests to subscribe to the given stream.

### unsubscribe

| Param Name | Description |
|-|-|

Message is consumed by the signaling server. Tells the signaling server that the player wishes to unsubscribe from the current stream. The player must have previously used the `subscribe` message for this to have any effect.

### offer

| Param Name | Description |
|-|-|
| Sdp | The WebRTC SDP package in string format |

Message is forwarded to the currently subscribed to Streamer. Supplies an SDP offer to the Streamer to answer. The player must have previously used the `subscribe` message to successfully subscribe to a connected Streamer.

### answer

| Param Name | Description |
|-|-|
| Sdp | The WebRTC SDP package in string format |

Message is forwarded to the currently subscribed to Streamer. Sends the SDP answer back to the Streamer The player must have previously used the `subscribe` message to successfully subscribe to a connected Streamer and received an `offer` from the Streamer.

### iceCandidate

| Param Name | Description |
|-|-|
| candidate | The JSON string describing the ICE candidate |

Message is forwarded to the currently subscribed to Streamer. Sends an ICE candidate to the Streamer. This is part of the WebRTC negotiation and should come after the `answer`

### dataChannelRequest

| Param Name | Description |
|-|-|

Message is forwarded to a connected SFU. Tells the SFU that the player requests data channels to the Streamer.

### peerDataChannelsReady

| Param Name | Description |
|-|-|

Message is forwarded to a connected SFU. Tells the SFU that the Player is ready for data channels to be negotiated.

### stats

| Param Name | Description |
|-|-|
| data | The stats data to log. |

Message is consumed by the signaling server. Will print out the provided stats data on the console.

## Streamer Sent Messages
### endpointId

| Param Name | Description |
|-|-|
| id | The id of the Streamer |

Message is consumed by the Signaling Server. Specifies an id for the streamer.

### offer

| Param Name | Description |
|-|-|
| playerId | The id of the player to send the offer to. |
| Sdp | The WebRTC SDP package in string format |

Message is forwarded to a player. Sends the SDP offer to the specified player. Begins the WebRTC negotiation with a player.

### answer

| Param Name | Description |
|-|-|
| playerId | The id of the player to send the answer to. |
| Sdp | The WebRTC SDP package in string format |

Message is forwarded to a player. Sends the SDP answer back to the player. This should be in response to an `offer` from the specified player.

### iceCandidate

| Param Name | Description |
|-|-|
| playerId | The id of the player to send the ICE candidate to. |
| candidate | The JSON string describing the ICE candidate |

Message is forwarded to a player. Sends an ICE candidate to the specified player.

### ping

| Param Name | Description |
|-|-|
| time | The timestamp of the ping message. Will be returned in the pong message |

Message is consumed by the Signaling Server. A keepalive ping message that initiates a [pong](#pong) response.

### disconnectPlayer

| Param Name | Description |
|-|-|
| playerId | The id of the player to disconnect |
| reason | The reason for the disconnect |

Message is consumed by the Signaling Server. Requests that the signaling server disconnect a player.

### layerPreference

| Param Name | Description |
|-|-|
| playerId | The id of the player to give the preference to |
| spatialLayer | The index of the spatial layer to prefer |
| temporalLayer | The index of the temporal layer to prefer |

Message is forwarded to a connected SFU. Sends a preferred layer index to a connected SFU for a specified player.

## SFU Sent Messages
### offer

| Param Name | Description |
|-|-|
| playerId | The id of the player to send the offer to. |
| Sdp | The WebRTC SDP package in string format |

Message is forwarded to a Player. Sends the SDP offer to the specified Player. This begins the WebRTC negotiation between the SFU and the Player.

### answer

| Param Name | Description |
|-|-|
| Sdp | The WebRTC SDP package in string format |

Message is forwarded to the Streamer. Sends the SDP answer back to the Streamer. This should be in response to a previous `offer` from the Streamer.

### streamerDataChannels

| Param Name | Description |
|-|-|
| playerId | The id of the player the request is for. |
| sendStreamId | The datachannel id for sending data. |
| recvStreamId | The datachannel id for receiving data. |

Message is forwarded to the streamer. Sends a request to the streamer to open up data channels for a given player.

### peerDataChannels

| Param Name | Description |
|-|-|
| playerId | The player id of the player to send the message to. |
| sendStreamId | The datachannel id for sending data. |
| recvStreamId | The datachannel id for receiving data. |

Message is forwarded to a Player. Sends information to the player about what data channels to use for sending/receiving with the Streamer.

## Signaling Server Sent Messages
### streamerList

| Param Name | Description |
|-|-|
| ids | A list of string ids that are currently active on the signaling server. |

Message is a reply to [listStreamers](#listStreamers) from a Player. Replies with a list of currently active streamers connected to this server.

### pong

| Param Name | Description |
|-|-|
| time | The timestamp of the ping message. Will be returned in the pong message |

Message is a reply to [ping](#ping) from a Streamer. Replies with the time from the ping message.

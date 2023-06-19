## Player Sent Messages

### listStreamers<a name="player-liststreamers"></a>

> Message is consumed by the Signalling Server. Requests the list of streamer ids currently connected to the Signalling Server. The server will reply with a [streamerList](#signalling-streamerlist)

| Param Name | Type | Description |
|-|-|-|

### subscribe<a name="player-subscribe"></a>

> Message is consumed by the signalling server. Tells the signalling server that the player requests to subscribe to the given stream.

| Param Name | Type | Description |
|-|-|-|
| streamerId | string | The id of the stream to subscribe to. |

### unsubscribe<a name="player-unsubscribe"></a>

> Message is consumed by the signalling server. Tells the signalling server that the player wishes to unsubscribe from the current stream. The player must have previously used the `subscribe` message for this to have any effect.

| Param Name | Type | Description |
|-|-|-|

### offer<a name="player-offer"></a>

>Message is forwarded to the currently subscribed to Streamer. Supplies an SDP offer to the Streamer to answer. The player must have previously used the `subscribe` message to successfully subscribe to a connected Streamer.

| Param Name | Type | Description |
|-|-|-|
| Sdp | string | The WebRTC SDP package in string format |

### answer<a name="player-answer"></a>

>Message is forwarded to the currently subscribed to Streamer. Sends the SDP answer back to the Streamer The player must have previously used the `subscribe` message to successfully subscribe to a connected Streamer and received an `offer` from the Streamer.

| Param Name | Type | Description |
|-|-|-|
| Sdp | string | The WebRTC SDP package in string format |

### iceCandidate<a name="player-icecandidate"></a>

>Message is forwarded to the currently subscribed to Streamer. Sends an ICE candidate to the Streamer. This is part of the WebRTC negotiation and should come after the `answer`

| Param Name | Type | Description |
|-|-|-|
| candidate | string | The JSON string describing the ICE candidate |

### dataChannelRequest<a name="player-datachannelrequest"></a>

>Message is forwarded to a connected SFU. Tells the SFU that the player requests data channels to the Streamer.

| Param Name | Type | Description |
|-|-|-|

### peerDataChannelsReady<a name="player-peerdatachannelsready"></a>

>Message is forwarded to a connected SFU. Tells the SFU that the Player is ready for data channels to be negotiated.

| Param Name | Type | Description |
|-|-|-|

### stats<a name="player-stats"></a>

>Message is consumed by the signalling server. Will print out the provided stats data on the console.

| Param Name | Type | Description |
|-|-|-|
| data | string | The stats data to log. |

## Streamer Sent Messages

### endpointId<a name="streamer-endpointid"></a>

>Message is consumed by the Signalling Server. Specifies an id for the streamer.

| Param Name | Type | Description |
|-|-|-|
| id | string | The id of the Streamer |

### offer<a name="streamer-offer"></a>

>Message is forwarded to a player. Sends the SDP offer to the specified player. Begins the WebRTC negotiation with a player.

| Param Name | Type | Description |
|-|-|-|
| playerId | string | The id of the player to send the offer to. |
| Sdp | string | The WebRTC SDP package in string format |

### answer<a name="streamer-answer"></a>

>Message is forwarded to a player. Sends the SDP answer back to the player. This should be in response to an `offer` from the specified player.

| Param Name | Type | Description |
|-|-|-|
| playerId | string | The id of the player to send the answer to. |
| Sdp | string | The WebRTC SDP package in string format |

### iceCandidate<a name="streamer-icecandidate"></a>

>Message is forwarded to a player. Sends an ICE candidate to the specified player.

| Param Name | Type | Description |
|-|-|-|
| playerId | string | The id of the player to send the ICE candidate to. |
| candidate | string | The JSON string describing the ICE candidate |

### ping<a name="streamer-ping"></a>

>Message is consumed by the Signalling Server. A keepalive ping message that initiates a [pong](#signalling-pong) response.

| Param Name | Type | Description |
|-|-|-|
| time | number | The timestamp of the ping message. Will be returned in the pong message |

### disconnectPlayer<a name="streamer-disconnectplayer"></a>

>Message is consumed by the Signalling Server. Requests that the signalling server disconnect a player.

| Param Name | Type | Description |
|-|-|-|
| playerId | string | The id of the player to disconnect |
| reason | string | The reason for the disconnect |

### layerPreference<a name="streamer-layerpreference"></a>

>Message is forwarded to a connected SFU. Sends a preferred layer index to a connected SFU for a specified player.

| Param Name | Type | Description |
|-|-|-|
| playerId | string | The id of the player to give the preference to |
| spatialLayer | number | The index of the spatial layer to prefer |
| temporalLayer | number | The index of the temporal layer to prefer |

## SFU Sent Messages

### offer<a name="sfu-offer"></a>

>Message is forwarded to a Player. Sends the SDP offer to the specified Player. This begins the WebRTC negotiation between the SFU and the Player.

| Param Name | Type | Description |
|-|-|-|
| playerId | string | The id of the player to send the offer to. |
| Sdp | string | The WebRTC SDP package in string format |

### answer<a name="sfu-answer"></a>

>Message is forwarded to the Streamer. Sends the SDP answer back to the Streamer. This should be in response to a previous `offer` from the Streamer.

| Param Name | Type | Description |
|-|-|-|
| Sdp | string | The WebRTC SDP package in string format |

### streamerDataChannels<a name="sfu-streamerdatachannels"></a>

>Message is forwarded to the streamer. Sends a request to the streamer to open up data channels for a given player.

| Param Name | Type | Description |
|-|-|-|
| playerId | string | The id of the player the request is for. |
| sendStreamId | number | The datachannel id for sending data. |
| recvStreamId | number | The datachannel id for receiving data. |

### peerDataChannels<a name="sfu-peerdatachannels"></a>

>Message is forwarded to a Player. Sends information to the player about what data channels to use for sending/receiving with the Streamer.

| Param Name | Type | Description |
|-|-|-|
| playerId | string | The player id of the player to send the message to. |
| sendStreamId | number | The datachannel id for sending data. |
| recvStreamId | number | The datachannel id for receiving data. |

## Signalling Server Sent Messages

### streamerList<a name="signalling-streamerlist"></a>

>Message is a reply to [listStreamers](#player-liststreamers) from a Player. Replies with a list of currently active streamers connected to this server.

| Param Name | Type | Description |
|-|-|-|
| ids | Array\<string\> | A list of string ids that are currently active on the signalling server. |

### pong<a name="signalling-pong"></a>

>Message is a reply to [ping](#streamer-ping) from a Streamer. Replies with the time from the ping message.

| Param Name | Description |
|-|-|
| time | The timestamp of the ping message. Will be returned in the pong message |


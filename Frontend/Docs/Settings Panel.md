# Frontend Setting Panel

The Pixel Streaming frontend contains a settings panel that allows you to configure your Pixel Streaming user experience as needed - whether that be toggling features or connecting to different signalling servers.

This page will be updated with new features and commands as they become available.


## Settings
![Settings Panel](Resources/Images/settings-panel.png)

### Pixel Streaming

| **Setting** | **Description** |
| --- | --- |
| **Signalling URL** | The URL of the signalling server. |
| **Streamer ID** | Allows you to select which streamer to stream. |
| **Auto connect to stream** | Browser will automatically connect to the stream when loaded. Prevents having to click to start |
| **Auto play video** | When the stream is ready, starts playing video immediately instead of showing a play button. |
| **Browser send offer** | The browser will start the WebRTC handshake instead of the Unreal Engine application. This is an advanced setting for users customising the frontend. Primarily for backwards compatibility for 4.x versions of the engine. |
| **Use microphone** | Will start receiving audio input from your microphone and transmit it to the Unreal Engine. |
| **Start video muted** | Muted audio when the stream starts. |
| **Prefer SFU** | Will attempt to use the Selective Forwarding Unit (SFU), if you have one running. |
| **Is quality controller?** | Makes the encoder of the Pixel Streaming Plugin use the current browser connection to determine the bandwidth available, and therefore the quality of the stream encoding. **See notes below** |
| **Force mono audio** | Force the browser to request mono audio in the SDP. |
| **Force TURN** | Will attempt to connect exclusively via the TURN server. Will not work without an active TURN server. |
| **Suppress browser keys** | Suppress or allow certain keys we use in UE, for example F5 to show shader complexity instead of refreshing the page. |
| **AFK if Idle** | Timeout the connection if no input is detected for a period of time. |
| **AFK timeout** | Allows you to specify the AFK timeout period. |


### UI
| **Setting** | **Description** |
| --- | --- |
| **Match viewport resolution** | Resizes the Unreal Engine application resolution to match the browser's video element size.|
| **Control scheme** | If the scheme is `locked mouse` the browser will use `pointerlock` to capture your mouse, whereas if the scheme is `hovering mouse` you will retain your OS/browser cursor. |
| **Color scheme** | Allows you to switch between light mode and dark mode. |

### Input
| **Setting** | **Description** |
| --- | --- |
| **Keyboard input** | If enabled, captures and sends keyboard events to the Unreal Engine application. |
| **Mouse input** | If enabled, captures and sends mouse events to the Unreal Engine application. |
| **Touch input** | If enabled, captures and sends touch events to the Unreal Engine application. |
| **Gamepad input** | If enabled, captures and sends gamepad events to the Unreal Engine application. |
| **XR controller input** | If enabled, captures and sends XR controller events to the Unreal Engine application. |

### Encoder
| **Setting** | **Description** |
| --- | --- |
| **Min QP** | The lower bound of quantization parameter (QP) of the encoder. 0 = best quality, 51 = worst quality. |
| **Max QP** | The upper bound of quantization parameter (QP) of the encoder. 0 = best quality, 51 = worst quality. |
| **Preferred codec** | The preferred codec to be used during codec negotiation. |

### WebRTC
| **Setting** | **Description** |
| --- | --- |
| **Max FPS** | The maximum FPS WebRTC will attempt to transmit frames at. |
| **Min Bitrate (kbps)** | The minimum bitrate WebRTC should use. |
| **Max Bitrate (kbps)** | The maximum bitrate WebRTC should use. |


### Commands
| **Setting** | **Description** |
| --- | --- |
| **Show FPS** | Will display the current FPS |
| **Request Keyframe** | Will ask the stream for a keyframe. This is helpful if your stream is choppy and needs to catch up.  |
| **Restart Stream** | Restarts the stream by disconnecting and reconnecting the websocket connection. |


### Notes

**Quality Controller**
Although Pixel Streaming adapts the quality of the stream to match the available bandwidth, when using H.264, the video frames are only encoded once by the Pixel Streaming Plugin. That one encoding is used for all clients. Therefore, only one client connection can "own" the quality used for adaptive streaming. If the other clients have a much better connection to the server, they may end up seeing a lower quality stream than necessary. On the other hand, if other clients have a much worse connection to the server, they may end up with lag or jitter. **Note**, this quality controller setting is completely irrelevant if you are streaming using any codec other than H.264 (such as VP8 or VP9).


## Legal

Copyright &copy; 2022, Epic Games. Licensed under the MIT License, see the file [LICENSE](../../LICENSE.md) for details.



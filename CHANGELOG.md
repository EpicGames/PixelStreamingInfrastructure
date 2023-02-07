# Pixel Streaming Infrastructure Changelog

The changelog is a summary of commits between releases of Unreal Engine.

As a reminder each UE-X branch/tag in this repository corresponds to a version of Unreal Engine.

## UE 5.2
Coming soon...

## [UE 5.1 (Current)](https://github.com/EpicGames/PixelStreamingInfrastructure/commits/UE5.1)

### Bug fixes
- [3b1b84](https://github.com/EpicGames/PixelStreamingInfrastructure/commit/3b1b8417227fc0cbd8e14326da046876fdf926a3) Fix black screen flickering when receiving freeze frames.
- [853625](https://github.com/EpicGames/PixelStreamingInfrastructure/commit/8536255b1ffd72af02f93d8ec2c094a4cedee695) Fix CSS to show AFK overlay.
- [c897e1](https://github.com/EpicGames/PixelStreamingInfrastructure/commit/c897e1be7f3bdcf37222230ddd742620133b8816) Fix `pointerlock` errors on platforms like iOS where it doesn't exist.

### Features
- [980208](https://github.com/EpicGames/PixelStreamingInfrastructure/commit/98020828fafc2ef9dc9261bab8be28de9142c0b8) Add handling for mouse double click.
- [6b8f31](https://github.com/EpicGames/PixelStreamingInfrastructure/commit/6b8f31b85fb838503444868b579d73fd1c6fcb8e) Expose freeze frame delay as a configurable option.
- [fe5c4c](https://github.com/EpicGames/PixelStreamingInfrastructure/commit/fe5c4cd1bd65baaa9412e843547ef5ddd10c98c9) Added Dockerfile for the 5.1 Signalling Server container.

## [UE 5.0](https://github.com/EpicGames/PixelStreamingInfrastructure/commits/UE5.0)

### Bug fixes
- [3d641a](https://github.com/EpicGames/PixelStreamingInfrastructure/commit/3d641a4f5236792ed7f3014e092f2aa4b6269d5a) Fixed `MatchViewportWidth` not working if toggled repeatedly.
- [ca6644](https://github.com/EpicGames/PixelStreamingInfrastructure/commit/ca6644f85c63e308be54a5207a12cf745d558307) Fix controller button messages not being sent.
- [bb4063](https://github.com/EpicGames/PixelStreamingInfrastructure/commit/bb40639227a0b1462109c66465b67ffa10bc9177) Fix missing `let` in loops.
- [b59bfb](https://github.com/EpicGames/PixelStreamingInfrastructure/commit/b59bfba69e68e761d8d355bf412d071b6e98f0ab) Fix `removeResponseEventListener` using remove instead of delete.
- [4fee8a](https://github.com/EpicGames/PixelStreamingInfrastructure/commit/4fee8a4f1e03349f67d91797b7b5de33d31f91dd) Fix missing initialization for unquantizeAndDenormalizeUnsigned.
- [42fa91](https://github.com/EpicGames/PixelStreamingInfrastructure/commit/42fa919d97c9a5cac5888878e22818c1938f0c90) Move to standardized `onwheel` browser event.

### Features
- [b23cba](https://github.com/EpicGames/PixelStreamingInfrastructure/commit/b23cba09d1ed8219f8cdf66bd09eaf5a6a50f94e) Added a `MaxPlayerCount` configuration option to the signalling server to restrict participant numbers (default -1: no upper limit).
- [e46c4d](https://github.com/EpicGames/PixelStreamingInfrastructure/commit/e46c4dcce2d5d5501f3aa6ce597f3df9f17fd450) Added support for handling websocket messages sent as binary.
- [616f07](https://github.com/EpicGames/PixelStreamingInfrastructure/commit/616f07affc13724a76ebf5f4a93f22ea9cb97208) Added `offerToReceive` toggle/flag to indicate browser should/or should not make the SDP offer.
- [845ab1](https://github.com/EpicGames/PixelStreamingInfrastructure/commit/845ab147b94ddd9374f6f0e043df8c39a9229d99) Added ability to send handle a "input protocol", which is a protocol specification for data channel messages sent by the UE side. This allows the frontend need no extra handling to support custom data channel messages (of course the user must still bind a handler if they wish to do anything with the message). 
- [1c1fe0](https://github.com/EpicGames/PixelStreamingInfrastructure/commit/1c1fe088d1f13bfd9eedd111cb7e9c1cd150c4d4) Added ability to request keyframes on the frontend.

## [UE 4.27 (End of life)](https://github.com/EpicGames/PixelStreamingInfrastructure/commits/UE4.27)

Backported 5.0 frontend to support 4.27:
- Removed SFU support as this is not supported in 4.27.
- Ignore playerConnected message as not supported in 4.27.
- Force frontend to generate the WebRTC offer as 4.27 expects this.

## [UE 4.26 (Unsupported)](https://github.com/EpicGames/PixelStreamingInfrastructure/commits/UE4.26)

Backported 5.0 frontend to support 4.26:
- Removed SFU support as this is not supported in 4.26.
- Ignore playerConnected message as not supported in 4.26.
- Force frontend to generate the WebRTC offer as 4.26 expects this.
- Remove Linux scripts as Linux Pixel Streaming was not supported in 4.26.
- Force the removal of `extmap-allow-mixed` from the SDP as WebRTC version UE used in 4.26 did not support it.

## Previous versions
Versions prior to UE 4.26 are not tracked here as this repository has never supported those versions.

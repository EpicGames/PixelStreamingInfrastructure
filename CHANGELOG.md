# Pixel Streaming Infrastructure Changelog

The changelog is a summary of commits between releases of Unreal Engine.

As a reminder each UE-X branch/tag in this repository corresponds to a version of Unreal Engine.

## [UE 5.3 (Current)](https://github.com/EpicGames/PixelStreamingInfrastructure/commits/UE5.3)

### Enhancements
- Upgrade 5.2 to 5.3 in libraries, docs, log messages, build pipelines by @lukehb in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/262

### Bug fixes
- Fix iOS touch when settings panel is open by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/274
- Include create, reconnect, and update events (with associated tests) by @jibranabsarulislam in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/273

## [UE 5.2](https://github.com/EpicGames/PixelStreamingInfrastructure/commits/UE5.2)

### Features
- Added minimal sample React implementation by @hmuurine in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/159
- Added a new frontend for the Pixel Streaming Demo showcase project by @lukehb in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/158
- Added multiple streamer support by @mcottontensor in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/74
- Added `DefaultToHover` being parsed as a config option in `InitialSettings` message by @StomyPX in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/68
- Added indication to the signalling server when the browser intends to send the offer by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/75
- Added experimental support for WebXR based experiences by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/85

### Docs
- New general docs page/ToC + new security page. by @MWillWallT in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/254
- Update README to mention container images require being part of Epic's Github org by @mcottontensor in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/248
- Update platform_scripts readme.md to explain the different scripts by @lukehb in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/224
- Improve signalling Server readme @DenisTensorWorks in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/223
- Adding microphone feature documentation for UE5.2 by @DenisTensorWorks in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/228
- Adding microphone feature documentation by @DenisTensorWorks in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/208
- Added new general docs page/ToC + new security page. by @MWillWallT in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/254
- Settings Panel Documentation by @MWillWallT in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/135
- Customised Pixel Streaming Player Page by @MWillWallT in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/90
- Updated Signalling Server docs by @DenisTensorWorks in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/223
- Updated docs for frontend for settings and TURN by @lukehb in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/224
- Adding docs for microphone feature by @DenisTensorWorks in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/228
- Updated README to mention container images require being part of Epic's Github org by @mcottontensor in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/248
- Updated the Frontend Docs to move some material from UE docs official to this repo by @StomyPX in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/152
- Update Docs to remove broken links by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/122

### Enhancements
- Add repository health status in the form of Github badges table on readme.md by @lukehb in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/265
- Re-enable iOS and iPadOS fullscreen by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/266
- Changed forwarded logs to Cyan, added warning for missing playerId by @StomyPX in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/253
- Added "media-playout" to prevent spam in Aggregated Stats by @chasse20 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/232
- Added 'stat PixelStreamingGraphs' to showcase frontend #229 by @devrajgadhvi in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/238
- Bump socket.io-parser from 4.2.2 to 4.2.4 in /Matchmaker by @dependabot in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/244
- Bump engine.io from 6.4.0 to 6.4.2 in /Matchmaker by @mcottontensor in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/220
- Allow inheritance of webrtcPlayerController and webXrController by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/209
- Pass command line args when calling run_local.bat by @lukehb in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/109
- Customize frontend styles through UI API by @hmuurine in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/133
- Force URL param settings when receiving initial application settings by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/134
- Added ability to pass HTTPS certificate locations via Cirrus configuration by @marcinbiegun in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/149
- Added unit tests for library by @hmuurine in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/156
- Converted frontend javascript to typescript and refactor. by @lukehb in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/63
- Removed useless code, make code style more consistent by @Senseme in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/59
- Multi-streamer QOL improvements by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/88
- Removing the player id from forwarded messages by @mcottontensor in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/91
- Added a QOL message when multiple streamers are detected by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/94
- Added dev and prod configs to webpack by @lukehb in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/102
- Added github actions to create an NPM package for frontend library and make a release for the repo by @lukehb in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/103
- Neaten up install scripts by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/106
- Added 'stat PixelStreamingGraphs' to showcase frontend #229 by @devrajgadhvi in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/238
- Changed forwarded logs to Cyan, added warning for missing playerId by @StomyPX in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/253
- Allow inheritance of webrtcPlayerController and webXrController by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/209
- Alter reconnection flow to request streamer message list and fail out after N attempts. by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/195
- Added exports for UI configuration types by @kass-kass in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/193
- Added ability to optionally disable certain frontend elements by @kass-kass in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/161
- Added support for programmatically changing peer layers when using the SFU by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/179
- Improved frontend API support for UE communication by @hmuurine in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/132
- Added ability in frontend to Enable/disable user input devices by @hmuurine in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/136
- Exposed websocketController and webXRController to public API by @lukehb in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/124
- Added XR events: xrSessionStarted, xrSessionEnded, xrFrame by @lukehb in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/125
- Decouple UI from the frontend library by @hmuurine in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/110
- Replaced hardcoded log path with given parameter path by @Mirmidion in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/39

### Bug fixes
- Fixed viewport resizing not always working due to improperly calling timer. by @mcottontensor in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/247
- Fixed hovering mouse mode set in URL being overridden on refresh. by @mcottontensor in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/246
- Fixed matchmaker directing users to http when the signalling server is using https by @mcottontensor in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/245
- Fixed reconnects will be attempted even when a disconnect is triggered by afk timeout by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/215
- Fixed datachannels not working when using the SFU by @mcottontensor in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/137
- Fixed SFU having clashing datachannel/stream ids, now using mediasoup's internal stream ids for SCTP by @StomyPX in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/129
- Fixed controller indices from multiple peers would clash by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/165
- Fixed Connecting to Unreal 5.1 app with the 5.2 frontend crashes on connect by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/180
- Fixed sfu player would try subscribing when sfu disconnected by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/172
- Fixed bug where stress tester would leave orphaned Pixel Streaming connections by @lukehb in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/185
- Fixed bug where reconnects were being attempted even when a disconnect is triggered by afk timeout by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/215
- Fixed viewport resizing not always working due to improperly calling timer. by @mcottontensor in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/247
- Fixed log spam caused by missing "media-playout" in Aggregated Stats by @chasse20 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/232
- Fixed hovering mouse mode set in URL being overridden on refresh. by @mcottontensor in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/246
- Fixed matchmaker directing users to http when the signalling server is using https by @mcottontensor in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/245
- Fixed frontend library not building on Linux due to incorrect casing by @StomyPX in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/96
- Fixed SFU peer datachannels aren't being created by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/95 and https://github.com/EpicGames/PixelStreamingInfrastructure/pull/97
- Fixed crash on browsers where the xr object wasn't on the navigator by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/93
- Fixed Preferred codec selector causes no stream if application launched without `-PixelStreamingNegotiateCodecs` by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/83
- Fixed adding the rest of the browsers supported codecs after setting the preferred codec (#83) by @lukehb in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/84
- Fixed delayed mic input  by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/77 and @lukehb in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/78
- Fixed syntax error by @mcianni in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/44
- Fixed check if KeyboardEvent.keyCode deprecated then use KeyboardEvent.code + mapping instead. by @lukehb in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/48
- Fixed bug when negating property in and removing duplicate property  by @lukehb in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/49
- Fixed incorrect login page path when using authentication by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/55
- Fixed handling of "defaultToHover" field in offer by @StomyPX in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/60
- Fixed Pixel Streaming session disconnecting entirely when using the new frontend by @hmuurine in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/141
- Fixed input would not entirely unregister when using the new frontend by @lukehb in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/144
- Fixed frontend not working with older NodeJS versions due ts-jest and jest by @hmuurine in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/168
- Fixed webpack was double bundling frontend lib into the final bundle (#117) by @lukehb in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/118 @hmuurine in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/117
- Fixed cirrus Dockerfile that resulting in a non-functional signalling server by @Belchy06 in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/123

### Security
- Various security updates by @mcottontensor in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/220
- Security updates for default turn server configuration. by @gingernaz in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/196
- Bumped qs and express in /SignallingWebServer by @dependabot in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/69
- Bumped qs and express in /Matchmaker by @dependabot in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/70
- Bumped passport from 0.4.1 to 0.6.0 in /SignallingWebServer by @dependabot in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/71
- Bumped engine.io and socket.io in /Matchmaker by @dependabot in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/72
- Bumped socket.io-parser from 4.2.2 to 4.2.4 in /Matchmaker by @dependabot in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/244
- Patched Uncaught exception in PixelStreamingInfrastructure via engine by @imhunterand in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/61
- Fixed insufficient validation when decoding a Socket packet by @iot-defcon in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/57
- @ CVE-2022-25896 by @mik-patient in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/35
- Bump webpack from 5.75.0 to 5.76.0 in /Frontend/library by @dependabot in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/153
- Bump webpack from 5.75.0 to 5.76.0 in /Frontend/ui-library by @dependabot in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/155
- Bump webpack from 5.75.0 to 5.76.0 in /Frontend/implementations/EpicGames by @dependabot in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/154
- Fixing security warnings. by @mcottontensor in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/163
- Moved all package.json under @epicgames-ps scope to avoid package confusion by @lukehb in https://github.com/EpicGames/PixelStreamingInfrastructure/pull/187

## [UE 5.1](https://github.com/EpicGames/PixelStreamingInfrastructure/commits/UE5.1)

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

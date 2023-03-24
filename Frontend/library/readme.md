## lib-pixelstreamingfrontend

The core library for the browser/client side of Pixel Streaming experiences. **This library contains no UI.**

See our TypeScript [UI library](/Frontend/ui-library) for an example of how to build UI on top of this library.

### Key features
- Create a websocket connection to communicate with the signalling server.
- Create a WebRTC player that displays the Unreal Engine video and audio.
- Handling of input from the user and transmitting it back to Unreal Engine.
- Opens a datachannel connection sending and receiving custom data (in addition to input).

### Adding it to your project

`npm config set @epicgames:registry https://npm.pkg.github.com/`

`npm install @epicgames/libpixelstreamingfrontend`


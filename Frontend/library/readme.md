## lib-pixelstreamingfrontend

The core library for the browser/client side of Pixel Streaming experiences. **This library contains no UI.**

See the [reference Pixel Streaming web player](https://github.com/EpicGames/PixelStreamingInfrastructure/tree/master/Frontend/implementations/typescript) for an example of how to build a Pixel Streaming web application, with custom UI, on top of this library.

### Key features
- Create a WebSocket connection to communicate with the signalling server.
- Create a WebRTC peer connection that displays the Pixel Streaming video and audio.
- Handling of input from the user and transmitting it back to Pixel Streaming application.
- Opens a data channel connection for sending and receiving custom data (in addition to input).
- Programmable (or url specified) settings.

### Adding it to your project
`npm install @epicgames-ps/lib-pixelstreamingfrontend-ue5.7`

### NPM package contents
- ES6 modules usage
- CommonJS lib
- Type definitions
- Source maps

**Note:** The NPM package does not contain a minified/bundled output, this is up to the user to do this in their application.

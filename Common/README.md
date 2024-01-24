## lib-pixelstreamingcommon

The common library for the browser/client side of Pixel Streaming experiences. This library exposes common functionality for frontend applications of the pixel streaming ecosystem.

See [lib-pixelstreamingfrontend](/Frontend/library) for an example of how to implement this library.

Currently exposed.
### Logger
A small helper class for handling logging across the pixel streaming infrastructure.

### ITransport
An interface to a transport protocol that is in charge of sending and receiving signalling messages. Users can make use of supplied transport protocols or implement their own transport protocol via extending this interface. They can then pass the transport into the constructor of `SignallingProtocol` which is explained below.

### WebSocketTransport
An `ITransport` implementation that sends signalling messages over a websocket. This is currently the only transport in use by the official pixel streaming frontend.

### SignallingProtocol
This is the object where the user should send/receive messages. Currently there are specific functions for specific messages sent, but in the future this should change to be more generic. You can specify your own transport protocol by passing an implementation of `ITransport` to this class, allowing you to send and receive messages through any protocol you wish.

### Adding it to your project
`npm i @epicgames-ps/lib-pixelstreamingcommon-ue5.5`

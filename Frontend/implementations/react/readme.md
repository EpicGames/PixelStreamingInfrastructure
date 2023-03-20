## Pixel Streaming sample React application

A minimal sample application that uses the Pixel Streaming library in React.

### Key features
- A minimal React application with a Pixel Streaming wrapper component
  - Starts a Pixel Streaming session on wrapper component mount
  - Disconnects the session on wrapper component unmount e.g. if navigating to another view in a single page app
  - Hooks to `playStreamRejected` event and displays a `Click to play` overlay if the browser rejects video stream auto-play

### Developing

To build and run the React application, run:

- `npm install`
- `npm run build-all`
- `npm run serve`

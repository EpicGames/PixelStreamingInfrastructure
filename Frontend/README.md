# Pixel Streaming Frontend Library

This is frontend javascript library for Epic Games' Pixel Streaming. 


The core features of this library are:

- Create a websocket connection to communicate with the signalling server.
- Create a WebRTC player that displays the Unreal Engine video and audio.
- Handling of input from the user and transmitting it back to Unreal Engine.
- Opens a datachannel connection sending and receiving custom data (in addition to input).

## Usage from source

When developing your own Pixel Streaming experience the intent is you will start with this library and extend it through the use of 
its public API. We have provided an example of this workflow in our implementations/EpicGames, which is an implementation of this library.

## Contributing

If part of the library is not exposed and you wish to extend it, please do so in your own branch and open a pull request with your change for our consideration.

## Developing

Changes to the library occur in the /library directory and require you to have NodeJS installed as part of your development environment.
Once you have NodeJS installed, 

- `cd library`
- `npm install`
- `npm run build`


If you are developing your implementation based on the library, the process is similar:


- `cd implementation/your_implementation`
- `npm build-all`


## Legal

Copyright &copy; 2022, Epic Games. Licensed under the MIT License, see the file [LICENSE](./LICENSE) for details.

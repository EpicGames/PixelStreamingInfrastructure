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

# Table of Contents
- [Customizing the Player Webpage](Docs\Customizing%20the%20Player%20Webpage.md)
- [HTML Page Requirements](Docs\HTML%20Page%20Requirements.md)
  - [Player File Location and URL](Docs\HTML%20Page%20Requirements.md)
- [Customizing Player Input Options](Docs/Customizing%20Player%20Input%20Options.md)
  - [Disabling User Input](Docs/Customizing%20Player%20Input%20Options.md)
- [Customizing the Player Widget Style](Docs/Customizing%20the%20Player%20Widget%20Style.md)
- [Accessing the Pixel Streaming Blueprint API](Docs/Accessing%20the%20Pixel%20Streaming%20Blueprint%20API.md)
- [Communicating from the Player Page to UE5](Docs/Communicating%20from%20the%20Player%20Page%20to%20UE5.md)
  - [Using the emitCommand Function](Docs/Communicating%20from%20the%20Player%20Page%20to%20UE5.md)
  - [Using the emitUIInteraction Function](Docs/Communicating%20from%20the%20Player%20Page%20to%20UE5.md)
- [Communicating from UE5 to the Player Page](Docs/Communicating%20from%20UE5%20to%20the%20Player%20Page.md)
- [Timing Out Inactive Connections](Docs/Timing%20Out%20Inactive%20Connections.md)




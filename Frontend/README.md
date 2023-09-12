# Pixel Streaming Frontend

The **frontend** refers to the HTML, CSS, images, and JavaScript/TypeScript code that runs in web browsers and allows them to connect to Unreal Engine Pixel Streaming applications and interact with them. The frontend library is the foundation that developers can modify and extend to suit the needs of their Pixel Streaming experience.

The frontend consists of two packages:

1. [lib-pixelstreamingfrontend](/Frontend/library/): the core Pixel Streaming frontend for WebRTC, settings, input, and general functionality.
2. [lib-pixelstreamingfrontend-ui](/Frontend/implementations/typescript): the reference UI that users can either optionally apply on top of the core library or build on top of.


## Docs
- [The Settings Panel](Docs/Settings%20Panel.md)
- [Customizing the Player Webpage](Docs/Customizing%20the%20Player%20Webpage.md)
- [HTML Page Requirements](Docs/HTML%20Page%20Requirements.md)
  - [Player File Location and URL](Docs/HTML%20Page%20Requirements.md)
- [Customizing Player Input Options](Docs/Customizing%20Player%20Input%20Options.md)
  - [Disabling User Input](Docs/Customizing%20Player%20Input%20Options.md)
- [Customizing the Player Widget Style](Docs/Customizing%20the%20Player%20Widget%20Style.md)
- [Accessing the Pixel Streaming Blueprint API](Docs/Accessing%20the%20Pixel%20Streaming%20Blueprint%20API.md)
- [Communicating from the Player Page to UE5](Docs/Communicating%20from%20the%20Player%20Page%20to%20UE5.md)
  - [Using the emitCommand Function](Docs/Communicating%20from%20the%20Player%20Page%20to%20UE5.md)
  - [Using the emitUIInteraction Function](Docs/Communicating%20from%20the%20Player%20Page%20to%20UE5.md)
- [Communicating from UE5 to the Player Page](Docs/Communicating%20from%20UE5%20to%20the%20Player%20Page.md)
- [Timing Out Inactive Connections](Docs/Timing%20Out%20Inactive%20Connections.md)

## Integrating the libraries into your project
The TypeScript libraries are provided as both an [NPM](https://www.npmjs.com/settings/epicgames-ps/packages) package and a [UMD](https://github.com/umdjs/umd) module (available via [unpkg](https://unpkg.com/)), making it easy to consume the libraries from either TypeScript code or plain JavaScript code using modern web development tools and workflows.

## Usage from source

When developing your own Pixel Streaming experience the intent is you will start with this library and extend it through the use of 
its public API. We have provided an example of this workflow in our [implementations/typescript](/Frontend/implementations/typescript), which is an implementation of this library.

## Contributing

If part of the library is not exposed and you wish to extend it, please do so in your own branch and open a pull request with your change for our consideration.

## Developing

⚠️ Only NodeJS LTS 18.17.0 is officially supported, some newer versions on NodeJS **WILL BREAK YOUR BUILD** ⚠️

### Prerequisites
- Install NodeJS LTS 18.17.0 on your system.
- Install npm globally using: `npm install npm -g` (yes this is required)

### Building the Library

Changes to the library occur in the [/library](/Frontend/library) directory and require you to have NodeJS installed as part of your development environment.
Once you have NodeJS installed: 

- `cd library`
- `npm install`
- `npm run build`

### Building the UI-Library

The user interface library is provided in [/ui-library](/Frontend/ui-library) directory. You can either use it or provide your own user interface. To build run:
- Follow the steps to build the library first
- `cd ui-library`
- `npm install`
- `npm run build-all`

### Building the default UI

The default user interface is provided under [/implementations/typescript](/Frontend/implementations/typescript). To build run:

- Follow the steps to build the libary and ui-library first
- `cd implementations/typescript`
- `npm install`
- `npm run build-all`

This will produce `player.html` and `player.js` under the `SignallingWebServer/Public` directory - this is the default UI.

### Making your own UI

We recommend studying [/ui-library](/Frontend/ui-library) and [player.ts](/Frontend/implementations/typescript/src/player.ts)/[player.html](/Frontend/implementations/typescript/src/player.html), or alternatively the sample React implementation in [implementations/react](/Frontend/implementations/react), then once you have copied and modified the [package.json](/Frontend/implementations/typescript/package.json) and `.ts` into your own `implementation/your_implementation` directory, the process is similar:

- `cd implementation/your_implementation`
- `npm build-all`

## Unit tests

The [/library](/Frontend/library) project has unit tests that test the Pixel Streaming functionality against a mocked connection. To run the tests manually, run:
- `cd library`
- `npm install`
- `npm run test`

## Legal

Copyright &copy; 2023, Epic Games. Licensed under the MIT License, see the file [LICENSE](./LICENSE) for details.

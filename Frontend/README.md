# Pixel Streaming Frontend

The **frontend** refers to the HTML, CSS, images, and JavaScript/TypeScript code that runs in web browsers and allows them to connect to Pixel Streaming applications and interact with them. The frontend library is the foundation that developers can modify and extend to suit the needs of their Pixel Streaming experience.

The frontend consists of these packages:

1. [lib-pixelstreamingfrontend](/Frontend/library/): the core Pixel Streaming frontend for WebRTC, settings, input, and general functionality.
2. [lib-pixelstreamingfrontend-ui](/Frontend/ui-library/): the UI library that users can either optionally apply on top of the core library or build on top of.
3. [reference-pixelstreamingfrontend](/Frontend/implementations/typescript/): the reference implementation of the Pixel Streaming frontend (the one that ships with the plugin).

These libraries are published as [NPM packages](/README.md#npm-packages) and support usage as ES6 modules, CommonJS, include type definitions and source maps.

## Docs
- [Frontend usage docs](/Frontend/Docs/)
- [Common API](/Common/docs/)
- [Signalling protocol](/Common/docs/Protocol.md)
- [Signalling API](/Signalling/docs/)

## Integrating the libraries into your project
The TypeScript libraries are provided as both an [NPM](https://www.npmjs.com/settings/epicgames-ps/packages) package containing ES6 modules and a CommonJS, making it easy to consume the libraries from either TypeScript code or plain JavaScript code using modern web development tools and workflows.

## Usage from source

When developing your own Pixel Streaming experience the intent is you will start with this library and extend it through the use of 
its public API. We have provided an example of this workflow in our [implementations/typescript](/Frontend/implementations/typescript), which is an implementation of the frontend libraries and contains a working example of how you can bundle/minify your final application JavaScript.

## Contributing

If part of the library is not exposed and you wish to extend it, please do so in your own branch and open a pull request with your change for our consideration.

## Developing

⚠️ Only [this](https://github.com/EpicGames/PixelStreamingInfrastructure/blob/master/NODE_VERSION) NodeJS version is officially supported, other versions may **BREAK YOUR BUILD** ⚠️

### Prerequisites for local dev
- Install NodeJS version specified above.
- Ensure `npm` is available in your terminal.

### Building the frontend library

Changes to the library occur in the [/library](/Frontend/library) directory and require you to have NodeJS installed as part of your development environment.

Once you have NodeJS installed, refer to the build instructions in [/Frontend/library/](/Frontend/library/)

### Building the frontend UI library

The user interface library is provided in [/ui-library](/Frontend/ui-library) directory. You can either use it or provide your own user interface. 

To build run refer to the build instructions in [Frontend/ui-library/](/Frontend/ui-library).

### Building the reference frontend (the web page shipped with the Pixel Streaming plugin)

The default Pixel Streaming web player is provided under [/implementations/typescript](/Frontend/implementations/typescript). 

To build run refer to the build instructions in [/implementations/typescript/](/Frontend/implementations/typescript).

This will produce `player.html` and `player.js` under the `SignallingWebServer/Public` directory - these are the default Pixel Streaming web frontend.

### Making your own UI

We recommend studying [/ui-library](/Frontend/ui-library) and [player.ts](/Frontend/implementations/typescript/src/player.ts)/[player.html](/Frontend/implementations/typescript/src/player.html), or alternatively the sample React implementation in [implementations/react](/Frontend/implementations/react).

## Unit tests

Many of the libraries, such as [/frontend/library/](/Frontend/library), contain unit tests that test the Pixel Streaming functionality against a mocked connection. To run the tests manually study the `package.json` in the root of the library.

## Legal

Copyright Epic Games. Licensed under the MIT License, see the file [LICENSE](/LICENSE.md) for details.

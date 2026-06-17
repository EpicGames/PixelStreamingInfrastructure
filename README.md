# Experimental Pixel Streaming 2 plugin release in 5.5

From UE 5.5 onwards, Epic Games introduced a layer that makes it easier to maintain WebRTC internally. As the original Pixel Streaming plugin used WebRTC directly, this change meant that we had to introduce a new plugin to ensure a better transition phase for the developers who have developed custom solutions on top of the PixelStreaming plugin. For now, both the original Pixel Streaming plugin and the Pixel Streaming 2 plugin will be shipped with Unreal Engine to give users time to migrate.

We have created a [migration guide](/Docs/pixel-streaming-2-migration-guide.md) to ensure a smooth transition for all licensees using the plugin and to highlight all major changes between the plugins.

# Repository health checks and actions

| Health Checks | UE5.7 | UE5.6 | UE5.5 |
| - | - | - | - |
| [![Libraries](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/healthcheck-libraries.yml/badge.svg?branch=master)](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/healthcheck-libraries.yml) | [![Publish NPM libraries](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/changesets-publish-npm-packages.yml/badge.svg?branch=UE5.7)](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/changesets-publish-npm-packages.yml) | [![Publish NPM libraries](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/changesets-publish-npm-packages.yml/badge.svg?branch=UE5.6)](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/changesets-publish-npm-packages.yml) | [![Publish NPM libraries](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/changesets-publish-npm-packages.yml/badge.svg?branch=UE5.5)](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/changesets-publish-npm-packages.yml) |
| [![Platform Scripts](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/healthcheck-platform-scripts.yml/badge.svg?branch=master)](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/healthcheck-platform-scripts.yml) | [![Publish container images](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/publish-container-images.yml/badge.svg?branch=UE5.7)](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/publish-container-images.yml) | [![Publish container images](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/publish-container-images.yml/badge.svg?branch=UE5.6)](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/publish-container-images.yml) | [![Publish container images](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/publish-container-images.yml/badge.svg?branch=UE5.5)](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/publish-container-images.yml) |
| [![Signalling Protocol](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/healthcheck-signalling-protocol.yml/badge.svg?branch=master)](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/healthcheck-signalling-protocol.yml) | [![Releases](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/create-gh-release.yml/badge.svg?branch=UE5.7)](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/create-gh-release.yml) | [![Releases](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/create-gh-release.yml/badge.svg?branch=UE5.6)](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/create-gh-release.yml) | [![Releases](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/create-gh-release.yml/badge.svg?branch=UE5.5)](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/create-gh-release.yml) |
| [![Signalling Server Image](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/healthcheck-image-wilbur.yml/badge.svg?branch=master)](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/healthcheck-image-wilbur.yml) | | | |
| [![SFU Docker Image](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/healthcheck-image-sfu.yml/badge.svg?branch=master)](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/healthcheck-image-sfu.yml) | | | |
| [![Documentation Links](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/healthcheck-markdown-links.yml/badge.svg?branch=master)](https://github.com/EpicGames/PixelStreamingInfrastructure/actions/workflows/healthcheck-markdown-links.yml) | | | |

# The official home for the Pixel Streaming servers and frontend!
The frontend and web server elements for Unreal Pixel Streaming (previously located in `Samples/PixelStreaming/WebServers`) are now in this repository, for all to contribute to. They are referred to as the **Pixel Streaming Infrastructure**.

## Getting Started
To **build** and **run** everything you need to connect to the Pixel Streaming plugin simply run the following in the root of your `PixelStreamingInfrastructure` directory:

**Windows**
```
.\SignallingWebServer\platform_scripts\cmd\start.bat
```

**Linux or Mac**
```
./SignallingWebServer/platform_scripts/bash/start.sh
```

If you want to work on a specific library within this monorepo then `cd` into that directory and run:

`npm install`
`npm run build`

If you want to install all the dependencies and flush any existing `node_modules`, go to the root of the repo and run:

`npm install`

This works because this monorepo is using [NPM workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces?v=true). Using NPM workspaces means:

- Each sub-workspace within the monorepo does not have its own `package-lock.json`. There is only a single one in the root.
- Common dependencies are hoisted into the root `node_modules` directory.
- Some sub-workspaces will not have a `node_modules` directory because all their dependencies exist in the root `node_modules`.
- When working locally within the monorepo dependencies on sub-workspaces will first try to use a local `symlink` to those dependencies instead of downloading the published packages from NPM. For example, `pixelstreaming-frontend` depends on `pixelstreaming-common`, when working in this repo that dependency will first be attempted to be resolved using the local `./Common` directory.

## Goals

The goals of this repository are to:

- Increase the release cadence for the Pixel Streaming servers (to mitigate browser breaking changes sooner).
- Encourage easier contribution of these components by Unreal Engine licensees.
- Facilitate a more standard web release mechanism.
- Grant a permissive license to distribute and modify this code wherever you see fit (MIT licensed).

## Contributing

If you would like to contribute to our repository, please reference our [contribution guide](CONTRIBUTING.md). Thank you for your time and your efforts!

## Contents

The Pixel Streaming Infrastructure contains reference implementations for all the components needed to run a pixel streaming application. They are structured as separate projects, which work together, but are designed to be modular and interoperable with other implementations which use WebRTC technology. These implementations include: 
- A signalling web server, called Cirrus, found in [`SignallingWebServer/`](SignallingWebServer/).
- An SFU (Selective Forwarding Unit), found in [`SFU/`](SFU/).
- A common library for frontend applications, found in [`Common/`](Common/).
- Several frontend projects for the WebRTC player and input, found in [`Frontend/`](Frontend/):
  - shared libraries for [communication](Frontend/library/) and [UI](Frontend/ui-library/) functionality
  - separate [implementations](Frontend/implementations/) using different techologies such as TypeScript or React/JSX
  - For detailed information, see the [/frontend](/Frontend/).
- A signalling protocol test application that validates implementations of the signalling protocol, found in [`Extras/SS_Test/`](Extras/SS_Test/).

## Releases
We release a number of different components under this repository, specifically:

- Container images for the signalling server
- NPM packages for the frontend
- Source releases of this repo with the reference frontend built as a minified js bundle

### Container images

The following container images are built from this repository:

- [[Unofficial] pixel-streaming-signalling-server](https://hub.docker.com/r/pixelstreamingunofficial/pixel-streaming-signalling-server/tags)
- [[Unofficial] pixel-streaming-sfu](https://hub.docker.com/r/pixelstreamingunofficial/pixel-streaming-sfu/tags)

### NPM Packages
The following are `unofficial` NPM packages (official ones coming soon):

| NPM Package | 5.7 | 5.6 | 5.5 |
|-------------|-----|-----|-----|
| Frontend lib | [lib-pixelstreamingfrontend-ue5.7](https://www.npmjs.com/package/@epicgames-ps/lib-pixelstreamingfrontend-ue5.7) | [lib-pixelstreamingfrontend-ue5.6](https://www.npmjs.com/package/@epicgames-ps/lib-pixelstreamingfrontend-ue5.6) | [lib-pixelstreamingfrontend-ue5.5](https://www.npmjs.com/package/@epicgames-ps/lib-pixelstreamingfrontend-ue5.5) |
| Frontend-ui lib | [lib-pixelstreamingfrontend-ui-ue5.7](https://www.npmjs.com/package/@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.7) | [lib-pixelstreamingfrontend-ui-ue5.6](https://www.npmjs.com/package/@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.6) | [lib-pixelstreamingfrontend-ui-ue5.5](https://www.npmjs.com/package/@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.5) |
| Signalling lib  | [lib-pixelstreamingsignalling-ue5.7](https://www.npmjs.com/package/@epicgames-ps/lib-pixelstreamingsignalling-ue5.7)  | [lib-pixelstreamingsignalling-ue5.6](https://www.npmjs.com/package/@epicgames-ps/lib-pixelstreamingsignalling-ue5.6)  | `N/A` |
| Common lib  | [lib-pixelstreamingcommon-ue5.7](https://www.npmjs.com/package/@epicgames-ps/lib-pixelstreamingcommon-ue5.7)  | [lib-pixelstreamingcommon-ue5.6](https://www.npmjs.com/package/@epicgames-ps/lib-pixelstreamingcommon-ue5.6)  | `N/A` |

### NPM getting started

```bash
#frontend (core lib)
npm i @epicgames-ps/lib-pixelstreamingfrontend-ue5.7
#frontend ui
npm i @epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.7
```

## Documentation 
* [General Docs](/Docs/README.md)
* [Frontend Docs](/Frontend/README.md)
* [Signalling Server Docs](/SignallingWebServer/README.md)
* [SFU Docs](/SFU/README.md)

### Tagged source releases + built typescript frontend

[Github releases](https://github.com/EpicGames/PixelStreamingInfrastructure/releases)

## Versions

We maintain versions of the servers and frontend that are compatible with existing and in-development version of Unreal Engine. 

:warning: **There are breaking changes between UE versions - so make sure you get the right version**. :warning:

<ins>For a list of major changes between versions please refer to the [changelog](https://github.com/EpicGames/PixelStreamingInfrastructure/blob/master/CHANGELOG.md).</ins>

This repository contains the following in branches that track Unreal Engine versions:

| Branch | Status |
|--------|--------|
|[Master](https://github.com/EpicGames/PixelStreamingInfrastructure/tree/master)| Dev |
|[UE5.7](https://github.com/EpicGames/PixelStreamingInfrastructure/tree/UE5.7)| Current |
|[UE5.6](https://github.com/EpicGames/PixelStreamingInfrastructure/tree/UE5.6)| Supported |
|[UE5.5](https://github.com/EpicGames/PixelStreamingInfrastructure/tree/UE5.5)| End of life |
|[UE5.4](https://github.com/EpicGames/PixelStreamingInfrastructure/tree/UE5.4)| Unsupported |

| Legend | Meaning |
|---------|-----------|
| Dev | This is our dev branch, intended to be paired with [ue5-main](https://github.com/EpicGames/UnrealEngine/tree/ue5-main) - experimental. |
|Pre-release| Code in here will be paired with the next UE release, we periodically update this branch from `master`. |
| Current | Supported and this is the branch tracking the **latest released** version of UE. |
| Supported | We will accept bugfixes/issues for this version. |
| End of life | Once the next UE version is released we will not support this version anymore. |
| Unsupported | We will not be supporting this version with bugfixes. |

## Legal
Copyright Epic Games, Inc. Unreal and its logo are Epic’s trademarks or registered trademarks in the US and elsewhere.

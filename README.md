# The official home for the Pixel Streaming servers and frontend!
The frontend and web server elements for Unreal Pixel Streaming (previously located in `Samples/PixelStreaming/WebServers`) are now in this repository, for all to contribute to. They are referred to as the **Pixel Streaming Infrastructure**.

## Goals

The goals of this repository are to:

- Increase the release cadence for the Pixel Streaming servers (to mitigate browser breaking changes sooner).
- Encourage easier contribution of these components by Unreal Engine licensees.
- Facilitate a more standard web release mechanism.
- Grant a permissive license to distribute and modify this code wherever you see fit (MIT licensed).

## Contents

The Pixel Streaming Infrastructure contains reference implementations for all the components needed to run a pixel streaming application. They are structured as separate projects, which work together, but designed to be modular and interoperable with other implementations which use WebRTC technology. These implementations include: 
- A signalling web server, called Cirrus, found in [`SignallingWebServer/`](SignallingWebServer/).
- An SFU (Selective Forwarding Unit), found in [`SFU/`](SFU/).
- A matchmaker, found in [`Matchmaker/`](Matchmaker/).
- Several frontend projects for the WebRTC player and input, found in [`Frontend/`](Frontend/):
  - shared libraries for [communication](Frontend/library/) and [UI](Frontend/ui-library/) functionality
  - separate [implementations](Frontend/implementations/) using different techologies such as TypeScript or React/JSX

  For detailed information, see the [frontend readme](Frontend/README.md).


## Releases
We release a number of different things under this repository, currently they are:

- container images for the signalling server
- npm packages for the frontend
- source releases of this repo with the reference frontend built as a minified js bundle

### Container images

The following container images are built from this repository:

- [ghcr.io/epicgames/pixel-streaming-signalling-server](https://github.com/orgs/EpicGames/packages/container/package/pixel-streaming-signalling-server) (since Unreal Engine 5.1)

### NPM Packages
The following are `unofficial` NPM packages (official ones coming soon):

| Branch | Frontend library | Frontend reference ui |
|--------|------------------|-----------------------|
| UE5.2  |[lib-pixelstreamingfrontend-ue5.2](https://www.npmjs.com/package/@epicgames-ps/lib-pixelstreamingfrontend-ue5.2)|[lib-pixelstreamingfrontend-ui-ue5.2](https://www.npmjs.com/package/@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.2)|

### NPM getting started

```bash
#frontend (core lib)
npm i @epicgames-ps/lib-pixelstreamingfrontend-ue5.2
#frontend ui
npm i @epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.2
```

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
|[UE5.2](https://github.com/EpicGames/PixelStreamingInfrastructure/tree/UE5.2)| Pre-release |
|[UE5.1](https://github.com/EpicGames/PixelStreamingInfrastructure/tree/UE5.1)| Current |
|[UE5.0](https://github.com/EpicGames/PixelStreamingInfrastructure/tree/UE5.0)| Supported |
|[UE4.27](https://github.com/EpicGames/PixelStreamingInfrastructure/tree/UE4.27)| End of life |
|[UE4.26](https://github.com/EpicGames/PixelStreamingInfrastructure/tree/UE4.26)| Unsupported |

| Legend | Meaning |
|---------|-----------|
| Dev | This is our dev branch, intended to be paired with [ue5-main](https://github.com/EpicGames/UnrealEngine/tree/ue5-main) - experimental. |
|Pre-release| Code in here will be paired with the next UE release, we periodically update this branch from `master`. |
| Current | Supported and this is the branch tracking the **latest released** version of UE. |
| Supported | We will accept bugfixes/issues for this version. |
| End of life | Once the next UE version is released we will not support this version anymore. |
| Unsupported | We will not be supporting this versions with bugfixes. |

## Legal
© 2004-2023, Epic Games, Inc. Unreal and its logo are Epic’s trademarks or registered trademarks in the US and elsewhere. 

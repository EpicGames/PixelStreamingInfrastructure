# The official home for the Pixel Streaming servers and frontend!
The Pixel Streaming servers and web frontend that was in `Samples/PixelStreaming/WebServers` is now here for all the contribute to. 

## Goals

The goals of this repository are to:

- Increase the release cadence for the Pixel Streaming servers (to mitigate browser breaking changes sooner).
- Encourage easier contribution of these components by Unreal Engine licensees.
- Facilitate a more standard web release mechanism (e.g. NPM packages or similar... coming soon).
- Grant a permissive license to distribute and modify this code wherever you see fit (MIT licensed).

## Repository contents

Reference implementations for the various pieces needed to support a PixelStreaming application:
- SignallingWebServer (Cirrus)
- SFU (Selective Forwarding Unit)
- Matchmaker
- Frontend (the javascript frontend library for the WebRTC player and input)

## Container images

The following container images are built from this repository:

- [ghcr.io/epicgames/pixel-streaming-signalling-server](https://github.com/orgs/EpicGames/packages/container/package/pixel-streaming-signalling-server) (since Unreal Engine 5.1)

## Versions

We maintain versions of the servers and frontend that are compatible with existing and in-development version of Unreal Engine. 

:warning: **There are breaking changes between UE versions - so make sure you get the right version**. :warning:

<ins>For a list of major changes between versions please refer to the [changelog](https://github.com/EpicGames/PixelStreamingInfrastructure/blob/master/CHANGELOG.md).</ins>

This repository contains the following in branches that track Unreal Engine versions:

| Branch | Status |
|--------|--------|
|[Master](https://github.com/EpicGames/PixelStreamingInfrastructure/tree/master)| Dev |
|[UE5.1](https://github.com/EpicGames/PixelStreamingInfrastructure/tree/UE5.1)| Current |
|[UE5.0](https://github.com/EpicGames/PixelStreamingInfrastructure/tree/UE5.0)| Supported |
|[UE4.27](https://github.com/EpicGames/PixelStreamingInfrastructure/tree/UE4.27)| End of life |
|[UE4.26](https://github.com/EpicGames/PixelStreamingInfrastructure/tree/UE4.26)| Unsupported |

| Legend | Meaning |
|---------|-----------|
| Dev | This is our dev branch tracking [ue5-main](https://github.com/EpicGames/UnrealEngine/tree/ue5-main) - experimental. |
| Current | Supported and this is the branch tracking the **latest released** version of UE. |
| Supported | We will accept bugfixes/issues for this version. |
| End of life | Once the next UE version is released we will not support this version anymore. |
| Unsupported | We will not be supporting this versions with bugfixes. |

## Legal
© 2004-2023, Epic Games, Inc. Unreal and its logo are Epic’s trademarks or registered trademarks in the US and elsewhere. 

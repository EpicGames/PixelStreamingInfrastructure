// Copyright Epic Games, Inc. All Rights Reserved.

import { Config, PixelStreaming } from '@epicgames-ps/lib-pixelstreamingfrontend-dev';

document.body.onload = function() {
	// Example of how to set the logger level
	// Logger.SetLoggerVerbosity(10);

	// Create a config object
	const config = new Config({
		initialSettings: {
			AutoPlayVideo: true,
			AutoConnect: true,
			ss: "ws://localhost:80",
			StartVideoMuted: true,
		}
	});

	// Create a PixelStreaming instance and attach the video element to an existing parent div
	const pixelStreaming = new PixelStreaming(config, { videoElementParent: document.getElementById("videoParentElement")});
}

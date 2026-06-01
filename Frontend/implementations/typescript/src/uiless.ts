// Copyright Epic Games, Inc. All Rights Reserved.

import { Config, PixelStreaming } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.8';

document.body.onload = function() {

	// Create a config object
	const config = new Config({
		initialSettings: {
			AutoPlayVideo: true,
			AutoConnect: true,
			StartVideoMuted: true,
			WaitForStreamer: true,
		}
	});

	// Create a PixelStreaming instance and attach the video element to an existing parent div
	const pixelStreaming = new PixelStreaming(config, { videoElementParent: document.getElementById("videoParentElement")});

	// If browser denies autoplay, show "Click to play" and register a click-to-play handler
	pixelStreaming.addEventListener("playStreamRejected", () => {
		const clickToPlay = document.getElementById("clickToPlayElement");
		clickToPlay.className = "visible";
		clickToPlay.onclick = () => {
			pixelStreaming.play();
			clickToPlay.className = "";
			clickToPlay.onclick = undefined;
		}
	})
}

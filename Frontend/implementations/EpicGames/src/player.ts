// Copyright Epic Games, Inc. All Rights Reserved.

import * as libfrontend from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.2';
import { Application, PixelStreamingApplicationStyle } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.2';
export const PixelStreamingApplicationStyles =
    new PixelStreamingApplicationStyle();


document.body.onload = function() {
	// Example of how to set the logger level
	//libfrontend.Logger.SetLoggerVerbosity(10);

	// Create a config object
	let config = new libfrontend.Config({onAfkWarningActivate: () => console.log("")});

	// Create a Native DOM delegate instance that implements the Delegate interface class
	let pixelStreaming = new libfrontend.PixelStreaming(config);
	let application = new Application({ pixelStreaming });
	// document.getElementById("centrebox").appendChild(application.rootElement);
	document.body.appendChild(application.rootElement);
}

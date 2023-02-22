// Copyright Epic Games, Inc. All Rights Reserved.

import { Config, PixelStreaming } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.2';
import { Application, PixelStreamingApplicationStyle } from '@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.2';
export const PixelStreamingApplicationStyles =
    new PixelStreamingApplicationStyle();


document.body.onload = function() {
	// Example of how to set the logger level
	// Logger.SetLoggerVerbosity(10);

	// Create a config object
	const config = new Config({ useUrlParams: true });

	// Create a Native DOM delegate instance that implements the Delegate interface class
	const pixelStreaming = new PixelStreaming(config);
	const application = new Application({ pixelStreaming });
	// document.getElementById("centrebox").appendChild(application.rootElement);
	document.body.appendChild(application.rootElement);
}

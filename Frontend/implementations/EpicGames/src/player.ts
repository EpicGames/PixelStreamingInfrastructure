// Copyright Epic Games, Inc. All Rights Reserved.

import * as libfrontend from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.2';
import { PixelStreamingApplicationStyle } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.2';
export const PixelStreamingApplicationStyles =
    new PixelStreamingApplicationStyle();


document.body.onload = function() {
	// Example of how to set the logger level
	//libfrontend.Logger.SetLoggerVerbosity(10);

	// Create a config object
	let config = new libfrontend.Config();

	// Create a Native DOM delegate instance that implements the Delegate interface class
	let application = new libfrontend.Application(config);
	// document.getElementById("centrebox").appendChild(application.rootElement);
	document.body.appendChild(application.rootElement);
}

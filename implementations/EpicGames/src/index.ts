// Copyright Epic Games, Inc. All Rights Reserved.

import * as libfrontend from '@epicgames/pixelstreamingfrontend';

// Example of how to set the logger level
//libfrontend.Logger.SetLoggerVerbosity(10);

// Create a config object
let config = new libfrontend.Config();

// Create a Native DOM delegate instance that implements the Delegate interface class
let application = new libfrontend.Application(config);
// document.getElementById("centrebox").appendChild(application.rootElement);
document.body.appendChild(application.rootElement);

// HACK: We want our body to be 100vh, but this doesn't work on iOS as the viewport height includes the address bar, leading to overflow and the need to scroll
// To fix this we use the window innerHeight. This may not be necessary for your implementation
const setBodyToWindowHeight = () => {
	document.body.setAttribute("style", `background: #2e0052; width: 100vw; height: ${window.innerHeight}px`);
}
window.addEventListener("resize", setBodyToWindowHeight);
setBodyToWindowHeight();
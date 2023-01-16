import { SPSApplication } from "./SPSApplication";
import * as libfrontend from '@epicgames/pixelstreamingfrontend';

document.body.onload = function() {

	// Example of how to set the logger level
	//libfrontend.Logger.SetLoggerVerbosity(10);

	// Create a config object
	let config = new libfrontend.Config();

	// Extremely important, SPS only support browser sending the offer.
	config.setFlagEnabled(libfrontend.Flags.BrowserSendOffer, true);

	// Create a Native DOM delegate instance that implements the Delegate interface class
	let spsApplication = new SPSApplication(config);
	document.body.appendChild(spsApplication.rootElement);

}
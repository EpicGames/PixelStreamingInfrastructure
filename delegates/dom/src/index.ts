import { NativeDOMDelegate } from "./NativeDOMDelegate";
import * as libspsfrontend from '@tensorworks/libspsfrontend';

// Example of how to set the logger level
//libspsfrontend.Logger.SetLoggerVerbosity(10);

// Create a config object
let config = new libspsfrontend.Config();
config.enableSpsAutoConnect = false;
config.enableSpsAutoplay = true;

// Extremely important, SPS only support browser sending the offer.
config.setFlagEnabled(libspsfrontend.Flags.BrowserSendOffer, true);

// Create a Native DOM delegate instance that implements the Delegate interface class
let delegate = new NativeDOMDelegate(config);
//document.getElementById("centrebox").appendChild(delegate.rootElement);
document.body.appendChild(delegate.rootElement);


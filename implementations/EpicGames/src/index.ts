import * as libfrontend from '@epicgames/libfrontend';

// Example of how to set the logger level
//libfrontend.Logger.SetLoggerVerbosity(10);

// Create a config object
let config = new libfrontend.Config();
config.enableAutoConnect = false;
config.enableAutoplay = true;

// Create a Native DOM delegate instance that implements the Delegate interface class
let application = new libfrontend.Application(config);
// document.getElementById("centrebox").appendChild(application.rootElement);
document.body.appendChild(application.rootElement);


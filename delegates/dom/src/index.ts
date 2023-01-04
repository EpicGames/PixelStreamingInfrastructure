import { NativeDOMDelegate } from "./NativeDOMDelegate";
import * as libspsfrontend from '@tensorworks/libspsfrontend';

// set the logger level
//libspsfrontend.Logger.SetLoggerVerbosity(10);

// Determine whether a signalling server WebSocket URL was specified at compile-time or if we need to compute it at runtime
declare var WEBSOCKET_URL: string;
let signallingServerAddress = WEBSOCKET_URL;
if (signallingServerAddress == '') {
    // define our signallingServerProtocol to be used based on whether
    // or not we're accessing our frontend via a tls
    let signallingServerProtocol = 'ws:';
    if (location.protocol === 'https:') {
        signallingServerProtocol = 'wss:';
    }

    // set signalling server address to window url
    signallingServerAddress = signallingServerProtocol + '//' + window.location.hostname

    // try to parse signalling server from url parameter
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.has('ss')){
        signallingServerAddress = urlParams.get('ss');
    }

    // build the websocket endpoint based on the protocol used to load the frontend
    //signallingServerAddress = signallingServerProtocol + '//' + "sps.pixelstreaming.co/demo/ws"; // window.location.hostname

    // if the frontend for an application is served from a base-level domain
    // it has a trailing slash, so we need to account for this when appending the 'ws' for the websocket ingress
    if (window.location.pathname == "/") {
        signallingServerAddress += '/ws'
    } else {
        signallingServerAddress += (window.location.pathname + '/ws')
    }
}

// Create a config object
let config = new libspsfrontend.Config(signallingServerAddress);
config.enableSpsAutoConnect = false;
config.enableSpsAutoplay = true;

// Create a Native DOM delegate instance that implements the Delegate interface class
let delegate = new NativeDOMDelegate(config);
//document.getElementById("centrebox").appendChild(delegate.rootElement);
document.body.appendChild(delegate.rootElement);


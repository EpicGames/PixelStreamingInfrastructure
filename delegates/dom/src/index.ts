import { NativeDOMDelegate } from "./NativeDOMDelegate";
import * as libspsfrontend from '@tensorworks/libspsfrontend'

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

    // build the websocket endpoint based on the protocol used to load the frontend
    signallingServerAddress = signallingServerProtocol + '//' + window.location.hostname

    // if the frontend for an application is served from a base-level domain
    // it has a trailing slash, so we need to account for this when appending the 'ws' for the websocket ingress
    if (window.location.pathname == "/") {
        signallingServerAddress += '/ws'
    } else {
        signallingServerAddress += (window.location.pathname + '/ws')
    }
}

signallingServerAddress = "ws://sps.tenant-tensorworks-testing.lga1.ingress.coreweave.cloud/ws";

// Create a config object
let config = CreateConfig(signallingServerAddress, "player");

// Create a Native DOM delegate instance that implements the Delegate interface class
let delegate = new NativeDOMDelegate(config);

// Create and return a new webRtcPlayerController instance 
let RTCPlayer = create(config, delegate);

// create takes in a delage interface type which our NativeDomDelegate class implements
function create(config: libspsfrontend.Config, delegate: libspsfrontend.IDelegate) {
    return new libspsfrontend.webRtcPlayerController(config, delegate);
}

document.ontouchmove = (event: TouchEvent) => {
    event.preventDefault();
}

// Create a config object instance 
function CreateConfig(signalingAddress: string, playerElement: string) {
    let config = new libspsfrontend.Config(signalingAddress, playerElement);
    libspsfrontend.Config._enableVerboseLogging = true;
    return config;
}

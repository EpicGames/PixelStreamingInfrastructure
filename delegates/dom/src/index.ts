import 'bootstrap/dist/js/bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/css/bootstrap-grid.min.css'
import 'bootstrap/dist/css/bootstrap-reboot.min.css'
import 'bootstrap/dist/css/bootstrap-utilities.min.css'
import { NativeDOMDelegate } from "./NativeDOMDelegate";
import * as libspsfrontend from '@tensorworks/libspsfrontend';
import favSvg from './assets/images/favicon.svg';
import favPng from './assets/images/favicon.png';
import svgMinimize from './assets/images/Minimize.svg';
import svgMaximize from './assets/images/Maximize.svg';
import svgSettings from './assets/images/Settings.svg';
import svgInfo from './assets/images/Info.svg';

// set the logger level
//libspsfrontend.Logger.SetLoggerVerbosity(10);

// svg icons for favicons and buttons
let faviconSvg = document.getElementById('favSvg') as HTMLLinkElement;
faviconSvg.href = favSvg;
let faviconPng = document.getElementById('favPng') as HTMLLinkElement;
faviconPng.href = favPng;
let maximizeIcon = document.getElementById('maximizeIcon') as HTMLObjectElement;
maximizeIcon.data = svgMaximize;
let minimizeIcon = document.getElementById('minimizeIcon') as HTMLObjectElement;
minimizeIcon.data = svgMinimize;
let settingsIcon = document.getElementById('settingsIcon') as HTMLObjectElement;
settingsIcon.data = svgSettings;
let statsIcon = document.getElementById('statsIcon') as HTMLObjectElement;
statsIcon.data = svgInfo;

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

// prep the player div element 
let playerElement = document.getElementById("player") as HTMLDivElement;

// Create a config object
let config = CreateConfig(signallingServerAddress, playerElement);

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
function CreateConfig(signalingAddress: string, playerElement: HTMLDivElement) {
    let config = new libspsfrontend.Config(signalingAddress, playerElement);
    return config;
}

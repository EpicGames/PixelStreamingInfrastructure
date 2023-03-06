// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * Class definitions
 * TODO: Move these to seperate files once we introduce a bundler
 */
class TwoWayMap {
    constructor(map = {}) {
        this.map = map;
        this.reverseMap = new Map();
        for(const key in map) {
            const value = map[key];
            this.reverseMap[value] = key;
        }
    }

    getFromKey(key) { return this.map[key]; }
    getFromValue(value) { return this.reverseMap[value]; }

    add(key, value) {
        this.map[key] = value;
        this.reverseMap[value] = key;
    }

    remove(key, value) {
        delete this.map[key];
        delete this.reverseMap[value];
    }
}

/**
 * Frontend logic
 */
// Window events for a gamepad connecting
let haveEvents = 'GamepadEvent' in window;
let haveWebkitEvents = 'WebKitGamepadEvent' in window;
let controllers = {};
let rAF = window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.requestAnimationFrame;

let webRtcPlayerObj = null;
let print_stats = false;
let print_inputs = false;
let connect_on_load = false;
let ws;
const WS_OPEN_STATE = 1;

let inputController = null;
let autoPlayAudio = true;
let qualityController = false;
let qualityControlOwnershipCheckBox;
let matchViewportResolution;
let VideoEncoderQP = "N/A";
// TODO: Remove this - workaround because of bug causing UE to crash when switching resolutions too quickly
let lastTimeResized = new Date().getTime();
let resizeTimeout;

let responseEventListeners = new Map();

let freezeFrameOverlay = null;
let shouldShowPlayOverlay = true;

let isFullscreen = false;
let isMuted = false;
// A freeze frame is a still JPEG image shown instead of the video.
let freezeFrame = {
    receiving: false,
    size: 0,
    jpeg: undefined,
    height: 0,
    width: 0,
    valid: false
};

let file = {
    mimetype: "",
    extension: "",
	receiving: false,
    size: 0,
    data: [],
    valid: false,
    timestampStart: undefined
};

// Optionally detect if the user is not interacting (AFK) and disconnect them.
let afk = {
    enabled: false,   // Set to true to enable the AFK system.
    warnTimeout: 120,   // The time to elapse before warning the user they are inactive.
    closeTimeout: 10,   // The time after the warning when we disconnect the user.

    active: false,   // Whether the AFK system is currently looking for inactivity.
    overlay: undefined,   // The UI overlay warning the user that they are inactive.
    warnTimer: undefined,   // The timer which waits to show the inactivity warning overlay.
    countdown: 0,   // The inactivity warning overlay has a countdown to show time until disconnect.
    countdownTimer: undefined,   // The timer used to tick the seconds shown on the inactivity warning overlay.
}

// If the user focuses on a UE input widget then we show them a button to open
// the on-screen keyboard. JavaScript security means we can only show the
// on-screen keyboard in response to a user interaction.
let editTextButton = undefined;

// A hidden input text box which is used only for focusing and opening the
// on-screen keyboard.
let hiddenInput = undefined;

let MaxByteValue = 255;
// The delay between the showing/unshowing of a freeze frame and when the stream will stop/start
// eg showing freeze frame -> delay -> stop stream OR show stream -> delay -> unshow freeze frame
freezeFrameDelay = 50; // ms

let activeKeys = [];

let toStreamerMessages = new TwoWayMap();
let fromStreamerMessages = new TwoWayMap();

const MessageDirection = {
    // A message sent to the streamer. eg Key presses
    // ie player -> streamer
    ToStreamer: 0,

    // A message recevied from the streamer. eg Freeze frames
    // ie streamer -> player
    FromStreamer: 1
};

let toStreamerHandlers = new Map(); // toStreamerHandlers[message](args..)
let fromStreamerHandlers = new Map(); // fromStreamerHandlers[message](args..)
function populateDefaultProtocol() {
    /*
     * Control Messages. Range = 0..49.
     */
    toStreamerMessages.add("IFrameRequest", {
        "id": 0,
        "byteLength": 0,
        "structure": []
    });
    toStreamerMessages.add("RequestQualityControl", {
        "id": 1,
        "byteLength": 0,
        "structure": []
    });
    toStreamerMessages.add("FpsRequest", {
        "id": 2,
        "byteLength": 0,
        "structure": []
    });
    toStreamerMessages.add("AverageBitrateRequest", {
        "id": 3,
        "byteLength": 0,
        "structure": []
    });
    toStreamerMessages.add("StartStreaming", {
        "id": 4,
        "byteLength": 0,
        "structure": []
    });
    toStreamerMessages.add("StopStreaming", {
        "id": 5,
        "byteLength": 0,
        "structure": []
    });
    toStreamerMessages.add("LatencyTest", {
        "id": 6,
        "byteLength": 0,
        "structure": []
    });
    toStreamerMessages.add("RequestInitialSettings", {
        "id": 7,
        "byteLength": 0,
        "structure": []
    });
    toStreamerMessages.add("TestEcho", {
        "id": 8,
        "byteLength": 0,
        "structure": []
    });
    /*
     * Input Messages. Range = 50..89.
     */
    // Generic Input Messages. Range = 50..59.
    toStreamerMessages.add("UIInteraction", {
        "id": 50,
        "byteLength": 0,
        "structure": []
    });
    toStreamerMessages.add("Command", {
        "id": 51,
        "byteLength": 0,
        "structure": []
    });
    // Keyboard Input Message. Range = 60..69.
    toStreamerMessages.add("KeyDown", {
        "id": 60,
        "byteLength": 2,
        //            keyCode  isRepeat
        "structure": ["uint8", "uint8"]
    });
    toStreamerMessages.add("KeyUp", {
        "id": 61,
        "byteLength": 1,
        //            keyCode
        "structure": ["uint8"]
    });
    toStreamerMessages.add("KeyPress", {
        "id": 62,
        "byteLength": 2,
        //            charcode
        "structure": ["uint16"]
    });
    // Mouse Input Messages. Range = 70..79.
    toStreamerMessages.add("MouseEnter", {
        "id": 70,
        "byteLength": 0,
        "structure": []
    });
    toStreamerMessages.add("MouseLeave", {
        "id": 71,
        "byteLength": 0,
        "structure": []
    });
    toStreamerMessages.add("MouseDown", {
        "id": 72,
        "byteLength": 5,
        //              button     x         y
        "structure": ["uint8", "uint16", "uint16"]
    });
    toStreamerMessages.add("MouseUp", {
        "id": 73,
        "byteLength": 5,
        //              button     x         y
        "structure": ["uint8", "uint16", "uint16"]
    });
    toStreamerMessages.add("MouseMove", {
        "id": 74,
        "byteLength": 8,
        //              x           y      deltaX    deltaY
        "structure": ["uint16", "uint16", "int16", "int16"]
    });
    toStreamerMessages.add("MouseWheel", {
        "id": 75,
        "byteLength": 6,
        //              delta       x        y
        "structure": ["int16", "uint16", "uint16"]
    });
    toStreamerMessages.add("MouseDouble", {
        "id": 76,
        "byteLength": 5,
        //              button     x         y
        "structure": ["uint8", "uint16", "uint16"]
    });
    // Touch Input Messages. Range = 80..89.
    toStreamerMessages.add("TouchStart", {
        "id": 80,
        "byteLength": 8,
        //          numtouches(1)   x       y        idx     force     valid
        "structure": ["uint8", "uint16", "uint16", "uint8", "uint8", "uint8"]
    });
    toStreamerMessages.add("TouchEnd", {
        "id": 81,
        "byteLength": 8,
        //          numtouches(1)   x       y        idx     force     valid
        "structure": ["uint8", "uint16", "uint16", "uint8", "uint8", "uint8"]
    });
    toStreamerMessages.add("TouchMove", {
        "id": 82,
        "byteLength": 8,
        //          numtouches(1)   x       y       idx      force     valid
        "structure": ["uint8", "uint16", "uint16", "uint8", "uint8", "uint8"]
    });
    // Gamepad Input Messages. Range = 90..99
    toStreamerMessages.add("GamepadButtonPressed", {
        "id": 90,
        "byteLength": 3,
        //            ctrlerId   button  isRepeat
        "structure": ["uint8", "uint8", "uint8"]
    });
    toStreamerMessages.add("GamepadButtonReleased", {
        "id": 91,
        "byteLength": 3,
        //            ctrlerId   button  isRepeat(0)
        "structure": ["uint8", "uint8", "uint8"]
    });
    toStreamerMessages.add("GamepadAnalog", {
        "id": 92,
        "byteLength": 10,
        //            ctrlerId   button  analogValue
        "structure": ["uint8", "uint8", "double"]
    });

    fromStreamerMessages.add("QualityControlOwnership", 0);
    fromStreamerMessages.add("Response", 1);
    fromStreamerMessages.add("Command", 2);
    fromStreamerMessages.add("FreezeFrame", 3);
    fromStreamerMessages.add("UnfreezeFrame", 4);
    fromStreamerMessages.add("VideoEncoderAvgQP", 5);
    fromStreamerMessages.add("LatencyTest", 6);
    fromStreamerMessages.add("InitialSettings", 7);
    fromStreamerMessages.add("FileExtension", 8);
    fromStreamerMessages.add("FileMimeType", 9);
    fromStreamerMessages.add("FileContents", 10);
    fromStreamerMessages.add("TestEcho", 11);
    fromStreamerMessages.add("InputControlOwnership", 12);
    fromStreamerMessages.add("Protocol", 255);
}

function registerMessageHandlers() {
    registerMessageHandler(MessageDirection.FromStreamer, "QualityControlOwnership", onQualityControlOwnership);
    registerMessageHandler(MessageDirection.FromStreamer, "Response", onResponse);
    registerMessageHandler(MessageDirection.FromStreamer, "Command", onCommand);
    registerMessageHandler(MessageDirection.FromStreamer, "FreezeFrame", onFreezeFrameMessage);
    registerMessageHandler(MessageDirection.FromStreamer, "UnfreezeFrame", invalidateFreezeFrameOverlay);
    registerMessageHandler(MessageDirection.FromStreamer, "VideoEncoderAvgQP", onVideoEncoderAvgQP);
    registerMessageHandler(MessageDirection.FromStreamer, "LatencyTest", onLatencyTestMessage);
    registerMessageHandler(MessageDirection.FromStreamer, "InitialSettings", onInitialSettings);
    registerMessageHandler(MessageDirection.FromStreamer, "FileExtension", onFileExtension);
    registerMessageHandler(MessageDirection.FromStreamer, "FileMimeType", onFileMimeType);
    registerMessageHandler(MessageDirection.FromStreamer, "FileContents", onFileContents);
    registerMessageHandler(MessageDirection.FromStreamer, "TestEcho", () => {/* Do nothing */ });
    registerMessageHandler(MessageDirection.FromStreamer, "InputControlOwnership", onInputControlOwnership);
    registerMessageHandler(MessageDirection.FromStreamer, "Protocol", onProtocolMessage);

    registerMessageHandler(MessageDirection.ToStreamer, "IFrameRequest", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "RequestQualityControl", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "FpsRequest", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "AverageBitrateRequest", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "StartStreaming", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "StopStreaming", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "LatencyTest", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "RequestInitialSettings", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "TestEcho", () => { /* Do nothing */});
    registerMessageHandler(MessageDirection.ToStreamer, "UIInteraction", emitUIInteraction);
    registerMessageHandler(MessageDirection.ToStreamer, "Command", emitCommand);
    registerMessageHandler(MessageDirection.ToStreamer, "KeyDown", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "KeyUp", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "KeyPress", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "MouseEnter", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "MouseLeave", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "MouseDown", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "MouseUp", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "MouseMove", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "MouseWheel", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "MouseDouble", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "TouchStart", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "TouchEnd", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "TouchMove", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "GamepadButtonPressed", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "GamepadButtonReleased", sendMessageToStreamer);
    registerMessageHandler(MessageDirection.ToStreamer, "GamepadAnalog", sendMessageToStreamer);
}

function registerMessageHandler(messageDirection, messageType, messageHandler) {
    switch (messageDirection) {
        case MessageDirection.ToStreamer:
            toStreamerHandlers[messageType] = messageHandler;
            break;
        case MessageDirection.FromStreamer:
            fromStreamerHandlers[messageType] = messageHandler;
            break;
        default:
            console.log(`Unknown message direction ${messageDirection}`);
    }
}

function onQualityControlOwnership(data) {
    let view = new Uint8Array(data);
    let ownership = view[1] === 0 ? false : true;
    console.log("Received quality controller message, will control quality: " + ownership);
    qualityController = ownership;
    // If we own the quality control, we can't relinquish it. We only lose
    // quality control when another peer asks for it
    if (qualityControlOwnershipCheckBox !== null) {
        qualityControlOwnershipCheckBox.disabled = ownership;
        qualityControlOwnershipCheckBox.checked = ownership;
    }
}

function onResponse(data) {
    let response = new TextDecoder("utf-16").decode(data.slice(1));
    for (let listener of responseEventListeners.values()) {
        listener(response);
    }
}

function onCommand(data) {
    let commandAsString = new TextDecoder("utf-16").decode(data.slice(1));
    console.log(commandAsString);
    let command = JSON.parse(commandAsString);
    if (command.command === 'onScreenKeyboard') {
        showOnScreenKeyboard(command);
    }
}

function onFreezeFrameMessage(data) {
    let view = new Uint8Array(data);
    processFreezeFrameMessage(view);
}

function onVideoEncoderAvgQP(data) {
    VideoEncoderQP = new TextDecoder("utf-16").decode(data.slice(1));
}

function onLatencyTestMessage(data) {
    let latencyTimingsAsString = new TextDecoder("utf-16").decode(data.slice(1));
    console.log("Got latency timings from UE.");
    console.log(latencyTimingsAsString);
    let latencyTimingsFromUE = JSON.parse(latencyTimingsAsString);
    if (webRtcPlayerObj) {
        webRtcPlayerObj.latencyTestTimings.SetUETimings(latencyTimingsFromUE);
    }
}

function onInitialSettings(data) {
    let settingsString = new TextDecoder("utf-16").decode(data.slice(1));
    let settingsJSON = JSON.parse(settingsString);

    if (settingsJSON.PixelStreaming) {
        let allowConsoleCommands = settingsJSON.PixelStreaming.AllowPixelStreamingCommands;
        if (allowConsoleCommands === false) {
            console.warn("-AllowPixelStreamingCommands=false, sending arbitray console commands from browser to UE is disabled.");
        }
        let disableLatencyTest = settingsJSON.PixelStreaming.DisableLatencyTest;
        if (disableLatencyTest) {
            document.getElementById("test-latency-button").disabled = true;
            document.getElementById("test-latency-button").title = "Disabled by -PixelStreamingDisableLatencyTester=true";
            console.warn("-PixelStreamingDisableLatencyTester=true, requesting latency report from the the browser to UE is disabled.");
        }
    }
    if (settingsJSON.Encoder) {
        document.getElementById('encoder-min-qp-text').value = settingsJSON.Encoder.MinQP;
        document.getElementById('encoder-max-qp-text').value = settingsJSON.Encoder.MaxQP;
    }
    if (settingsJSON.WebRTC) {
        document.getElementById("webrtc-fps-text").value = settingsJSON.WebRTC.FPS;
        // reminder bitrates are sent in bps but displayed in kbps
        document.getElementById("webrtc-min-bitrate-text").value = settingsJSON.WebRTC.MinBitrate / 1000;
        document.getElementById("webrtc-max-bitrate-text").value = settingsJSON.WebRTC.MaxBitrate / 1000;
    }
}

function onFileExtension(data) {
    let view = new Uint8Array(data);
    processFileExtension(view);
}

function onFileMimeType(data) {
    let view = new Uint8Array(data);
    processFileMimeType(view);
}

function onFileContents(data) {
    let view = new Uint8Array(data);
    processFileContents(view);
}

function onInputControlOwnership(data) {
    let view = new Uint8Array(data);
    let ownership = view[1] === 0 ? false : true;
    console.log("Received input controller message - will your input control the stream: " + ownership);
    inputController = ownership;
}

function onProtocolMessage(data) {
    try {
        let protocolString = new TextDecoder("utf-16").decode(data.slice(1));
        let protocolJSON = JSON.parse(protocolString);
        if (!protocolJSON.hasOwnProperty("Direction")) {
            throw new Error('Malformed protocol received. Ensure the protocol message contains a direction');
        }
        let direction = protocolJSON.Direction;
        delete protocolJSON.Direction;
        console.log(`Received new ${ direction == MessageDirection.FromStreamer ? "FromStreamer" : "ToStreamer" } protocol. Updating existing protocol...`);
        Object.keys(protocolJSON).forEach((messageType) => {
            let message = protocolJSON[messageType];
            switch (direction) {
                case MessageDirection.ToStreamer:
                    // Check that the message contains all the relevant params
                    if (!message.hasOwnProperty("id") || !message.hasOwnProperty("byteLength")) {
                        console.error(`ToStreamer->${messageType} protocol definition was malformed as it didn't contain at least an id and a byteLength\n
                                       Definition was: ${JSON.stringify(message, null, 2)}`);
                        // return in a forEach is equivalent to a continue in a normal for loop
                        return;
                    }
                    if(message.byteLength > 0 && !message.hasOwnProperty("structure")) {
                        // If we specify a bytelength, will must have a corresponding structure
                        console.error(`ToStreamer->${messageType} protocol definition was malformed as it specified a byteLength but no accompanying structure`);
                        // return in a forEach is equivalent to a continue in a normal for loop
                        return;
                    }

					if(messageType === "GamepadAnalog") {
						// We don't want to update the GamepadAnalog message type as UE sends it with an incorrect bytelength
						return;
					}

                    if (toStreamerHandlers[messageType]) {
                        // If we've registered a handler for this message type we can add it to our supported messages. ie registerMessageHandler(...)
                        toStreamerMessages.add(messageType, message);
                    } else {
                        console.error(`There was no registered handler for "${messageType}" - try adding one using registerMessageHandler(MessageDirection.ToStreamer, "${messageType}", myHandler)`);
                    }
                    break;
                case MessageDirection.FromStreamer:
                    // Check that the message contains all the relevant params
                    if (!message.hasOwnProperty("id")) {
                        console.error(`FromStreamer->${messageType} protocol definition was malformed as it didn't contain at least an id\n
                        Definition was: ${JSON.stringify(message, null, 2)}`);
                        // return in a forEach is equivalent to a continue in a normal for loop
                        return;
                    }
                    if (fromStreamerHandlers[messageType]) {
                        // If we've registered a handler for this message type. ie registerMessageHandler(...)
                        fromStreamerMessages.add(messageType, message.id);
                    } else {
                        console.error(`There was no registered handler for "${message}" - try adding one using registerMessageHandler(MessageDirection.FromStreamer, "${messageType}", myHandler)`);
                    }
                    break;
                default:
                    throw new Error(`Unknown direction: ${direction}`);
            }
        });

        // Once the protocol has been received, we can send our control messages
        requestInitialSettings();
        requestQualityControl();
    } catch (e) {
        console.log(e);
    }
}

// https://w3c.github.io/gamepad/#remapping
const gamepadLayout = {
    // Buttons
    RightClusterBottomButton: 0,
    RightClusterRightButton: 1,
    RightClusterLeftButton: 2,
    RightClusterTopButton: 3,
    LeftShoulder: 4,
    RightShoulder: 5,
    LeftTrigger: 6,
    RightTrigger: 7,
    SelectOrBack: 8,
    StartOrForward: 9,
    LeftAnalogPress: 10,
    RightAnalogPress: 11,
    LeftClusterTopButton: 12,
    LeftClusterBottomButton: 13,
    LeftClusterLeftButton: 14,
    LeftClusterRightButton: 15,
    CentreButton: 16,
    // Axes
    LeftStickHorizontal: 0,
    LeftStickVertical: 1,
    RightStickHorizontal: 2,
    RightStickVertical: 3
};

function scanGamepads() {
    let gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] && (gamepads[i].index in controllers)) {
            controllers[gamepads[i].index].currentState = gamepads[i];
        }
    }
}

function updateStatus() {
    scanGamepads();
    // Iterate over multiple controllers in the case the mutiple gamepads are connected
    for (let j in controllers) {
        let controller = controllers[j];
        let currentState = controller.currentState;
        let prevState = controller.prevState;
        // Iterate over buttons
        for (let i = 0; i < currentState.buttons.length; i++) {
            let currButton = currentState.buttons[i];
            let prevButton = prevState.buttons[i];
            if (currButton.pressed) {
                // press
                if (i == gamepadLayout.LeftTrigger) {
                    //                       UEs left analog has a button index of 5
                    toStreamerHandlers.GamepadAnalog("GamepadAnalog", [j, 5, currButton.value]);
                } else if (i == gamepadLayout.RightTrigger) {
                    //                       UEs right analog has a button index of 6
                    toStreamerHandlers.GamepadAnalog("GamepadAnalog", [j, 6, currButton.value]);
                } else {
                    toStreamerHandlers.GamepadButtonPressed("GamepadButtonPressed", [j, i, prevButton.pressed]);
                }
            } else if (!currButton.pressed && prevButton.pressed) {
                // release
                if (i == gamepadLayout.LeftTrigger) {
                    //                       UEs left analog has a button index of 5
                    toStreamerHandlers.GamepadAnalog("GamepadAnalog", [j, 5, 0]);
                } else if (i == gamepadLayout.RightTrigger) {
                    //                       UEs right analog has a button index of 6
                    toStreamerHandlers.GamepadAnalog("GamepadAnalog", [j, 6, 0]);
                } else {
                    toStreamerHandlers.GamepadButtonReleased("GamepadButtonReleased", [j, i]);
                }
            }
        }
        // Iterate over gamepad axes (we will increment in lots of 2 as there is 2 axes per stick)
        for (let i = 0; i < currentState.axes.length; i += 2) {
            // Horizontal axes are even numbered
            let x = parseFloat(currentState.axes[i].toFixed(4));

            // Vertical axes are odd numbered
            // https://w3c.github.io/gamepad/#remapping Gamepad browser side standard mapping has positive down, negative up. This is downright disgusting. So we fix it.
            let y = -parseFloat(currentState.axes[i + 1].toFixed(4));

            // UE's analog axes follow the same order as the browsers, but start at index 1 so we will offset as such
            toStreamerHandlers.GamepadAnalog("GamepadAnalog", [j, i + 1, x]); // Horizontal axes, only offset by 1
            toStreamerHandlers.GamepadAnalog("GamepadAnalog", [j, i + 2, y]); // Vertical axes, offset by two (1 to match UEs axes convention and then another 1 for the vertical axes)
        }
        controllers[j].prevState = currentState;
    }
    rAF(updateStatus);
}

function gamepadConnectHandler(e) {
    console.log("Gamepad connect handler");
    gamepad = e.gamepad;
    controllers[gamepad.index] = {};
    controllers[gamepad.index].currentState = gamepad;
    controllers[gamepad.index].prevState = gamepad;
    console.log("Gamepad: " + gamepad.id + " connected");
    rAF(updateStatus);
}

function gamepadDisconnectHandler(e) {
    console.log("Gamepad disconnect handler");
    console.log("Gamepad: " + e.gamepad.id + " disconnected");
    delete controllers[e.gamepad.index];
}


function fullscreen() {
    // if already full screen; exit
  // else go fullscreen
  if (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  ) {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  } else {
    let element;
    //HTML elements controls
    if(!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) {
        // Chrome and FireFox on iOS can only fullscreen a <video>
        element = document.getElementById("streamingVideo");
    } else {
        // Everywhere else can fullscreen a <div>
        element = document.getElementById("playerUI");
    }
    if(!element) {
        return;
    }
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    } else if (element.webkitEnterFullscreen) {
      element.webkitEnterFullscreen(); //for iphone this code worked
    }
  }
  onFullscreenChange()
}

function onFullscreenChange() {
	isFullscreen = (document.webkitIsFullScreen 
		|| document.mozFullScreen 
		|| (document.msFullscreenElement && document.msFullscreenElement !== null) 
		|| (document.fullscreenElement && document.fullscreenElement !== null));

	let minimize = document.getElementById('minimize');
    let maximize = document.getElementById('maximize');
	if(minimize && maximize){
        if(isFullscreen) {
            minimize.style.display = 'inline';
            maximize.style.display = 'none';
        } else {
            minimize.style.display = 'none';
            maximize.style.display = 'inline';
        }
	}
}

function parseURLParams() {
    let urlParams = new URLSearchParams(window.location.search);
    inputOptions.controlScheme = (urlParams.has('hoveringMouse') ?  ControlSchemeType.HoveringMouse : ControlSchemeType.LockedMouse);
    let schemeToggle = document.getElementById("control-scheme-text");
    switch (inputOptions.controlScheme) {
        case ControlSchemeType.HoveringMouse:
            schemeToggle.innerHTML = "Control Scheme: Hovering Mouse";
            break;
        case ControlSchemeType.LockedMouse:
            schemeToggle.innerHTML = "Control Scheme: Locked Mouse";
            break;
        default:
            schemeToggle.innerHTML = "Control Scheme: Locked Mouse";
            console.log(`ERROR: Unknown control scheme ${inputOptions.controlScheme}, defaulting to Locked Mouse`);
            break;
    }

    if(urlParams.has('noWatermark')) {
        let watermark = document.getElementById("unrealengine");
        watermark.style.display = 'none';
    }

    inputOptions.hideBrowserCursor = (urlParams.has('hideBrowserCursor') ?  true : false);
}


function setupHtmlEvents() {
    //Window events
    window.addEventListener('resize', resizePlayerStyle, true);
    window.addEventListener('orientationchange', onOrientationChange);

    //Gamepad events
    if (haveEvents) {
        window.addEventListener("gamepadconnected", gamepadConnectHandler);
        window.addEventListener("gamepaddisconnected", gamepadDisconnectHandler);
    } else if (haveWebkitEvents) {
        window.addEventListener("webkitgamepadconnected", gamepadConnectHandler);
        window.addEventListener("webkitgamepaddisconnected", gamepadDisconnectHandler);
    }

    document.addEventListener('webkitfullscreenchange', onFullscreenChange, false);
    document.addEventListener('mozfullscreenchange', onFullscreenChange, false);
    document.addEventListener('fullscreenchange', onFullscreenChange, false);
    document.addEventListener('MSFullscreenChange', onFullscreenChange, false);

    let settingsBtn = document.getElementById('settingsBtn');
    settingsBtn.addEventListener('click', settingsClicked);

    let statsBtn = document.getElementById('statsBtn');
    statsBtn.addEventListener('click', statsClicked);

    let controlBtn = document.getElementById('control-tgl');
    controlBtn.addEventListener('change', toggleControlScheme);

    let cursorBtn = document.getElementById('cursor-tgl');
    cursorBtn.addEventListener('change', toggleBrowserCursorVisibility);

    let resizeCheckBox = document.getElementById('enlarge-display-to-fill-window-tgl');
    if (resizeCheckBox !== null) {
        resizeCheckBox.onchange = function(event) {
            resizePlayerStyle();
        };
    }

    qualityControlOwnershipCheckBox = document.getElementById('quality-control-ownership-tgl');
    if (qualityControlOwnershipCheckBox !== null) {
        qualityControlOwnershipCheckBox.onchange = function(event) {
            requestQualityControl();
        };
    }

    let encoderParamsSubmit = document.getElementById('encoder-params-submit');
    if (encoderParamsSubmit !== null) {
        encoderParamsSubmit.onclick = function(event) {

            let minQP = document.getElementById('encoder-min-qp-text').value;
            let maxQP = document.getElementById('encoder-max-qp-text').value;

            emitCommand({ "Encoder.MinQP": minQP });
            emitCommand({ "Encoder.MaxQP": maxQP });
        };
    }

    let webrtcParamsSubmit = document.getElementById('webrtc-params-submit');
    if (webrtcParamsSubmit !== null) {
        webrtcParamsSubmit.onclick = function(event) {
            let FPS = document.getElementById('webrtc-fps-text').value;
            let minBitrate = document.getElementById('webrtc-min-bitrate-text').value * 1000;
            let maxBitrate = document.getElementById('webrtc-max-bitrate-text').value * 1000;

            emitCommand({ 'WebRTC.Fps': FPS });
            emitCommand({ 'WebRTC.MinBitrate': minBitrate });
            emitCommand({ 'WebRTC.MaxBitrate': maxBitrate });
        };
    }

    let showFPSButton = document.getElementById('show-fps-button');
    if (showFPSButton !== null) {
        showFPSButton.onclick = function (event) {
            emitCommand({ "Stat.FPS": '' });
        };
    }

    let requestKeyframeButton = document.getElementById('request-keyframe-button');
    if (requestKeyframeButton !== null) {
        requestKeyframeButton.onclick = function (event) {
            toStreamerHandlers.IFrameRequest("IFrameRequest");
        };
    }

    let restartStreamButton = document.getElementById('restart-stream-button');
    if (restartStreamButton !== null) {
        restartStreamButton.onmousedown = function (event) {
            restartStream();
        };
    }

    let matchViewportResolutionCheckBox = document.getElementById('match-viewport-res-tgl');
    if (matchViewportResolutionCheckBox !== null) {
        matchViewportResolutionCheckBox.onchange = function (event) {
            matchViewportResolution = matchViewportResolutionCheckBox.checked;
            updateVideoStreamSize();
        };
    }

    let statsCheckBox = document.getElementById('show-stats-tgl');
    if (statsCheckBox !== null) {
        statsCheckBox.onchange = function(event) {
            let stats = document.getElementById('statsContainer');
            stats.style.display = event.target.checked ? "block" : "none";
        };
    }

    let latencyButton = document.getElementById('test-latency-button');
    if (latencyButton) {
        latencyButton.onclick = () => {
            sendStartLatencyTest();
        };
    }

    // Setup toggle and pair with some URL query string param.
    setupToggleWithUrlParams("prefer-sfu-tgl", "preferSFU");
    setupToggleWithUrlParams("use-mic-tgl", "useMic");
    setupToggleWithUrlParams("force-turn-tgl", "ForceTURN");
    setupToggleWithUrlParams("force-mono-tgl", "ForceMonoAudio");
    setupToggleWithUrlParams("control-tgl", "hoveringMouse");
    setupToggleWithUrlParams("cursor-tgl", "hideBrowserCursor");
    setupToggleWithUrlParams("offer-receive-tgl", "offerToReceive");


    var streamSelector = document.getElementById('stream-select');
    var trackSelector = document.getElementById('track-select');
    if (streamSelector) {
        streamSelector.onchange = function(event) {
            const stream = webRtcPlayerObj.availableVideoStreams.get(streamSelector.value);
            webRtcPlayerObj.video.srcObject = stream;
            streamTrackSource = stream;
            webRtcPlayerObj.video.play();
            updateTrackList();
        }

        if (trackSelector) {
            trackSelector.onchange = function(event) {
                if (!streamTrackSource) {
                    streamTrackSource = webRtcPlayerObj.availableVideoStreams.get(streamSelector.value);
                }
                if (streamTrackSource) {
                    for (const track of streamTrackSource.getVideoTracks()) {
                        if (track.id == trackSelector.value) {
                            webRtcPlayerObj.video.srcObject = new MediaStream([track]);
                            webRtcPlayerObj.video.play();
                            streamSelector.value = "";
                            break;
                        }
                    }
                }
            }
        }
    }
}

function setupToggleWithUrlParams(toggleId, urlParameterKey){
    let toggleElem = document.getElementById(toggleId);
    if(toggleElem) {
        toggleElem.checked = new URLSearchParams(window.location.search).has(urlParameterKey);
        toggleElem.addEventListener('change', (event) => {
            const urlParams = new URLSearchParams(window.location.search);
            if (event.currentTarget.checked) {
                urlParams.set(urlParameterKey, "true");
            } else {
                urlParams.delete(urlParameterKey);
            }
            window.history.replaceState({}, '', urlParams.toString() !== "" ? `${location.pathname}?${urlParams}` : `${location.pathname}`);
        });
    }
}

function UrlParamsCheck(urlParameterKey) {
    return new URLSearchParams(window.location.search).has(urlParameterKey);
}

var streamTrackSource = null;

function updateStreamList() {
    const streamSelector = document.getElementById('stream-select');
    for (let i = streamSelector.options.length - 1; i >= 0; i--) {
        streamSelector.remove(i);
    }
    streamSelector.value = null;
    for (const [streamId, stream] of webRtcPlayerObj.availableVideoStreams) {
        var opt = document.createElement('option');
        opt.value = streamId;
        opt.innerHTML = streamId;
        streamSelector.appendChild(opt);
        if (streamSelector.value == null) {
            streamSelector.value = streamId;
        }
    }

    updateTrackList();
}

function updateTrackList() {
    const streamSelector = document.getElementById('stream-select');
    const trackSelector = document.getElementById('track-select');
    const stream = webRtcPlayerObj.availableVideoStreams.get(streamSelector.value);
    for (let i = trackSelector.options.length - 1; i >= 0; i--) {
        trackSelector.remove(i);
    }
    trackSelector.value = null;
    for (const track of stream.getVideoTracks()) {
        var opt = document.createElement('option');
        opt.value = track.id;
        opt.innerHTML = track.label;
        trackSelector.appendChild(opt);
        if (track.selected) {
            trackSelector.value = track.id;
        }
    }
}

function sendStartLatencyTest() {
    // We need WebRTC to be active to do a latency test.
    if (!webRtcPlayerObj) {
        return;
    }

    let onTestStarted = function(StartTimeMs) {
        let descriptor = {
            StartTime: StartTimeMs
        };
        emitDescriptor("LatencyTest", descriptor);
    };

    webRtcPlayerObj.startLatencyTest(onTestStarted);
}

function setOverlay(htmlClass, htmlElement, onClickFunction) {
    let videoPlayOverlay = document.getElementById('videoPlayOverlay');
    if (!videoPlayOverlay) {
        let playerDiv = document.getElementById('player');
        videoPlayOverlay = document.createElement('div');
        videoPlayOverlay.id = 'videoPlayOverlay';
        playerDiv.appendChild(videoPlayOverlay);
    }

    // Remove existing html child elements so we can add the new one
    while (videoPlayOverlay.lastChild) {
        videoPlayOverlay.removeChild(videoPlayOverlay.lastChild);
    }

    if (htmlElement)
        videoPlayOverlay.appendChild(htmlElement);

    if (onClickFunction) {
        videoPlayOverlay.addEventListener('click', function onOverlayClick(event) {
            onClickFunction(event);
            videoPlayOverlay.removeEventListener('click', onOverlayClick);
        });
    }

    // Remove existing html classes so we can set the new one
    let cl = videoPlayOverlay.classList;
    for (let i = cl.length - 1; i >= 0; i--) {
        cl.remove(cl[i]);
    }

    videoPlayOverlay.classList.add(htmlClass);
}

function showConnectOverlay() {
    let startText = document.createElement('div');
    startText.id = 'playButton';
    startText.innerHTML = 'Click to start'.toUpperCase();

    setOverlay('clickableState', startText, event => {
        connect();
        startAfkWarningTimer();
    });
}

function showTextOverlay(text) {
    let textOverlay = document.createElement('div');
    textOverlay.id = 'messageOverlay';
    textOverlay.innerHTML = text ? text : '';
    setOverlay('textDisplayState', textOverlay);
}

function playStream() {
    if(webRtcPlayerObj && webRtcPlayerObj.video) {
        if(webRtcPlayerObj.audio.srcObject && autoPlayAudio) {
            // Video and Audio are seperate tracks
            webRtcPlayerObj.audio.play().then(() => {
                // audio play has succeeded, start playing video
                playVideo();
            }).catch((onRejectedReason) => {
                console.error(onRejectedReason);
                console.log("Browser does not support autoplaying audio without interaction - to resolve this we are going to show the play button overlay.")
                showPlayOverlay();
            });
        } else {
            // Video and audio are combined in the video element
            playVideo();
        }
        showFreezeFrameOverlay();
        hideOverlay();
    }
}

function playVideo() {
    webRtcPlayerObj.video.play().catch((onRejectedReason) => {
        if(webRtcPlayerObj.audio.srcObject) {
            webRtcPlayerObj.audio.stop();
        }
        console.error(onRejectedReason);
        console.log("Browser does not support autoplaying video without interaction - to resolve this we are going to show the play button overlay.")
        showPlayOverlay();
    });
}

function showPlayOverlay() {
    let img = document.createElement('img');
    img.id = 'playButton';
    img.src = '/images/Play.png';
    img.alt = 'Start Streaming';
    setOverlay('clickableState', img, event => {
        playStream();
    });
    shouldShowPlayOverlay = false;
}

function updateAfkOverlayText() {
    afk.overlay.innerHTML = '<center>No activity detected<br>Disconnecting in ' + afk.countdown + ' seconds<br>Click to continue<br></center>';
}

function showAfkOverlay() {
    // Pause the timer while the user is looking at the inactivity warning overlay.
    stopAfkWarningTimer();

    // Show the inactivity warning overlay.
    afk.overlay = document.createElement('div');
    afk.overlay.id = 'afkOverlay';
    setOverlay('clickableState', afk.overlay, event => {
        // The user clicked so start the timer again and carry on.
        hideOverlay();
        clearInterval(afk.countdownTimer);
        startAfkWarningTimer();
    });

    afk.countdown = afk.closeTimeout;
    updateAfkOverlayText();

    if (inputOptions.controlScheme == ControlSchemeType.LockedMouse && document.exitPointerLock) {
        document.exitPointerLock();
    }

    afk.countdownTimer = setInterval(function() {
        afk.countdown--;
        if (afk.countdown == 0) {
            // The user failed to click so disconnect them.
            hideOverlay();
            ws.close();
        } else {
            // Update the countdown message.
            updateAfkOverlayText();
        }
    }, 1000);
}

function hideOverlay() {
    setOverlay('hiddenState');
}

// Start a timer which when elapsed will warn the user they are inactive.
function startAfkWarningTimer() {
    afk.active = afk.enabled;
    resetAfkWarningTimer();
}

// Stop the timer which when elapsed will warn the user they are inactive.
function stopAfkWarningTimer() {
    afk.active = false;
}

// If the user interacts then reset the warning timer.
function resetAfkWarningTimer() {
    if (afk.active) {
        clearTimeout(afk.warnTimer);
        afk.warnTimer = setTimeout(function () {
            showAfkOverlay();
        }, afk.warnTimeout * 1000);
    }
}

function createWebRtcOffer() {
    if (webRtcPlayerObj) {
        console.log('Creating offer');
        showTextOverlay('Starting connection to server, please wait');
        webRtcPlayerObj.createOffer();
    } else {
        console.log('WebRTC player not setup, cannot create offer');
        showTextOverlay('Unable to setup video');
    }
}

function sendInputData(data) {
    if (webRtcPlayerObj) {
        resetAfkWarningTimer();
        webRtcPlayerObj.send(data);
    }
}

function addResponseEventListener(name, listener) {
    responseEventListeners.set(name, listener);
}

function removeResponseEventListener(name) {
    responseEventListeners.delete(name);
}

function showFreezeFrame() {
    let base64 = btoa(freezeFrame.jpeg.reduce((data, byte) => data + String.fromCharCode(byte), ''));
    let freezeFrameImage = document.getElementById("freezeFrameOverlay").childNodes[0];
    freezeFrameImage.src = 'data:image/jpeg;base64,' + base64;
    freezeFrameImage.onload = function () {
        freezeFrame.height = freezeFrameImage.naturalHeight;
        freezeFrame.width = freezeFrameImage.naturalWidth;
        resizeFreezeFrameOverlay();
        if (shouldShowPlayOverlay) {
            showPlayOverlay();
            resizePlayerStyle();
        } else {
            showFreezeFrameOverlay();
        }
        setTimeout(() => {
            webRtcPlayerObj.setVideoEnabled(false);
        }, freezeFrameDelay);
    };
}

function processFileExtension(view) {
    // Reset file if we got a file message and we are not "receiving" it yet
    if (!file.receiving) {
        file.mimetype = "";
        file.extension = "";
        file.receiving = true;
        file.valid = false;
        file.size = 0;
        file.data = [];
        file.timestampStart = (new Date()).getTime();
        console.log('Received first chunk of file');
    }

    let extensionAsString = new TextDecoder("utf-16").decode(view.slice(1));
    console.log(extensionAsString);
    file.extension = extensionAsString;
}

function processFileMimeType(view) {
    // Reset file if we got a file message and we are not "receiving" it yet
    if (!file.receiving) {
        file.mimetype = "";
        file.extension = "";
        file.receiving = true;
        file.valid = false;
        file.size = 0;
        file.data = [];
        file.timestampStart = (new Date()).getTime();
        console.log('Received first chunk of file');
    }

    let mimeAsString = new TextDecoder("utf-16").decode(view.slice(1));
    console.log(mimeAsString);
    file.mimetype = mimeAsString;
}


function processFileContents(view) {
    // If we haven't received the intial setup instructions, return
    if (!file.receiving) return;

    // Extract the toal size of the file (across all chunks)
    file.size = Math.ceil((new DataView(view.slice(1, 5).buffer)).getInt32(0, true) / 16379 /* The maximum number of payload bits per message*/);

    // Get the file part of the payload
    let fileBytes = view.slice(1 + 4);

    // Append to existing data that holds the file
    file.data.push(fileBytes);

    // Uncomment for debug
    console.log(`Received file chunk: ${file.data.length}/${file.size}`);

    if (file.data.length === file.size) {
        file.receiving = false;
        file.valid = true;
        console.log("Received complete file");
        const transferDuration = ((new Date()).getTime() - file.timestampStart);
        const transferBitrate = Math.round(file.size * 16 * 1024 / transferDuration);
        console.log(`Average transfer bitrate: ${transferBitrate}kb/s over ${transferDuration / 1000} seconds`);

        // File reconstruction
        /**
         * Example code to reconstruct the file
         * 
         * This code reconstructs the received data into the original file based on the mime type and extension provided and then downloads the reconstructed file
         */
        var received = new Blob(file.data, { type: file.mimetype });
        var a = document.createElement('a');
        a.setAttribute('href', URL.createObjectURL(received));
        a.setAttribute('download', `transfer.${file.extension}`);
        document.body.append(a);
        // if you are so inclined to make it auto-download, do something like: a.click();
        a.remove();
    }
    else if (file.data.length > file.size) {
        file.receiving = false;
        console.error(`Received bigger file than advertised: ${file.data.length}/${file.size}`);
    }
}

function processFreezeFrameMessage(view) {
    // Reset freeze frame if we got a freeze frame message and we are not "receiving" yet.
    if (!freezeFrame.receiving) {
        freezeFrame.receiving = true;
        freezeFrame.valid = false;
        freezeFrame.size = 0;
        freezeFrame.jpeg = undefined;
    }

    // Extract total size of freeze frame (across all chunks)
    freezeFrame.size = (new DataView(view.slice(1, 5).buffer)).getInt32(0, true);

    // Get the jpeg part of the payload
    let jpegBytes = view.slice(1 + 4);

    // Append to existing jpeg that holds the freeze frame
    if (freezeFrame.jpeg) {
        let jpeg = new Uint8Array(freezeFrame.jpeg.length + jpegBytes.length);
        jpeg.set(freezeFrame.jpeg, 0);
        jpeg.set(jpegBytes, freezeFrame.jpeg.length);
        freezeFrame.jpeg = jpeg;
    }
    // No existing freeze frame jpeg, make one
    else {
        freezeFrame.jpeg = jpegBytes;
        freezeFrame.receiving = true;
        console.log(`received first chunk of freeze frame: ${freezeFrame.jpeg.length}/${freezeFrame.size}`);
    }

    // Uncomment for debug
    //console.log(`Received freeze frame chunk: ${freezeFrame.jpeg.length}/${freezeFrame.size}`);

    // Finished receiving freeze frame, we can show it now
    if (freezeFrame.jpeg.length === freezeFrame.size) {
        freezeFrame.receiving = false;
        freezeFrame.valid = true;
        console.log(`received complete freeze frame ${freezeFrame.size}`);
        showFreezeFrame();
    }
    // We received more data than the freeze frame payload message indicate (this is an error)
    else if (freezeFrame.jpeg.length > freezeFrame.size) {
        console.error(`received bigger freeze frame than advertised: ${freezeFrame.jpeg.length}/${freezeFrame.size}`);
        freezeFrame.jpeg = undefined;
        freezeFrame.receiving = false;
    }
}

function setupWebRtcPlayer(htmlElement, config) {
    webRtcPlayerObj = new webRtcPlayer(config);
    autoPlayAudio = typeof config.autoPlayAudio !== 'undefined' ? config.autoPlayAudio : true;
    htmlElement.appendChild(webRtcPlayerObj.video);
    htmlElement.appendChild(webRtcPlayerObj.audio);
    htmlElement.appendChild(freezeFrameOverlay);

    webRtcPlayerObj.onWebRtcOffer = function(offer) {
        if (ws && ws.readyState === WS_OPEN_STATE) {
            let offerStr = JSON.stringify(offer);
            console.log("%c[Outbound SS message (offer)]", "background: lightgreen; color: black", offer);
            ws.send(offerStr);
        }
    };

    webRtcPlayerObj.onWebRtcCandidate = function(candidate) {
        if (ws && ws.readyState === WS_OPEN_STATE) {
            ws.send(JSON.stringify({
                type: 'iceCandidate',
                candidate: candidate
            }));
        }
    };

    webRtcPlayerObj.onWebRtcAnswer = function (answer) {
        if (ws && ws.readyState === WS_OPEN_STATE) {
            let answerStr = JSON.stringify(answer);
            console.log("%c[Outbound SS message (answer)]", "background: lightgreen; color: black", answer);
            ws.send(answerStr);

            if (webRtcPlayerObj.sfu) {
                // Send data channel setup request to the SFU
                const requestMsg = { type: "dataChannelRequest" };
                console.log("%c[Outbound SS message (dataChannelRequest)]", "background: lightgreen; color: black", requestMsg);
                ws.send(JSON.stringify(requestMsg));
            }
        }
    };

    webRtcPlayerObj.onSFURecvDataChannelReady = function() {
        if (webRtcPlayerObj.sfu) {
            // Send SFU a message to let it know browser data channels are ready
            const requestMsg = { type: "peerDataChannelsReady" };
            console.log("%c[Outbound SS message (peerDataChannelsReady)]", "background: lightgreen; color: black", requestMsg);
            ws.send(JSON.stringify(requestMsg));
        }
    }

    webRtcPlayerObj.onVideoInitialised = function() {
        if (ws && ws.readyState === WS_OPEN_STATE) {
            if (shouldShowPlayOverlay) {
                showPlayOverlay();
                resizePlayerStyle();
            }
            else {
                resizePlayerStyle();
                playStream();
            }
        }
    };

    webRtcPlayerObj.onNewVideoTrack = function (streams) {
        if (webRtcPlayerObj.video && webRtcPlayerObj.video.srcObject && webRtcPlayerObj.onVideoInitialised) {
            webRtcPlayerObj.onVideoInitialised();
        }
        updateStreamList();
    }

    webRtcPlayerObj.onDataChannelMessage = function(data) {
        let view = new Uint8Array(data);
        try {
            let messageType = fromStreamerMessages.getFromValue(view[0]);
            fromStreamerHandlers[messageType](data);
        } catch (e) {
            console.error(`Custom data channel message with message type that is unknown to the Pixel Streaming protocol. Does your PixelStreamingProtocol need updating? The message type was: ${view[0]}`);
        }
    };

    registerInputs(webRtcPlayerObj.video);

    // On a touch device we will need special ways to show the on-screen keyboard.
    if ('ontouchstart' in document.documentElement) {
        createOnScreenKeyboardHelpers(htmlElement);
    }

    if (UrlParamsCheck('offerToReceive')) {
        createWebRtcOffer();
    }

    return webRtcPlayerObj.video;
}

function setupStats(){
    webRtcPlayerObj.aggregateStats(1 * 1000 /*Check every 1 second*/ );

    let printInterval = 5 * 60 * 1000; /*Print every 5 minutes*/
    let nextPrintDuration = printInterval;

    webRtcPlayerObj.onAggregatedStats = (aggregatedStats) => {
        let numberFormat = new Intl.NumberFormat(window.navigator.language, {
            maximumFractionDigits: 0
        });
        let timeFormat = new Intl.NumberFormat(window.navigator.language, {
            maximumFractionDigits: 0,
            minimumIntegerDigits: 2
        });

        // Calculate duration of run
        let runTime = (aggregatedStats.timestamp - aggregatedStats.timestampStart) / 1000;
        let timeValues = [];
        let timeDurations = [60, 60];
        for (let timeIndex = 0; timeIndex < timeDurations.length; timeIndex++) {
            timeValues.push(runTime % timeDurations[timeIndex]);
            runTime = runTime / timeDurations[timeIndex];
        }
        timeValues.push(runTime);

        let runTimeSeconds = timeValues[0];
        let runTimeMinutes = Math.floor(timeValues[1]);
        let runTimeHours = Math.floor([timeValues[2]]);

        receivedBytesMeasurement = 'B';
        receivedBytes = aggregatedStats.hasOwnProperty('bytesReceived') ? aggregatedStats.bytesReceived : 0;
        let dataMeasurements = ['kB', 'MB', 'GB'];
        for (let index = 0; index < dataMeasurements.length; index++) {
            if (receivedBytes < 100 * 1000)
                break;
            receivedBytes = receivedBytes / 1000;
            receivedBytesMeasurement = dataMeasurements[index];
        }

        let qualityStatus = document.getElementById("connectionStrength");
        // "blinks" quality status element for 1 sec by making it transparent, speed = number of blinks
        let blinkQualityStatus = function(speed) {
            let iter = speed;
            let opacity = 1; // [0..1]
            let tickId = setInterval(
                function() {
                    opacity -= 0.1;
                    // map `opacity` to [-0.5..0.5] range, decrement by 0.2 per step and take `abs` to make it blink: 1 -> 0 -> 1
                    qualityStatus.style.opacity =  `${Math.abs((opacity - 0.5) * 2)}`;
                    if (opacity <= 0.1) {
                        if (--iter == 0) {
                            clearInterval(tickId);
                        } else { // next blink
                            opacity = 1;
                        }
                    }
                },
                100 / speed // msecs
            );
        };

        const orangeQP = 26;
        const redQP = 35;

        let statsText = '';
        let qualityTip = document.getElementById("qualityText");
        let color;

        // Wifi strength elements
        let outer = document.getElementById("outer");
        let middle = document.getElementById("middle");
        let inner = document.getElementById("inner");
        let dot = document.getElementById("dot");

        if (VideoEncoderQP > redQP) {
            color = "red";
            blinkQualityStatus(2);
            statsText += `<div style="color: ${color}">Poor encoding quality</div>`;
            outer.style.fill = "#3c3b40";
            middle.style.fill = "#3c3b40";
            inner.style.fill = color;
            dot.style.fill = color;

        } else if (VideoEncoderQP > orangeQP) {
            color = "orange";
            blinkQualityStatus(1);
            statsText += `<div style="color: ${color}">Blocky encoding quality</div>`;
            outer.style.fill = "#3c3b40";
            middle.style.fill = color;
            inner.style.fill = color;
            dot.style.fill = color;
        } else {
            color = "lime";
            qualityStatus.style.opacity = '1';
            statsText += `<div style="color: ${color}">Clear encoding quality</div>`;
            outer.style.fill = color;
            middle.style.fill = color;
            inner.style.fill = color;
            dot.style.fill = color;
        }
        qualityTip.innerHTML = statsText;

        statsText += `<div>Duration: ${timeFormat.format(runTimeHours)}:${timeFormat.format(runTimeMinutes)}:${timeFormat.format(runTimeSeconds)}</div>`;
        statsText += `<div>Controls stream input: ${inputController === null ? "Not sent yet" : (inputController ? "true" : "false")}</div>`;
        statsText += `<div>Audio codec: ${aggregatedStats.hasOwnProperty('audioCodec') ? aggregatedStats.audioCodec : "Not set" }</div>`;
        statsText += `<div>Video codec: ${aggregatedStats.hasOwnProperty('videoCodec') ? aggregatedStats.videoCodec : "Not set" }</div>`;
        statsText += `<div>Video Resolution: ${
            aggregatedStats.hasOwnProperty('frameWidth') && aggregatedStats.frameWidth && aggregatedStats.hasOwnProperty('frameHeight') && aggregatedStats.frameHeight ?
                aggregatedStats.frameWidth + 'x' + aggregatedStats.frameHeight : 'Chrome only'
            }</div>`;
        statsText += `<div>Received (${receivedBytesMeasurement}): ${numberFormat.format(receivedBytes)}</div>`;
        statsText += `<div>Frames Decoded: ${aggregatedStats.hasOwnProperty('framesDecoded') ? numberFormat.format(aggregatedStats.framesDecoded) : 'Chrome only'}</div>`;
        statsText += `<div>Packets Lost: ${aggregatedStats.hasOwnProperty('packetsLost') ? numberFormat.format(aggregatedStats.packetsLost) : 'Chrome only'}</div>`;
        statsText += `<div>Framerate: ${aggregatedStats.hasOwnProperty('framerate') ? numberFormat.format(aggregatedStats.framerate) : 'Chrome only'}</div>`;
        statsText += `<div>Frames dropped: ${aggregatedStats.hasOwnProperty('framesDropped') ? numberFormat.format(aggregatedStats.framesDropped) : 'Chrome only'}</div>`;
        statsText += `<div>Net RTT (ms): ${aggregatedStats.hasOwnProperty('currentRoundTripTime') ? numberFormat.format(aggregatedStats.currentRoundTripTime * 1000) : 'Can\'t calculate'}</div>`;
        statsText += `<div>Browser receive to composite (ms): ${aggregatedStats.hasOwnProperty('receiveToCompositeMs') ? numberFormat.format(aggregatedStats.receiveToCompositeMs) : 'Chrome only'}</div>`;
        statsText += `<div style="color: ${color}">Audio Bitrate (kbps): ${aggregatedStats.hasOwnProperty('audioBitrate') ? numberFormat.format(aggregatedStats.audioBitrate) : 'Chrome only'}</div>`;
        statsText += `<div style="color: ${color}">Video Bitrate (kbps): ${aggregatedStats.hasOwnProperty('bitrate') ? numberFormat.format(aggregatedStats.bitrate) : 'Chrome only'}</div>`;
        statsText += `<div style="color: ${color}">Video Quantization Parameter: ${VideoEncoderQP}</div>`;

        let statsDiv = document.getElementById("stats");
        statsDiv.innerHTML = statsText;

        if (print_stats) {
            if (aggregatedStats.timestampStart) {
                if ((aggregatedStats.timestamp - aggregatedStats.timestampStart) > nextPrintDuration) {
                    if (ws && ws.readyState === WS_OPEN_STATE) {
                        console.log(`-> SS: stats\n${JSON.stringify(aggregatedStats)}`);
                        ws.send(JSON.stringify({
                            type: 'stats',
                            data: aggregatedStats
                        }));
                    }
                    nextPrintDuration += printInterval;
                }
            }
        }
    };

    webRtcPlayerObj.latencyTestTimings.OnAllLatencyTimingsReady = function(timings) {

        if (!timings.BrowserReceiptTimeMs) {
            return;
        }

        let latencyExcludingDecode = timings.BrowserReceiptTimeMs - timings.TestStartTimeMs;
        let encodeLatency = timings.UEEncodeMs;
        let uePixelStreamLatency = timings.UECaptureToSendMs;
        let ueTestDuration = timings.UETransmissionTimeMs - timings.UEReceiptTimeMs;
        let networkLatency = latencyExcludingDecode - ueTestDuration;

        //these ones depend on FrameDisplayDeltaTimeMs
        let endToEndLatency = null;
        let browserSideLatency = null;

        if (timings.FrameDisplayDeltaTimeMs && timings.BrowserReceiptTimeMs) {
            endToEndLatency = timings.FrameDisplayDeltaTimeMs + networkLatency + (typeof uePixelStreamLatency === "string" ? 0 : uePixelStreamLatency);
            browserSideLatency = timings.FrameDisplayDeltaTimeMs + (latencyExcludingDecode - networkLatency - ueTestDuration);
        }

        let latencyStatsInnerHTML = '';
        latencyStatsInnerHTML += `<div>Net latency RTT (ms): ${networkLatency.toFixed(2)}</div>`;
        latencyStatsInnerHTML += `<div>UE Encode (ms): ${(typeof encodeLatency === "string" ? encodeLatency : encodeLatency.toFixed(2))}</div>`;
        latencyStatsInnerHTML += `<div>UE Send to capture (ms): ${(typeof uePixelStreamLatency === "string" ? uePixelStreamLatency : uePixelStreamLatency.toFixed(2))}</div>`;
        latencyStatsInnerHTML += `<div>UE probe duration (ms): ${ueTestDuration.toFixed(2)}</div>`;
        latencyStatsInnerHTML += timings.FrameDisplayDeltaTimeMs && timings.BrowserReceiptTimeMs ? `<div>Browser composite latency (ms): ${timings.FrameDisplayDeltaTimeMs.toFixed(2)}</div>` : "";
        latencyStatsInnerHTML += browserSideLatency ? `<div>Total browser latency (ms): ${browserSideLatency.toFixed(2)}</div>` : "";
        latencyStatsInnerHTML += endToEndLatency ? `<div>Total latency (ms): ${endToEndLatency.toFixed(2)}</div>` : "";
        document.getElementById("LatencyStats").innerHTML = latencyStatsInnerHTML;
    }
}

function onWebRtcOffer(webRTCData) {
    webRtcPlayerObj.receiveOffer(webRTCData);
    setupStats();
}

function onWebRtcAnswer(webRTCData) {
    webRtcPlayerObj.receiveAnswer(webRTCData);
    setupStats();
}

function onWebRtcSFUPeerDatachannels(webRTCData) {
    webRtcPlayerObj.receiveSFUPeerDataChannelRequest(webRTCData);
}

function onWebRtcIce(iceCandidate) {
    if (webRtcPlayerObj){
        webRtcPlayerObj.handleCandidateFromServer(iceCandidate);
    }
}

let styleWidth;
let styleHeight;
let styleTop;
let styleLeft;
let styleCursor = 'default';
let styleAdditional;

const ControlSchemeType = {
    // A mouse can lock inside the WebRTC player so the user can simply move the
    // mouse to control the orientation of the camera. The user presses the
    // Escape key to unlock the mouse.
    LockedMouse: 0,

    // A mouse can hover over the WebRTC player so the user needs to click and
    // drag to control the orientation of the camera.
    HoveringMouse: 1
};

let inputOptions = {
    // The control scheme controls the behaviour of the mouse when it interacts
    // with the WebRTC player.
    controlScheme: ControlSchemeType.LockedMouse,

    // Browser keys are those which are typically used by the browser UI. We
    // usually want to suppress these to allow, for example, UE to show shader
    // complexity with the F5 key without the web page refreshing.
    suppressBrowserKeys: true,

    // UE has a faketouches option which fakes a single finger touch when the
    // user drags with their mouse. We may perform the reverse; a single finger
    // touch may be converted into a mouse drag UE side. This allows a
    // non-touch application to be controlled partially via a touch device.
    fakeMouseWithTouches: false,

    // Hiding the browser cursor enables the use of UE's inbuilt software cursor,
    // without having the browser cursor display on top
    hideBrowserCursor: false
};

function resizePlayerStyleToFillWindow(playerElement) {
    let videoElement = playerElement.getElementsByTagName("VIDEO");

    // Fill the player display in window, keeping picture's aspect ratio.
    let windowAspectRatio = window.innerHeight / window.innerWidth;
    let playerAspectRatio = playerElement.clientHeight / playerElement.clientWidth;
    // We want to keep the video ratio correct for the video stream
    let videoAspectRatio = videoElement.videoHeight / videoElement.videoWidth;
    if (isNaN(videoAspectRatio)) {
        //Video is not initialised yet so set playerElement to size of window
        styleWidth = window.innerWidth;
        styleHeight = window.innerHeight;
        styleTop = 0;
        styleLeft = 0;
        playerElement.style = "top: " + styleTop + "px; left: " + styleLeft + "px; width: " + styleWidth + "px; height: " + styleHeight + "px; cursor: " + styleCursor + "; " + styleAdditional;
    } else if (windowAspectRatio < playerAspectRatio) {
        // Window height is the constraining factor so to keep aspect ratio change width appropriately
        styleWidth = Math.floor(window.innerHeight / videoAspectRatio);
        styleHeight = window.innerHeight;
        styleTop = 0;
        styleLeft = Math.floor((window.innerWidth - styleWidth) * 0.5);
        //Video is now 100% of the playerElement, so set the playerElement style
        playerElement.style = "top: " + styleTop + "px; left: " + styleLeft + "px; width: " + styleWidth + "px; height: " + styleHeight + "px; cursor: " + styleCursor + "; " + styleAdditional;
    } else {
        // Window width is the constraining factor so to keep aspect ratio change height appropriately
        styleWidth = window.innerWidth;
        styleHeight = Math.floor(window.innerWidth * videoAspectRatio);
        styleTop = Math.floor((window.innerHeight - styleHeight) * 0.5);
        styleLeft = 0;
        //Video is now 100% of the playerElement, so set the playerElement style
        playerElement.style = "top: " + styleTop + "px; left: " + styleLeft + "px; width: " + styleWidth + "px; height: " + styleHeight + "px; cursor: " + styleCursor + "; " + styleAdditional;
    }
}

function resizePlayerStyleToActualSize(playerElement) {
    let videoElement = playerElement.getElementsByTagName("VIDEO");

    if (videoElement.length > 0) {
        // Display image in its actual size
        styleWidth = videoElement[0].videoWidth;
        styleHeight = videoElement[0].videoHeight;
        let Top = Math.floor((window.innerHeight - styleHeight) * 0.5);
        let Left = Math.floor((window.innerWidth - styleWidth) * 0.5);
        styleTop = (Top > 0) ? Top : 0;
        styleLeft = (Left > 0) ? Left : 0;
        //Video is now 100% of the playerElement, so set the playerElement style
        playerElement.style = "top: " + styleTop + "px; left: " + styleLeft + "px; width: " + styleWidth + "px; height: " + styleHeight + "px; cursor: " + styleCursor + "; " + styleAdditional;
    }
}

function resizePlayerStyleToArbitrarySize(playerElement) {
    let videoElement = playerElement.getElementsByTagName("VIDEO");
    //Video is now 100% of the playerElement, so set the playerElement style
    playerElement.style = "top: 0px; left: 0px; width: " + styleWidth + "px; height: " + styleHeight + "px; cursor: " + styleCursor + "; " + styleAdditional;
}

function setupFreezeFrameOverlay() {
    freezeFrameOverlay = document.createElement('div');
    freezeFrameOverlay.id = 'freezeFrameOverlay';
    freezeFrameOverlay.style.display = 'none';
    freezeFrameOverlay.style.pointerEvents = 'none';
    freezeFrameOverlay.style.position = 'absolute';
    freezeFrameOverlay.style.zIndex = '20';

    let freezeFrameImage = document.createElement('img');
    freezeFrameImage.style.position = 'absolute';
    freezeFrameOverlay.appendChild(freezeFrameImage);
}

function showFreezeFrameOverlay() {
    if (freezeFrame.valid) {
        freezeFrameOverlay.classList.add("freezeframeBackground");
        freezeFrameOverlay.style.display = 'block';
    }
}

function invalidateFreezeFrameOverlay() {
    setTimeout(() => {
        freezeFrameOverlay.style.display = 'none';
        freezeFrame.valid = false;
        freezeFrameOverlay.classList.remove("freezeframeBackground");
    }, freezeFrameDelay);
    
    if (webRtcPlayerObj) {
        webRtcPlayerObj.setVideoEnabled(true);
    }
}

function resizeFreezeFrameOverlay() {
    if (freezeFrame.width !== 0 && freezeFrame.height !== 0) {
        let displayWidth = 0;
        let displayHeight = 0;
        let displayTop = 0;
        let displayLeft = 0;
        let checkBox = document.getElementById('enlarge-display-to-fill-window-tgl');
        let playerElement = document.getElementById('player');
        if (checkBox !== null && checkBox.checked) {
            // We are fitting video to screen, we care about the screen (window) size
            let windowAspectRatio = window.innerWidth / window.innerHeight;
            let videoAspectRatio = freezeFrame.width / freezeFrame.height;
            if (windowAspectRatio < videoAspectRatio) {
                displayWidth = window.innerWidth;
                displayHeight = Math.floor(window.innerWidth / videoAspectRatio);
                displayTop = Math.floor((window.innerHeight - displayHeight) * 0.5);
                displayLeft = 0;
            } else {
                displayWidth = Math.floor(window.innerHeight * videoAspectRatio);
                displayHeight = window.innerHeight;
                displayTop = 0;
                displayLeft = Math.floor((window.innerWidth - displayWidth) * 0.5);
            }
        } else {
            // Video is coming in at native resolution, we care more about the player size
            let playerAspectRatio = playerElement.offsetWidth / playerElement.offsetHeight;
            let videoAspectRatio = freezeFrame.width / freezeFrame.height;
            if (playerAspectRatio < videoAspectRatio) {
                displayWidth = playerElement.offsetWidth;
                displayHeight = Math.floor(playerElement.offsetWidth / videoAspectRatio);
                displayTop = Math.floor((playerElement.offsetHeight - displayHeight) * 0.5);
                displayLeft = 0;
            } else {
                displayWidth = Math.floor(playerElement.offsetHeight * videoAspectRatio);
                displayHeight = playerElement.offsetHeight;
                displayTop = 0;
                displayLeft = Math.floor((playerElement.offsetWidth - displayWidth) * 0.5);
            }
        }
        let freezeFrameImage = document.getElementById("freezeFrameOverlay").childNodes[0];
        freezeFrameOverlay.style.width = playerElement.offsetWidth + 'px';
        freezeFrameOverlay.style.height = playerElement.offsetHeight + 'px';
        freezeFrameOverlay.style.left = 0 + 'px';
        freezeFrameOverlay.style.top = 0 + 'px';

        freezeFrameImage.style.width = displayWidth + 'px';
        freezeFrameImage.style.height = displayHeight + 'px';
        freezeFrameImage.style.left = displayLeft + 'px';
        freezeFrameImage.style.top = displayTop + 'px';
    }
}

function resizePlayerStyle(event) {
    let playerElement = document.getElementById('player');

    if (!playerElement)
        return;

    updateVideoStreamSize();

    if (playerElement.classList.contains('fixed-size')) {
        setupMouseAndFreezeFrame(playerElement)
        return;
    }


    let checkBox = document.getElementById('enlarge-display-to-fill-window-tgl');
    let windowSmallerThanPlayer = window.innerWidth < playerElement.videoWidth || window.innerHeight < playerElement.videoHeight;
    if (checkBox !== null) {
        if (checkBox.checked || windowSmallerThanPlayer) {
            resizePlayerStyleToFillWindow(playerElement);
        } else {
            resizePlayerStyleToActualSize(playerElement);
        }
    } else {
        resizePlayerStyleToArbitrarySize(playerElement);
    }

    setupMouseAndFreezeFrame(playerElement)
}

function setupMouseAndFreezeFrame(playerElement) {
    // Calculating and normalizing positions depends on the width and height of
    // the player.
    playerElementClientRect = playerElement.getBoundingClientRect();
    setupNormalizeAndQuantize();
    resizeFreezeFrameOverlay();
}

function updateVideoStreamSize() {
    if (!matchViewportResolution) {
        return;
    }

    let now = new Date().getTime();
    if (now - lastTimeResized > 1000) {
        let playerElement = document.getElementById('player');
        if (!playerElement)
            return;

        let descriptor = {
            "Resolution.Width": playerElement.clientWidth, 
            "Resolution.Height": playerElement.clientHeight
        };
        emitCommand(descriptor);
        console.log(descriptor);
        lastTimeResized = new Date().getTime();
    } else {
        console.log('Resizing too often - skipping');
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateVideoStreamSize, 1000);
    }
}

// Fix for bug in iOS where windowsize is not correct at instance or orientation change
// https://github.com/dimsemenov/PhotoSwipe/issues/1315
let _orientationChangeTimeout;

function onOrientationChange(event) {
    clearTimeout(_orientationChangeTimeout);
    _orientationChangeTimeout = setTimeout(function() {
        resizePlayerStyle();
    }, 500);
}

function sendMessageToStreamer(messageType, indata = []) {
    messageFormat = toStreamerMessages.getFromKey(messageType);
    if(messageFormat === undefined) {
        console.error(`Attempted to send a message to the streamer with message type: ${messageType}, but the frontend hasn't been configured to send such a message. Check you've added the message type in your cpp`);
        return;
    }
    // console.log(`Calculate size: ${new Blob(JSON.stringify(indata)).size}, Specified size: ${messageFormat.byteLength}`);
    data = new DataView(new ArrayBuffer(messageFormat.byteLength + 1));

    data.setUint8(0, messageFormat.id);
    byteOffset = 1;

    indata.forEach((element, idx) => {
        type = messageFormat.structure[idx];
        switch (type) {
            case "uint8":
                data.setUint8(byteOffset, element);
                byteOffset += 1;
                break;

            case "uint16":
                data.setUint16(byteOffset, element, true);
                byteOffset += 2;
                break;

            case "int16":
                data.setInt16(byteOffset, element, true);
                byteOffset += 2;
                break;

            case "double":
                data.setFloat64(byteOffset, element, true);
                byteOffset += 8;
                break;
        }
    });
    sendInputData(data.buffer);
}

// A generic message has a type and a descriptor.
function emitDescriptor(messageType, descriptor) {
    // Convert the descriptor object into a JSON string.
    let descriptorAsString = JSON.stringify(descriptor);
    let messageFormat = toStreamerMessages.getFromKey(messageType);
    if(messageFormat === undefined) {
        console.error(`Attempted to emit descriptor with message type: ${messageType}, but the frontend hasn't been configured to send such a message. Check you've added the message type in your cpp`);
    }
    // Add the UTF-16 JSON string to the array byte buffer, going two bytes at
    // a time.
    let data = new DataView(new ArrayBuffer(1 + 2 + 2 * descriptorAsString.length));
    let byteIdx = 0;
    data.setUint8(byteIdx, messageFormat.id);
    byteIdx++;
    data.setUint16(byteIdx, descriptorAsString.length, true);
    byteIdx += 2;
    for (let i = 0; i < descriptorAsString.length; i++) {
        data.setUint16(byteIdx, descriptorAsString.charCodeAt(i), true);
        byteIdx += 2;
    }
    sendInputData(data.buffer);
}

// A built-in command can be sent to UE client. The commands are defined by a
// JSON descriptor and will be executed automatically.
// The currently supported commands are:
//
// 1. A command to run any console command:
//    "{ ConsoleCommand: <string> }"
//
// 2. A command to change the resolution to the given width and height.
//    "{ Resolution.Width: <value>, Resolution.Height: <value> } }"
//
function emitCommand(descriptor) {
    emitDescriptor("Command", descriptor);
}

// A UI interation will occur when the user presses a button powered by
// JavaScript as opposed to pressing a button which is part of the pixel
// streamed UI from the UE client.
function emitUIInteraction(descriptor) {
    emitDescriptor("UIInteraction", descriptor);
}

function requestInitialSettings() {
    sendMessageToStreamer("RequestInitialSettings");
}

function requestQualityControl() {
    if (!qualityController) {
        sendMessageToStreamer("RequestQualityControl");
    }
}

let playerElementClientRect = undefined;
let normalizeAndQuantizeUnsigned = undefined;
let normalizeAndQuantizeSigned = undefined;
let unquantizeAndDenormalizeUnsigned = undefined;

function setupNormalizeAndQuantize() {
    let playerElement = document.getElementById('player');
    let videoElement = playerElement.getElementsByTagName("video");

    if (playerElement && videoElement.length > 0) {
        let playerAspectRatio = playerElement.clientHeight / playerElement.clientWidth;
        let videoAspectRatio = videoElement[0].videoHeight / videoElement[0].videoWidth;

        // Unsigned XY positions are the ratio (0.0..1.0) along a viewport axis,
        // quantized into an uint16 (0..65536).
        // Signed XY deltas are the ratio (-1.0..1.0) along a viewport axis,
        // quantized into an int16 (-32767..32767).
        // This allows the browser viewport and client viewport to have a different
        // size.
        // Hack: Currently we set an out-of-range position to an extreme (65535)
        // as we can't yet accurately detect mouse enter and leave events
        // precisely inside a video with an aspect ratio which causes mattes.
        if (playerAspectRatio > videoAspectRatio) {
            if (print_inputs) {
                console.log('Setup Normalize and Quantize for playerAspectRatio > videoAspectRatio');
            }
            let ratio = playerAspectRatio / videoAspectRatio;
            // Unsigned.
            normalizeAndQuantizeUnsigned = (x, y) => {
                let normalizedX = x / playerElement.clientWidth;
                let normalizedY = ratio * (y / playerElement.clientHeight - 0.5) + 0.5;
                if (normalizedX < 0.0 || normalizedX > 1.0 || normalizedY < 0.0 || normalizedY > 1.0) {
                    return {
                        inRange: false,
                        x: 65535,
                        y: 65535
                    };
                } else {
                    return {
                        inRange: true,
                        x: normalizedX * 65536,
                        y: normalizedY * 65536
                    };
                }
            };
            unquantizeAndDenormalizeUnsigned = (x, y) => {
                let normalizedX = x / 65536;
                let normalizedY = (y / 65536 - 0.5) / ratio + 0.5;
                return {
                    x: normalizedX * playerElement.clientWidth,
                    y: normalizedY * playerElement.clientHeight
                };
            };
            // Signed.
            normalizeAndQuantizeSigned = (x, y) => {
                let normalizedX = x / (0.5 * playerElement.clientWidth);
                let normalizedY = (ratio * y) / (0.5 * playerElement.clientHeight);
                return {
                    x: normalizedX * 32767,
                    y: normalizedY * 32767
                };
            };
        } else {
            if (print_inputs) {
                console.log('Setup Normalize and Quantize for playerAspectRatio <= videoAspectRatio');
            }
            let ratio = videoAspectRatio / playerAspectRatio;
            // Unsigned.
            normalizeAndQuantizeUnsigned = (x, y) => {
                let normalizedX = ratio * (x / playerElement.clientWidth - 0.5) + 0.5;
                let normalizedY = y / playerElement.clientHeight;
                if (normalizedX < 0.0 || normalizedX > 1.0 || normalizedY < 0.0 || normalizedY > 1.0) {
                    return {
                        inRange: false,
                        x: 65535,
                        y: 65535
                    };
                } else {
                    return {
                        inRange: true,
                        x: normalizedX * 65536,
                        y: normalizedY * 65536
                    };
                }
            };
            unquantizeAndDenormalizeUnsigned = (x, y) => {
                let normalizedX = (x / 65536 - 0.5) / ratio + 0.5;
                let normalizedY = y / 65536;
                return {
                    x: normalizedX * playerElement.clientWidth,
                    y: normalizedY * playerElement.clientHeight
                };
            };
            // Signed.
            normalizeAndQuantizeSigned = (x, y) => {
                let normalizedX = (ratio * x) / (0.5 * playerElement.clientWidth);
                let normalizedY = y / (0.5 * playerElement.clientHeight);
                return {
                    x: normalizedX * 32767,
                    y: normalizedY * 32767
                };
            };
        }
    }
}

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
const MouseButton = {
    MainButton: 0, // Left button.
    AuxiliaryButton: 1, // Wheel button.
    SecondaryButton: 2, // Right button.
    FourthButton: 3, // Browser Back button.
    FifthButton: 4 // Browser Forward button.
};

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
const MouseButtonsMask = {
    PrimaryButton: 1, // Left button.
    SecondaryButton: 2, // Right button.
    AuxiliaryButton: 4, // Wheel button.
    FourthButton: 8, // Browser Back button.
    FifthButton: 16 // Browser Forward button.
};

// If the user has any mouse buttons pressed then release them.
function releaseMouseButtons(buttons, x, y) {
    let coord = normalizeAndQuantizeUnsigned(x, y);
    if (buttons & MouseButtonsMask.PrimaryButton) {
        toStreamerHandlers.MouseUp("MouseUp", [MouseButton.MainButton, coord.x, coord.y]);
    }
    if (buttons & MouseButtonsMask.SecondaryButton) {
        toStreamerHandlers.MouseUp("MouseUp", [MouseButton.SecondaryButton, coord.x, coord.y]);
    }
    if (buttons & MouseButtonsMask.AuxiliaryButton) {
        toStreamerHandlers.MouseUp("MouseUp", [MouseButton.AuxiliaryButton, coord.x, coord.y]);
    }
    if (buttons & MouseButtonsMask.FourthButton) {
        toStreamerHandlers.MouseUp("MouseUp", [MouseButton.FourthButton, coord.x, coord.y]);
    }
    if (buttons & MouseButtonsMask.FifthButton) {
        toStreamerHandlers.MouseUp("MouseUp", [MouseButton.FifthButton, coord.x, coord.y]);
    }
}

// If the user has any Mouse buttons pressed then press them again.
function pressMouseButtons(buttons, x, y) {
    let coord = normalizeAndQuantizeUnsigned(x, y);
    if (buttons & MouseButtonsMask.PrimaryButton) {
        toStreamerHandlers.MouseDown("MouseDown", [MouseButton.MainButton, coord.x, coord.y]);
    }
    if (buttons & MouseButtonsMask.SecondaryButton) {
        toStreamerHandlers.MouseDown("MouseDown", [MouseButton.SecondaryButton, coord.x, coord.y]);
    }
    if (buttons & MouseButtonsMask.AuxiliaryButton) {
        toStreamerHandlers.MouseDown("MouseDown", [MouseButton.AuxiliaryButton, coord.x, coord.y]);
    }
    if (buttons & MouseButtonsMask.FourthButton) {
        toStreamerHandlers.MouseDown("MouseDown", [MouseButton.FourthButton, coord.x, coord.y]);
    }
    if (buttons & MouseButtonsMask.FifthButton) {
        toStreamerHandlers.MouseDown("MouseDown", [MouseButton.FifthButton, coord.x, coord.y]);
    }
}

function registerInputs(playerElement) {
    if (!playerElement)
        return;

    registerMouseEnterAndLeaveEvents(playerElement);
    registerTouchEvents(playerElement);
}

function createOnScreenKeyboardHelpers(htmlElement) {
    if (document.getElementById('hiddenInput') === null) {
        hiddenInput = document.createElement('input');
        hiddenInput.id = 'hiddenInput';
        hiddenInput.maxLength = 0;
        htmlElement.appendChild(hiddenInput);
    }

    if (document.getElementById('editTextButton') === null) {
        editTextButton = document.createElement('button');
        editTextButton.id = 'editTextButton';
        editTextButton.innerHTML = 'edit text';
        htmlElement.appendChild(editTextButton);

        // Hide the 'edit text' button.
        editTextButton.classList.add('hiddenState');

        editTextButton.addEventListener('click', function() {
            // Show the on-screen keyboard.
            hiddenInput.focus();
        });
    }
}

function showOnScreenKeyboard(command) {
    if (command.showOnScreenKeyboard) {
        // Show the 'edit text' button.
        editTextButton.classList.remove('hiddenState');
        // Place the 'edit text' button near the UE input widget.
        let pos = unquantizeAndDenormalizeUnsigned(command.x, command.y);
        editTextButton.style.top = pos.y.toString() + 'px';
        editTextButton.style.left = (pos.x - 40).toString() + 'px';
    } else {
        // Hide the 'edit text' button.
        editTextButton.classList.add('hiddenState');
        // Hide the on-screen keyboard.
        hiddenInput.blur();
    }
}

function registerMouseEnterAndLeaveEvents(playerElement) {
    playerElement.onmouseenter = function(e) {
        if (print_inputs) {
            console.log('mouse enter');
        }
        toStreamerHandlers.MouseEnter("MouseEnter");
        playerElement.pressMouseButtons(e);
    };

    playerElement.onmouseleave = function(e) {
        if (print_inputs) {
            console.log('mouse leave');
        }
        toStreamerHandlers.MouseLeave("MouseLeave");
        playerElement.releaseMouseButtons(e);
    };
}

// A locked mouse works by the user clicking in the browser player and the
// cursor disappears and is locked. The user moves the cursor and the camera
// moves, for example. The user presses escape to free the mouse.
function registerLockedMouseEvents(playerElement) {
    styleCursor = (inputOptions.hideBrowserCursor ? 'none' : 'default');
    let x = playerElement.width / 2;
    let y = playerElement.height / 2;
    let coord = normalizeAndQuantizeUnsigned(x, y);

    playerElement.requestPointerLock = playerElement.requestPointerLock || playerElement.mozRequestPointerLock;
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;

    playerElement.onclick = function() {
        playerElement.requestPointerLock();
    };

    // Respond to lock state change events
    document.addEventListener('pointerlockchange', lockStateChange, false);
    document.addEventListener('mozpointerlockchange', lockStateChange, false);

    function lockStateChange() {
        if (document.pointerLockElement === playerElement ||
            document.mozPointerLockElement === playerElement) {
            console.log('Pointer locked');
            document.addEventListener("mousemove", updatePosition, false);
        } else {
            console.log('The pointer lock status is now unlocked');
            document.removeEventListener("mousemove", updatePosition, false);

            // If mouse loses focus, send a key up for all of the currently held-down keys
            // This is necessary as when the mouse loses focus, the windows stops listening for events and as such
            // the keyup listener won't get fired
            [...new Set(activeKeys)].forEach((uniqueKeycode) => {
                toStreamerHandlers.KeyUp("KeyUp", [uniqueKeycode]);
            });
            // Reset the active keys back to nothing
            activeKeys = [];
        }
    }

    function updatePosition(e) {
        x += e.movementX;
        y += e.movementY;
        if (x > styleWidth) {
            x -= styleWidth;
        }
        if (y > styleHeight) {
            y -= styleHeight;
        }
        if (x < 0) {
            x = styleWidth + x;
        }
        if (y < 0) {
            y = styleHeight - y;
        }

        let coord = normalizeAndQuantizeUnsigned(x, y);
        let delta = normalizeAndQuantizeSigned(e.movementX, e.movementY);
        toStreamerHandlers.MouseMove("MouseMove", [coord.x, coord.y, delta.x, delta.y]);
    }


    playerElement.onmousedown = function (e) {
        toStreamerHandlers.MouseDown("MouseDown", [e.button, coord.x, coord.y]);
    };

    playerElement.onmouseup = function (e) {
        toStreamerHandlers.MouseUp("MouseUp", [e.button, coord.x, coord.y]);
    };

    playerElement.onwheel = function (e) {
        toStreamerHandlers.MouseWheel("MouseWheel", [e.wheelDelta, coord.x, coord.y]);
    };

    playerElement.ondblclick = function (e) {
        toStreamerHandlers.MouseDown("MouseDouble", [e.button, coord.x, coord.y]);
    };

    playerElement.pressMouseButtons = function(e) {
        pressMouseButtons(e.buttons, x, y);
    };

    playerElement.releaseMouseButtons = function(e) {
        releaseMouseButtons(e.buttons, x, y);
    };
}

// A hovering mouse works by the user clicking the mouse button when they want
// the cursor to have an effect over the video. Otherwise the cursor just
// passes over the browser.
function registerHoveringMouseEvents(playerElement) {
    styleCursor = (inputOptions.hideBrowserCursor ? 'none' : 'default');

    playerElement.onmousemove = function (e) {
        let coord = normalizeAndQuantizeUnsigned(e.offsetX, e.offsetY);
        let delta = normalizeAndQuantizeSigned(e.movementX, e.movementY);
        toStreamerHandlers.MouseMove("MouseMove", [coord.x, coord.y, delta.x, delta.y]);
        e.preventDefault();
    };

    playerElement.onmousedown = function (e) {
        let coord = normalizeAndQuantizeUnsigned(e.offsetX, e.offsetY);
        toStreamerHandlers.MouseDown("MouseDown", [e.button, coord.x, coord.y]);
        e.preventDefault();
    };

    playerElement.onmouseup = function (e) {
        let coord = normalizeAndQuantizeUnsigned(e.offsetX, e.offsetY);
        toStreamerHandlers.MouseUp("MouseUp", [e.button, coord.x, coord.y]);
        e.preventDefault();
    };

    // When the context menu is shown then it is safest to release the button
    // which was pressed when the event happened. This will guarantee we will
    // get at least one mouse up corresponding to a mouse down event. Otherwise
    // the mouse can get stuck.
    // https://github.com/facebook/react/issues/5531
    playerElement.oncontextmenu = function (e) {
        let coord = normalizeAndQuantizeUnsigned(e.offsetX, e.offsetY);
        toStreamerHandlers.MouseUp("MouseUp", [e.button, coord.x, coord.y]);
        e.preventDefault();
    };

    playerElement.onwheel = function (e) {
        let coord = normalizeAndQuantizeUnsigned(e.offsetX, e.offsetY);
        toStreamerHandlers.MouseWheel("MouseWheel", [e.wheelDelta, coord.x, coord.y]);
        e.preventDefault();
    };

    playerElement.ondblclick = function (e) {
        let coord = normalizeAndQuantizeUnsigned(e.offsetX, e.offsetY);
        toStreamerHandlers.MouseDown("MouseDouble", [e.button, coord.x, coord.y]);
    };

    playerElement.pressMouseButtons = function(e) {
        pressMouseButtons(e.buttons, e.offsetX, e.offsetY);
    };

    playerElement.releaseMouseButtons = function(e) {
        releaseMouseButtons(e.buttons, e.offsetX, e.offsetY);
    };
}

function registerTouchEvents(playerElement) {
    // We need to assign a unique identifier to each finger.
    // We do this by mapping each Touch object to the identifier.
    let fingers = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    let fingerIds = {};

    function rememberTouch(touch) {
        let finger = fingers.pop();
        if (finger === undefined) {
            console.log('exhausted touch indentifiers');
        }
        fingerIds[touch.identifier] = finger;
    }

    function forgetTouch(touch) {
        fingers.push(fingerIds[touch.identifier]);
        // Sort array back into descending order. This means if finger '1' were to lift after finger '0', we would ensure that 0 will be the first index to pop
        fingers.sort(function(a, b){return b - a});
        delete fingerIds[touch.identifier];
    }

    function emitTouchData(type, touches) {
        for (let t = 0; t < touches.length; t++) {
            let numTouches = 1; // the number of touches to be sent this message
            let touch = touches[t];
            let x = touch.clientX - playerElement.offsetLeft;
            let y = touch.clientY - playerElement.offsetTop;
            if (print_inputs) {
                console.log(`F${fingerIds[touch.identifier]}=(${x}, ${y})`);
            }
            let coord = normalizeAndQuantizeUnsigned(x, y);
            
            switch(type) {
                case "TouchStart":
                    toStreamerHandlers.TouchStart("TouchStart", [numTouches, coord.x, coord.y, fingerIds[touch.identifier], MaxByteValue * touch.force, coord.inRange ? 1 : 0]);
                    break;
                case "TouchEnd":
                    toStreamerHandlers.TouchStart("TouchEnd", [numTouches, coord.x, coord.y, fingerIds[touch.identifier], MaxByteValue * touch.force, coord.inRange ? 1 : 0]);
                    break;
                case "TouchMove":
                    toStreamerHandlers.TouchStart("TouchMove", [numTouches, coord.x, coord.y, fingerIds[touch.identifier], MaxByteValue * touch.force, coord.inRange ? 1 : 0]);
                    break;
            }
        }
    }

    if (inputOptions.fakeMouseWithTouches) {

        let finger = undefined;

        playerElement.ontouchstart = function(e) {
            if (finger === undefined) {
                let firstTouch = e.changedTouches[0];
                finger = {
                    id: firstTouch.identifier,
                    x: firstTouch.clientX - playerElementClientRect.left,
                    y: firstTouch.clientY - playerElementClientRect.top
                };
                // Hack: Mouse events require an enter and leave so we just
                // enter and leave manually with each touch as this event
                // is not fired with a touch device.
                playerElement.onmouseenter(e);
                let coord = normalizeAndQuantizeUnsigned(finger.x, finger.y);
                toStreamerHandlers.MouseDown("MouseDown", [MouseButton.MainButton, coord.x, coord.y]);
            }
            e.preventDefault();
        };

        playerElement.ontouchend = function(e) {
            for (let t = 0; t < e.changedTouches.length; t++) {
                let touch = e.changedTouches[t];
                if (touch.identifier === finger.id) {
                    let x = touch.clientX - playerElementClientRect.left;
                    let y = touch.clientY - playerElementClientRect.top;
                    let coord = normalizeAndQuantizeUnsigned(x, y);
                    toStreamerHandlers.MouseUp("MouseUp", [MouseButton.MainButton, coord.x, coord.y]);
                    // Hack: Manual mouse leave event.
                    playerElement.onmouseleave(e);
                    finger = undefined;
                    break;
                }
            }
            e.preventDefault();
        };

        playerElement.ontouchmove = function(e) {
            for (let t = 0; t < e.touches.length; t++) {
                let touch = e.touches[t];
                if (touch.identifier === finger.id) {
                    let x = touch.clientX - playerElementClientRect.left;
                    let y = touch.clientY - playerElementClientRect.top;
                    let coord = normalizeAndQuantizeUnsigned(x, y);
                    let delta = normalizeAndQuantizeSigned(x - finger.x, y - finger.y);
                    toStreamerHandlers.MouseMove("MouseMove", [coord.x, coord.y, delta.x, delta.y]);
                    finger.x = x;
                    finger.y = y;
                    break;
                }
            }
            e.preventDefault();
        };
    } else {
        playerElement.ontouchstart = function(e) {
            // Assign a unique identifier to each touch.
            for (let t = 0; t < e.changedTouches.length; t++) {
                rememberTouch(e.changedTouches[t]);
            }

            if (print_inputs) {
                console.log('touch start');
            }
            emitTouchData("TouchStart", e.changedTouches);
            e.preventDefault();
        };

        playerElement.ontouchend = function(e) {
            if (print_inputs) {
                console.log('touch end');
            }
            emitTouchData("TouchEnd", e.changedTouches);

            // Re-cycle unique identifiers previously assigned to each touch.
            for (let t = 0; t < e.changedTouches.length; t++) {
                forgetTouch(e.changedTouches[t]);
            }
            e.preventDefault();
        };

        playerElement.ontouchmove = function(e) {
            if (print_inputs) {
                console.log('touch move');
            }
            emitTouchData("TouchMove", e.touches);
            e.preventDefault();
        };
    }
}

// Browser keys do not have a charCode so we only need to test keyCode.
function isKeyCodeBrowserKey(keyCode) {
    // Function keys or tab key.
    return keyCode >= 112 && keyCode <= 123 || keyCode === 9;
}

// Must be kept in sync with JavaScriptKeyCodeToFKey C++ array. The index of the
// entry in the array is the special key code given below.
const SpecialKeyCodes = {
    BackSpace: 8,
    Shift: 16,
    Control: 17,
    Alt: 18,
    RightShift: 253,
    RightControl: 254,
    RightAlt: 255
};

// We want to be able to differentiate between left and right versions of some
// keys.
function getKeyCode(e) {
    if (e.keyCode === SpecialKeyCodes.Shift && e.code === 'ShiftRight') return SpecialKeyCodes.RightShift;
    else if (e.keyCode === SpecialKeyCodes.Control && e.code === 'ControlRight') return SpecialKeyCodes.RightControl;
    else if (e.keyCode === SpecialKeyCodes.Alt && e.code === 'AltRight') return SpecialKeyCodes.RightAlt;
    else return e.keyCode;
}

function registerKeyboardEvents() {
    document.onkeydown = function(e) {
        if (print_inputs) {
            console.log(`key down ${e.keyCode}, repeat = ${e.repeat}`);
        }
        toStreamerHandlers.KeyDown("KeyDown", [getKeyCode(e), e.repeat]);
        activeKeys.push(getKeyCode(e));
        // Backspace is not considered a keypress in JavaScript but we need it
        // to be so characters may be deleted in a UE text entry field.
        if (e.keyCode === SpecialKeyCodes.BackSpace) {
            document.onkeypress({
                charCode: SpecialKeyCodes.BackSpace
            });
        }
        if (inputOptions.suppressBrowserKeys && isKeyCodeBrowserKey(e.keyCode)) {
            e.preventDefault();
        }
    };

    document.onkeyup = function(e) {
        if (print_inputs) {
            console.log(`key up ${e.keyCode}`);
        }
        toStreamerHandlers.KeyUp("KeyUp", [getKeyCode(e), e.repeat]);
        if (inputOptions.suppressBrowserKeys && isKeyCodeBrowserKey(e.keyCode)) {
            e.preventDefault();
        }
    };

    document.onkeypress = function(e) {
        if (print_inputs) {
            console.log(`key press ${e.charCode}`);
        }
        toStreamerHandlers.KeyPress("KeyPress", [e.charCode]);
    };
}

function settingsClicked( /* e */ ) {
    /**
     * Toggle settings panel. If stats panel is already open, close it and then open settings
     */
    let settings = document.getElementById('settings-panel');
    let stats = document.getElementById('stats-panel');

    if(stats.classList.contains("panel-wrap-visible"))
    {
        stats.classList.toggle("panel-wrap-visible");
    }

    settings.classList.toggle("panel-wrap-visible");
}

function statsClicked( /* e */ ) {
    /**
     * Toggle stats panel. If settings panel is already open, close it and then open stats
     */
    let settings = document.getElementById('settings-panel');
    let stats = document.getElementById('stats-panel');

    if(settings.classList.contains("panel-wrap-visible"))
    {
        settings.classList.toggle("panel-wrap-visible");
    }

    stats.classList.toggle("panel-wrap-visible");
}



function start(isReconnection) {
    // update "quality status" to "disconnected" state
    let qualityStatus = document.getElementById("qualityStatus");
    if (qualityStatus) {
        qualityStatus.className = "grey-status";
    }


    let statsDiv = document.getElementById("stats");
    if (statsDiv) {
        statsDiv.innerHTML = 'Not connected';
    }

    if (!connect_on_load || isReconnection) {
        showConnectOverlay();
        invalidateFreezeFrameOverlay();
        shouldShowPlayOverlay = true;
        resizePlayerStyle();
    } else {
        connect();
    }
}

function connect() {
    "use strict";

    window.WebSocket = window.WebSocket || window.MozWebSocket;

    if (!window.WebSocket) {
        alert('Your browser doesn\'t support WebSocket');
        return;
    }

    // Make a new websocket connection
    let connectionUrl = window.location.href.replace('http://', 'ws://').replace('https://', 'wss://');
    console.log(`Creating a websocket connection to: ${connectionUrl}`);
    ws = new WebSocket(connectionUrl);
    ws.attemptStreamReconnection = true;

    ws.onmessagebinary = function(event) {
        if(!event || !event.data) { return; }

        event.data.text().then(function(messageString){
            // send the new stringified event back into `onmessage`
            ws.onmessage({ data: messageString });
        }).catch(function(error){
            console.error(`Failed to parse binary blob from websocket, reason: ${error}`);
        });
    }

    ws.onmessage = function(event) {

        // Check if websocket message is binary, if so, stringify it.
        if(event.data && event.data instanceof Blob) {
            ws.onmessagebinary(event);
            return;
        }

        let msg = JSON.parse(event.data);
        if (msg.type === 'config') {
            console.log("%c[Inbound SS (config)]", "background: lightblue; color: black", msg);
            onConfig(msg);
        } else if (msg.type === 'playerCount') {
            console.log("%c[Inbound SS (playerCount)]", "background: lightblue; color: black", msg);
        } else if (msg.type === 'offer') {
            console.log("%c[Inbound SS (offer)]", "background: lightblue; color: black", msg);
            if (!UrlParamsCheck('offerToReceive')) {
                onWebRtcOffer(msg);
            }
        } else if (msg.type === 'answer') {
            console.log("%c[Inbound SS (answer)]", "background: lightblue; color: black", msg);
            onWebRtcAnswer(msg);
        } else if (msg.type === 'iceCandidate') {
            onWebRtcIce(msg.candidate);
        } else if(msg.type === 'warning' && msg.warning) {
            console.warn(msg.warning);
        } else if (msg.type === 'peerDataChannels') {
            onWebRtcSFUPeerDatachannels(msg);
        } else {
            console.error("Invalid SS message type", msg.type);
        }
    };

    ws.onerror = function(event) {
        console.log(`WS error: ${JSON.stringify(event)}`);
    };

    ws.onclose = function(event) {

        closeStream();

        if(ws.attemptStreamReconnection === true){
            console.log(`WS closed: ${JSON.stringify(event.code)} - ${event.reason}`);
            if(event.reason !== "")
            {
                showTextOverlay(`DISCONNECTED: ${event.reason.toUpperCase()}`);
            }
            else
            {
                showTextOverlay(`DISCONNECTED`);
            }
            

            let reclickToStart = setTimeout(function(){
                start(true)
            }, 4000);
        }

        ws = undefined;
    };
}

// Config data received from WebRTC sender via the Cirrus web server
function onConfig(config) {
    let playerDiv = document.getElementById('player');
    let playerElement = setupWebRtcPlayer(playerDiv, config);
    resizePlayerStyle();
    registerMouse(playerElement);
}


function registerMouse(playerElement) {
    clearMouseEvents(playerElement);

    switch (inputOptions.controlScheme) {
        case ControlSchemeType.HoveringMouse:
            registerHoveringMouseEvents(playerElement);
            break;
        case ControlSchemeType.LockedMouse:
            registerLockedMouseEvents(playerElement);
            break;
        default:
            registerLockedMouseEvents(playerElement);
            break;
    }

    let player = document.getElementById("player");
    player.style.cursor = styleCursor;
}

function clearMouseEvents(playerElement) {
    playerElement.onclick = null;
    playerElement.onmousedown = null;
    playerElement.onmouseup = null;
    playerElement.onwheel = null;
    playerElement.onmousemove = null;
    playerElement.oncontextmenu = null;
}

function toggleControlScheme() {
    let schemeToggle = document.getElementById("control-scheme-text");
    
    switch (inputOptions.controlScheme) {
        case ControlSchemeType.HoveringMouse:
            inputOptions.controlScheme = ControlSchemeType.LockedMouse;
            schemeToggle.innerHTML = "Control Scheme: Locked Mouse";
            break;
        case ControlSchemeType.LockedMouse:
            inputOptions.controlScheme = ControlSchemeType.HoveringMouse;
            schemeToggle.innerHTML = "Control Scheme: Hovering Mouse";
            break;
        default:
            inputOptions.controlScheme = ControlSchemeType.LockedMouse;
            schemeToggle.innerHTML = "Control Scheme: Locked Mouse";
            console.log(`ERROR: Unknown control scheme ${inputOptions.controlScheme}, defaulting to Locked Mouse`);
            break;
    }

    console.log(`Updating control scheme to: ${inputOptions.controlScheme ? "Hovering Mouse" : "Locked Mouse"}`)
    if(webRtcPlayerObj && webRtcPlayerObj.video)
    {
        registerMouse(webRtcPlayerObj.video);
    }
}

function toggleBrowserCursorVisibility() {
    inputOptions.hideBrowserCursor = !inputOptions.hideBrowserCursor;
    styleCursor = (inputOptions.hideBrowserCursor ? 'none' : 'default');
    let player = document.getElementById("player");
    player.style.cursor = styleCursor;
}

function restartStream() {
    if(!ws){
        return;
    }
    ws.attemptStreamReconnection = false;

    let existingOnClose = ws.onclose;

    ws.onclose = function(event) {
        existingOnClose(event);
        // this is how we restart
        connect_on_load = true;
        start(false);
    }

    // Closing the websocket closes the connection to signalling server, ending the peer connection, and closing the clientside stream too.
    ws.close();
}

function closeStream() {
    console.log("----------------------Closing stream----------------------")
    if (webRtcPlayerObj) {
        // Remove video element from the page.
        let playerDiv = document.getElementById('player');
        if(playerDiv){
            playerDiv.removeChild(webRtcPlayerObj.video);
        }
        let outer = document.getElementById("outer");
        let middle = document.getElementById("middle");
        let inner = document.getElementById("inner");
        let dot = document.getElementById("dot");

        outer.style.fill = middle.style.fill = inner.style.fill = dot.style.fill = "#3c3b40";
        let qualityText = document.getElementById("qualityText");
        qualityText.innerHTML = 'Not connected';
        // Close the peer connection and associated webrtc machinery.
        webRtcPlayerObj.close();
        webRtcPlayerObj = undefined;
    }
}

function load() {
    parseURLParams();
    setupHtmlEvents();
    registerMessageHandlers();
    populateDefaultProtocol();
    setupFreezeFrameOverlay();
    registerKeyboardEvents();
    // Example response event listener that logs to console
    addResponseEventListener('logListener', (response) => {console.log(`Received response message from streamer: "${response}"`)})
    start(false);
}
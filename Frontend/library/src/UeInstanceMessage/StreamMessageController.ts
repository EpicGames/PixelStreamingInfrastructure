// Copyright Epic Games, Inc. All Rights Reserved.

import { TwoWayMap } from './TwoWayMap';
import { Logger } from '../Logger/Logger';

export class ToStreamerMessage {
    id: number;
    byteLength: number;
    structure?: Array<string>;
}

export class StreamMessageController {
    toStreamerHandlers: Map<
        string,
        (messageData?: Array<number> | undefined) => void
    >;
    fromStreamerHandlers: Map<
        string,
        (messageType: string, messageData?: ArrayBuffer | undefined) => void
    >;
    //                              Type      Format
    toStreamerMessages: TwoWayMap<string, ToStreamerMessage>;
    //                              Type     ID
    fromStreamerMessages: TwoWayMap<string, number>;

    constructor() {
        this.toStreamerHandlers = new Map();
        this.fromStreamerHandlers = new Map();
        this.toStreamerMessages = new TwoWayMap();
        this.fromStreamerMessages = new TwoWayMap();
    }

    /**
     * Populate the Default message protocol
     */
    populateDefaultProtocol() {
        /*
         * Control Messages. Range = 0..49.
         */
        this.toStreamerMessages.add('IFrameRequest', {
            id: 0,
            byteLength: 0,
            structure: []
        });
        this.toStreamerMessages.add('RequestQualityControl', {
            id: 1,
            byteLength: 0,
            structure: []
        });
        this.toStreamerMessages.add('FpsRequest', {
            id: 2,
            byteLength: 0,
            structure: []
        });
        this.toStreamerMessages.add('AverageBitrateRequest', {
            id: 3,
            byteLength: 0,
            structure: []
        });
        this.toStreamerMessages.add('StartStreaming', {
            id: 4,
            byteLength: 0,
            structure: []
        });
        this.toStreamerMessages.add('StopStreaming', {
            id: 5,
            byteLength: 0,
            structure: []
        });
        this.toStreamerMessages.add('LatencyTest', {
            id: 6,
            byteLength: 0,
            structure: []
        });
        this.toStreamerMessages.add('RequestInitialSettings', {
            id: 7,
            byteLength: 0,
            structure: []
        });
        this.toStreamerMessages.add('TestEcho', {
            id: 8,
            byteLength: 0,
            structure: []
        });
        /*
         * Input Messages. Range = 50..89.
         */
        // Generic Input Messages. Range = 50..59.
        this.toStreamerMessages.add('UIInteraction', {
            id: 50,
            byteLength: 0,
            structure: []
        });
        this.toStreamerMessages.add('Command', {
            id: 51,
            byteLength: 0,
            structure: []
        });
        // Keyboard Input Message. Range = 60..69.
        this.toStreamerMessages.add('KeyDown', {
            id: 60,
            byteLength: 2,
            //            keyCode  isRepeat
            structure: ['uint8', 'uint8']
        });
        this.toStreamerMessages.add('KeyUp', {
            id: 61,
            byteLength: 1,
            //            keyCode
            structure: ['uint8']
        });
        this.toStreamerMessages.add('KeyPress', {
            id: 62,
            byteLength: 2,
            //            charcode
            structure: ['uint16']
        });
        // Mouse Input Messages. Range = 70..79.
        this.toStreamerMessages.add('MouseEnter', {
            id: 70,
            byteLength: 0,
            structure: []
        });
        this.toStreamerMessages.add('MouseLeave', {
            id: 71,
            byteLength: 0,
            structure: []
        });
        this.toStreamerMessages.add('MouseDown', {
            id: 72,
            byteLength: 5,
            //              button     x         y
            structure: ['uint8', 'uint16', 'uint16']
        });
        this.toStreamerMessages.add('MouseUp', {
            id: 73,
            byteLength: 5,
            //              button     x         y
            structure: ['uint8', 'uint16', 'uint16']
        });
        this.toStreamerMessages.add('MouseMove', {
            id: 74,
            byteLength: 8,
            //              x           y      deltaX    deltaY
            structure: ['uint16', 'uint16', 'int16', 'int16']
        });
        this.toStreamerMessages.add('MouseWheel', {
            id: 75,
            byteLength: 6,
            //              delta       x        y
            structure: ['int16', 'uint16', 'uint16']
        });
        this.toStreamerMessages.add('MouseDouble', {
            id: 76,
            byteLength: 5,
            //              button     x         y
            structure: ['uint8', 'uint16', 'uint16']
        });
        // Touch Input Messages. Range = 80..89.
        this.toStreamerMessages.add('TouchStart', {
            id: 80,
            byteLength: 8,
            //          numtouches(1)   x       y        idx     force     valid
            structure: ['uint8', 'uint16', 'uint16', 'uint8', 'uint8', 'uint8']
        });
        this.toStreamerMessages.add('TouchEnd', {
            id: 81,
            byteLength: 8,
            //          numtouches(1)   x       y        idx     force     valid
            structure: ['uint8', 'uint16', 'uint16', 'uint8', 'uint8', 'uint8']
        });
        this.toStreamerMessages.add('TouchMove', {
            id: 82,
            byteLength: 8,
            //          numtouches(1)   x       y       idx      force     valid
            structure: ['uint8', 'uint16', 'uint16', 'uint8', 'uint8', 'uint8']
        });
        // Gamepad Input Messages. Range = 90..99
        this.toStreamerMessages.add('GamepadConnected', {
            id: 93,
            byteLength: 0,
            structure: []
        });
        this.toStreamerMessages.add('GamepadButtonPressed', {
            id: 90,
            byteLength: 3,
            //            ctrlerId   button  isRepeat
            structure: ['uint8', 'uint8', 'uint8']
        });
        this.toStreamerMessages.add('GamepadButtonReleased', {
            id: 91,
            byteLength: 3,
            //            ctrlerId   button  isRepeat(0)
            structure: ['uint8', 'uint8', 'uint8']
        });
        this.toStreamerMessages.add('GamepadAnalog', {
            id: 92,
            byteLength: 10,
            //            ctrlerId   button  analogValue
            structure: ['uint8', 'uint8', 'double']
        });
        this.toStreamerMessages.add('GamepadDisconnected', {
            id: 94,
            byteLength: 1,
            //          ctrlerId
            structure: ['uint8']
        });

        this.fromStreamerMessages.add('QualityControlOwnership', 0);
        this.fromStreamerMessages.add('Response', 1);
        this.fromStreamerMessages.add('Command', 2);
        this.fromStreamerMessages.add('FreezeFrame', 3);
        this.fromStreamerMessages.add('UnfreezeFrame', 4);
        this.fromStreamerMessages.add('VideoEncoderAvgQP', 5);
        this.fromStreamerMessages.add('LatencyTest', 6);
        this.fromStreamerMessages.add('InitialSettings', 7);
        this.fromStreamerMessages.add('FileExtension', 8);
        this.fromStreamerMessages.add('FileMimeType', 9);
        this.fromStreamerMessages.add('FileContents', 10);
        this.fromStreamerMessages.add('TestEcho', 11);
        this.fromStreamerMessages.add('InputControlOwnership', 12);
        this.fromStreamerMessages.add('GamepadResponse', 13);
        this.fromStreamerMessages.add('Protocol', 255);
    }

    /**
     * Register a message handler
     * @param messageDirection - the direction of the message; toStreamer or fromStreamer
     * @param messageType - the type of the message
     * @param messageHandler - the function or method to be executed when this handler is called
     */
    registerMessageHandler(
        messageDirection: MessageDirection,
        messageType: string,
        messageHandler: (messageData?: unknown | undefined) => void
    ) {
        switch (messageDirection) {
            case MessageDirection.ToStreamer:
                this.toStreamerHandlers.set(messageType, messageHandler);
                break;
            case MessageDirection.FromStreamer:
                this.fromStreamerHandlers.set(messageType, messageHandler);
                break;
            default:
                Logger.Log(
                    Logger.GetStackTrace(),
                    `Unknown message direction ${messageDirection}`
                );
        }
    }
}

/**
 * The enum for message directions
 */
export enum MessageDirection {
    ToStreamer = 0,
    FromStreamer = 1
}

// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '../Logger/Logger';

export class ToStreamerMessage {
    id: number;
    structure?: Array<string>;
}

export class StreamMessageController {
    toStreamerHandlers: Map<
        string,
        (messageData?: Array<number | string> | undefined) => void
    >;
    fromStreamerHandlers: Map<
        string,
        (messageType: string, messageData?: ArrayBuffer | undefined) => void
    >;
    //                        Type      Format
    toStreamerMessages: Map<string, ToStreamerMessage>;
    //                         ID      Type
    fromStreamerMessages: Map<number, string>;

    constructor() {
        this.toStreamerHandlers = new Map();
        this.fromStreamerHandlers = new Map();
        this.toStreamerMessages = new Map();
        this.fromStreamerMessages = new Map();
    }

    /**
     * Populate the Default message protocol
     */
    populateDefaultProtocol() {
        /*
         * Control Messages. Range = 0..49.
         */
        this.toStreamerMessages.set('IFrameRequest', {
            id: 0,
            structure: []
        });
        this.toStreamerMessages.set('RequestQualityControl', {
            id: 1,
            structure: []
        });
        this.toStreamerMessages.set('FpsRequest', {
            id: 2,
            structure: []
        });
        this.toStreamerMessages.set('AverageBitrateRequest', {
            id: 3,
            structure: []
        });
        this.toStreamerMessages.set('StartStreaming', {
            id: 4,
            structure: []
        });
        this.toStreamerMessages.set('StopStreaming', {
            id: 5,
            structure: []
        });
        this.toStreamerMessages.set('LatencyTest', {
            id: 6,
            structure: ['string']
        });
        this.toStreamerMessages.set('RequestInitialSettings', {
            id: 7,
            structure: []
        });
        this.toStreamerMessages.set('TestEcho', {
            id: 8,
            structure: []
        });
        this.toStreamerMessages.set('DataChannelLatencyTest', {
            id: 9,
            structure: []
        });
        /*
         * Input Messages. Range = 50..89.
         */
        // Generic Input Messages. Range = 50..59.
        this.toStreamerMessages.set('UIInteraction', {
            id: 50,
            structure: ['string']
        });
        this.toStreamerMessages.set('Command', {
            id: 51,
            structure: ['string']
        });
        // Keyboard Input Message. Range = 60..69.
        this.toStreamerMessages.set('KeyDown', {
            id: 60,
            //            keyCode  isRepeat
            structure: ['uint8', 'uint8']
        });
        this.toStreamerMessages.set('KeyUp', {
            id: 61,
            //            keyCode
            structure: ['uint8']
        });
        this.toStreamerMessages.set('KeyPress', {
            id: 62,
            //            charcode
            structure: ['uint16']
        });
        // Mouse Input Messages. Range = 70..79.
        this.toStreamerMessages.set('MouseEnter', {
            id: 70,
            structure: []
        });
        this.toStreamerMessages.set('MouseLeave', {
            id: 71,
            structure: []
        });
        this.toStreamerMessages.set('MouseDown', {
            id: 72,
            //              button     x         y
            structure: ['uint8', 'uint16', 'uint16']
        });
        this.toStreamerMessages.set('MouseUp', {
            id: 73,
            //              button     x         y
            structure: ['uint8', 'uint16', 'uint16']
        });
        this.toStreamerMessages.set('MouseMove', {
            id: 74,
            //              x           y      deltaX    deltaY
            structure: ['uint16', 'uint16', 'int16', 'int16']
        });
        this.toStreamerMessages.set('MouseWheel', {
            id: 75,
            //              delta       x        y
            structure: ['int16', 'uint16', 'uint16']
        });
        this.toStreamerMessages.set('MouseDouble', {
            id: 76,
            //              button     x         y
            structure: ['uint8', 'uint16', 'uint16']
        });
        // Touch Input Messages. Range = 80..89.
        this.toStreamerMessages.set('TouchStart', {
            id: 80,
            //          numtouches(1)   x       y        idx     force     valid
            structure: ['uint8', 'uint16', 'uint16', 'uint8', 'uint8', 'uint8']
        });
        this.toStreamerMessages.set('TouchEnd', {
            id: 81,
            //          numtouches(1)   x       y        idx     force     valid
            structure: ['uint8', 'uint16', 'uint16', 'uint8', 'uint8', 'uint8']
        });
        this.toStreamerMessages.set('TouchMove', {
            id: 82,
            //          numtouches(1)   x       y       idx      force     valid
            structure: ['uint8', 'uint16', 'uint16', 'uint8', 'uint8', 'uint8']
        });
        // Gamepad Input Messages. Range = 90..99
        this.toStreamerMessages.set('GamepadConnected', {
            id: 93,
            structure: []
        });
        this.toStreamerMessages.set('GamepadButtonPressed', {
            id: 90,
            //         ctrlerId   button  isRepeat
            structure: ['uint8', 'uint8', 'uint8']
        });
        this.toStreamerMessages.set('GamepadButtonReleased', {
            id: 91,
            //         ctrlerId   button  isRepeat(0)
            structure: ['uint8', 'uint8', 'uint8']
        });
        this.toStreamerMessages.set('GamepadAnalog', {
            id: 92,
            //         ctrlerId   button  analogValue
            structure: ['uint8', 'uint8', 'double']
        });
        this.toStreamerMessages.set('GamepadDisconnected', {
            id: 94,
            //          ctrlerId
            structure: ['uint8']
        });

        this.fromStreamerMessages.set(0, 'QualityControlOwnership');
        this.fromStreamerMessages.set(1, 'Response');
        this.fromStreamerMessages.set(2, 'Command');
        this.fromStreamerMessages.set(3, 'FreezeFrame');
        this.fromStreamerMessages.set(4, 'UnfreezeFrame');
        this.fromStreamerMessages.set(5, 'VideoEncoderAvgQP');
        this.fromStreamerMessages.set(6, 'LatencyTest');
        this.fromStreamerMessages.set(7, 'InitialSettings');
        this.fromStreamerMessages.set(8, 'FileExtension');
        this.fromStreamerMessages.set(9, 'FileMimeType');
        this.fromStreamerMessages.set(10, 'FileContents');
        this.fromStreamerMessages.set(11, 'TestEcho');
        this.fromStreamerMessages.set(12, 'InputControlOwnership');
        this.fromStreamerMessages.set(13, 'GamepadResponse');
        this.fromStreamerMessages.set(14, 'DataChannelLatencyTest');
        this.fromStreamerMessages.set(255, 'Protocol');
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

import { DataChannelController } from "../DataChannel/DataChannelController";
import { Logger } from "../Logger/Logger";
import { UeDataMessage } from "./UeDataMessage";

export class StreamMessageController extends UeDataMessage {
    toStreamerHandlers: Map<string, (messageType: any, messageData?: any[] | undefined) => void>;
    fromStreamerHandlers: Map<string, (messageType: any, messageData?: any[] | undefined) => void>;

    toStreamerMessages: TwoWayMap;
    fromStreamerMessages: TwoWayMap;

    /**
    * @param datachannelController - Data Channel Controller
    */
    constructor(datachannelController: DataChannelController) {
        super(datachannelController);
        this.toStreamerMessages = new TwoWayMap();
        this.fromStreamerMessages = new TwoWayMap();
    }

    populateDefaultProtocol() {
        /*
         * Control Messages. Range = 0..49.
         */
        this.toStreamerMessages.add("IFrameRequest", {
            "id": 0,
            "byteLength": 0,
            "structure": []
        });
        this.toStreamerMessages.add("RequestQualityControl", {
            "id": 1,
            "byteLength": 0,
            "structure": []
        });
        this.toStreamerMessages.add("FpsRequest", {
            "id": 2,
            "byteLength": 0,
            "structure": []
        });
        this.toStreamerMessages.add("AverageBitrateRequest", {
            "id": 3,
            "byteLength": 0,
            "structure": []
        });
        this.toStreamerMessages.add("StartStreaming", {
            "id": 4,
            "byteLength": 0,
            "structure": []
        });
        this.toStreamerMessages.add("StopStreaming", {
            "id": 5,
            "byteLength": 0,
            "structure": []
        });
        this.toStreamerMessages.add("LatencyTest", {
            "id": 6,
            "byteLength": 0,
            "structure": []
        });
        this.toStreamerMessages.add("RequestInitialSettings", {
            "id": 7,
            "byteLength": 0,
            "structure": []
        });
        this.toStreamerMessages.add("TestEcho", {
            "id": 8,
            "byteLength": 0,
            "structure": []
        });
        /*
         * Input Messages. Range = 50..89.
         */
        // Generic Input Messages. Range = 50..59.
        this.toStreamerMessages.add("UIInteraction", {
            "id": 50,
            "byteLength": 0,
            "structure": []
        });
        this.toStreamerMessages.add("Command", {
            "id": 51,
            "byteLength": 0,
            "structure": []
        });
        // Keyboard Input Message. Range = 60..69.
        this.toStreamerMessages.add("KeyDown", {
            "id": 60,
            "byteLength": 2,
            //            keyCode  isRepeat
            "structure": ["uint8", "uint8"]
        });
        this.toStreamerMessages.add("KeyUp", {
            "id": 61,
            "byteLength": 1,
            //            keyCode
            "structure": ["uint8"]
        });
        this.toStreamerMessages.add("KeyPress", {
            "id": 62,
            "byteLength": 2,
            //            charcode
            "structure": ["uint16"]
        });
        // Mouse Input Messages. Range = 70..79.
        this.toStreamerMessages.add("MouseEnter", {
            "id": 70,
            "byteLength": 0,
            "structure": []
        });
        this.toStreamerMessages.add("MouseLeave", {
            "id": 71,
            "byteLength": 0,
            "structure": []
        });
        this.toStreamerMessages.add("MouseDown", {
            "id": 72,
            "byteLength": 5,
            //              button     x         y
            "structure": ["uint8", "uint16", "uint16"]
        });
        this.toStreamerMessages.add("MouseUp", {
            "id": 73,
            "byteLength": 5,
            //              button     x         y
            "structure": ["uint8", "uint16", "uint16"]
        });
        this.toStreamerMessages.add("MouseMove", {
            "id": 74,
            "byteLength": 8,
            //              x           y      deltaX    deltaY
            "structure": ["uint16", "uint16", "int16", "int16"]
        });
        this.toStreamerMessages.add("MouseWheel", {
            "id": 75,
            "byteLength": 6,
            //              delta       x        y
            "structure": ["int16", "uint16", "uint16"]
        });
        // Touch Input Messages. Range = 80..89.
        this.toStreamerMessages.add("TouchStart", {
            "id": 80,
            "byteLength": 8,
            //          numtouches(1)   x       y        idx     force     valid
            "structure": ["uint8", "uint16", "uint16", "uint8", "uint8", "uint8"]
        });
        this.toStreamerMessages.add("TouchEnd", {
            "id": 81,
            "byteLength": 8,
            //          numtouches(1)   x       y        idx     force     valid
            "structure": ["uint8", "uint16", "uint16", "uint8", "uint8", "uint8"]
        });
        this.toStreamerMessages.add("TouchMove", {
            "id": 82,
            "byteLength": 8,
            //          numtouches(1)   x       y       idx      force     valid
            "structure": ["uint8", "uint16", "uint16", "uint8", "uint8", "uint8"]
        });
        // Gamepad Input Messages. Range = 90..99
        this.toStreamerMessages.add("GamepadButtonPressed", {
            "id": 90,
            "byteLength": 3,
            //            ctrlerId   button  isRepeat
            "structure": ["uint8", "uint8", "uint8"]
        });
        this.toStreamerMessages.add("GamepadButtonReleased", {
            "id": 91,
            "byteLength": 3,
            //            ctrlerId   button  isRepeat(0)
            "structure": ["uint8", "uint8", "uint8"]
        });
        this.toStreamerMessages.add("GamepadAnalog", {
            "id": 92,
            "byteLength": 10,
            //            ctrlerId   button  analogValue
            "structure": ["uint8", "uint8", "double"]
        });

        this.fromStreamerMessages.add("QualityControlOwnership", 0);
        this.fromStreamerMessages.add("Response", 1);
        this.fromStreamerMessages.add("Command", 2);
        this.fromStreamerMessages.add("FreezeFrame", 3);
        this.fromStreamerMessages.add("UnfreezeFrame", 4);
        this.fromStreamerMessages.add("VideoEncoderAvgQP", 5);
        this.fromStreamerMessages.add("LatencyTest", 6);
        this.fromStreamerMessages.add("InitialSettings", 7);
        this.fromStreamerMessages.add("FileExtension", 8);
        this.fromStreamerMessages.add("FileMimeType", 9);
        this.fromStreamerMessages.add("FileContents", 10);
        this.fromStreamerMessages.add("TestEcho", 11);
        this.fromStreamerMessages.add("InputControlOwnership", 12);
        this.fromStreamerMessages.add("Protocol", 255);
    }

    registerMessageHandler(messageDirection: MessageDirection, messageType: string, messageHandler: (messageType: any, messageData?: any[] | undefined) => void) {
        switch (messageDirection) {
            case MessageDirection.ToStreamer:
                this.toStreamerHandlers.set(messageType, messageHandler);
                break;
            case MessageDirection.FromStreamer:
                this.fromStreamerHandlers.set(messageType, messageHandler);
                break;
            default:
                Logger.Log(Logger.GetStackTrace(), `Unknown message direction ${messageDirection}`);
        }
    }

    emitUIInteraction(descriptor: string) {
        this.sendDescriptor("UIInteraction", descriptor);
    }

    emitCommand(descriptor: string) {
        this.sendDescriptor("Command", descriptor);
    }

    sendMessageToStreamer(messageType: string, messageData?: Array<any>) {
        if (messageData === undefined) {
            messageData = [];
        }

        let messageFormat = this.toStreamerMessages.getFromKey(messageType);
        if (messageFormat === undefined) {
            Logger.Error(Logger.GetStackTrace(), `Attempted to send a message to the streamer with message type: ${messageType}, but the frontend hasn't been configured to send such a message. Check you've added the message type in your cpp`);
            return;
        }

        let data = new DataView(new ArrayBuffer(messageFormat.byteLength + 1));
        data.setUint8(0, messageFormat.id);
        let byteOffset = 1;

        messageData.forEach((element: any, idx: any) => {
            let type = messageFormat.structure[idx];
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
        this.sendData(data.buffer);
    }

    /**
     * Send a Descriptor to the UE Instances
     * @param messageType - UE Message Type
     * @param descriptor - Descriptor Message as JSON
     */
    sendDescriptor(messageType: string, descriptor: string) {
        // Convert the descriptor object into a JSON string.
        let descriptorAsString = JSON.stringify(descriptor);
        let messageFormat = this.toStreamerMessages.getFromKey(messageType);
        if (messageFormat === undefined) {
            Logger.Error(Logger.GetStackTrace(), `Attempted to emit descriptor with message type: ${messageType}, but the frontend hasn't been configured to send such a message. Check you've added the message type in your cpp`);
        }

        Logger.Log(Logger.GetStackTrace(), "Sending: " + descriptor, 6);
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

        this.sendData(data.buffer);
    }
}

export enum MessageDirection {
    ToStreamer = 0,
    FromStreamer = 1
}

export class TwoWayMap {
    map: Map<string, any>;
    reverseMap: Map<any, string>;

    constructor(map?: Map<string, any>) {
        if (map === undefined) {
            this.map = new Map();
        } else {
            this.map = map;
        }

        this.reverseMap = new Map();
        for (const key in map) {
            const value = map.get(key);
            this.reverseMap.set(value, key);
        }
    }

    getFromKey(key: string) {
        return this.map.get(key);
    }

    getFromValue(value: any) {
        return this.reverseMap.get(value);
    }

    add(key: string, value: any) {
        this.map.set(key, value);
        this.reverseMap.set(value, key);
    }

    remove(key: string, value: any) {
        this.map.delete(key);
        this.reverseMap.delete(value);
    }

}
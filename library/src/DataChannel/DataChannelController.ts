import { Logger } from "../Logger/Logger";
import { DataChannelReceiveMessageType as DataChannelReceiveMessageType } from "./DataChannelReceiveMessageType";
import { IInitialSettings, } from "./IInitialSettings";
import { InitialSettings, } from "./InitialSettings";
import { ILatencyTestResults } from "../DataChannel/ILatencyTestResults"
import { LatencyTestResults } from "../DataChannel/LatencyTestResults"


/**
 * Handles the Sending and Receiving of messages to the UE Instance via the Data Channel
 */
export class DataChannelController {
    dataChannel: RTCDataChannel;
    peerConnection: RTCPeerConnection;
    datachannelOptions: RTCDataChannelInit;
    label: string;
    isReceivingFreezeFrame = false;
    logging: boolean;
    /**
     * To Create and Set up a Data Channel
     * @param peerConnection - The RTC Peer Connection
     * @param label - Label of the Data Channel
     * @param datachannelOptions - Optional RTC DataChannel options
     */
    createDataChannel(peerConnection: RTCPeerConnection, label: string, datachannelOptions?: RTCDataChannelInit) {
        this.logging = false;
        this.peerConnection = peerConnection;
        this.label = label;
        this.datachannelOptions = datachannelOptions;
        if (datachannelOptions == null) {
            this.datachannelOptions = {} as RTCDataChannelInit
            this.datachannelOptions.ordered = true;
        }

        this.dataChannel = this.peerConnection.createDataChannel(this.label, this.datachannelOptions);
        //We Want an Array Buffer not a blob
        this.dataChannel.binaryType = "arraybuffer";
        this.dataChannel.onopen = this.handleOnOpen.bind(this);
        this.dataChannel.onclose = this.handleOnClose.bind(this);
        this.dataChannel.onmessage = this.handleOnMessage.bind(this);
    }

    /**
     * Handles when the Data Channel is opened
     */
    handleOnOpen() {
        console.debug("Data Channel: " + this.label + " is opened.")
    }

    /**
     * Handles when the Data Channel is closed
     */
    handleOnClose() {
        console.debug("Data Channel: " + this.label + " is closed.")
    }

    /**
     * Handles when a message is received 
     * @param event - Message Event
     */
    handleOnMessage(event: MessageEvent) {
        let message = new Uint8Array(event.data);
        if (this.logging) { Logger.verboseLog("Message incoming") }
        if (this.logging) { Logger.verboseLog("Message:" + message) }
        
        //there is logic for when a freeze frame is sent;
        // if (this.isReceivingFreezeFrame) {
        //     this.onReceivingFreezeFrame(message);
        // }
        switch (message[0]) {
            case DataChannelReceiveMessageType.QualityControlOwnership: {
                Logger.verboseLog("DataChannelReceiveMessageType.QualityControlOwnership")
                let QualityOwnership = new Boolean(message[1]).valueOf();
                this.onQualityControlOwnership(QualityOwnership);
                break;
            }
            case DataChannelReceiveMessageType.Response: {
                Logger.verboseLog("DataChannelReceiveMessageType.Response");
                this.onResponse(message);
                break;
            }
            case DataChannelReceiveMessageType.Command: {
                Logger.verboseLog("DataChannelReceiveMessageType.Command");
                this.onCommand(message);
                break;
            }
            case DataChannelReceiveMessageType.FreezeFrame: {
                Logger.verboseLog("DataChannelReceiveMessageType.FreezeFrame");
                this.processFreezeFrameMessage(message);
                break;
            }
            case DataChannelReceiveMessageType.UnfreezeFrame: {
                Logger.verboseLog("DataChannelReceiveMessageType.UnfreezeFrame");
                this.isReceivingFreezeFrame = false;
                this.onUnFreezeFrame();
                break;
            }
            case DataChannelReceiveMessageType.VideoEncoderAvgQP: {
                if (this.logging) { Logger.verboseLog("DataChannelReceiveMessageType.VideoEncoderAvgQP"); }

                let AvgQP = Number(new TextDecoder("utf-16").decode(message.slice(1)));
                this.onVideoEncoderAvgQP(AvgQP);
                break;
            }
            case DataChannelReceiveMessageType.latencyTest: {
                Logger.verboseLog("DataChannelReceiveMessageType.latencyTest");
                let latencyAsString = new TextDecoder("utf-16").decode(message.slice(1));
                let iLatencyTestResults: ILatencyTestResults = JSON.parse(latencyAsString);
                let latencyTestResults: LatencyTestResults = new LatencyTestResults();
                Object.assign(latencyTestResults, iLatencyTestResults);
                latencyTestResults.processFields()
                this.onLatencyTestResult(latencyTestResults);
                break;
            }
            case DataChannelReceiveMessageType.InitialSettings: {
                Logger.verboseLog("DataChannelReceiveMessageType.InitialSettings");
                let payloadAsString = new TextDecoder("utf-16").decode(message.slice(1));
                let iInitialSettings: IInitialSettings = JSON.parse(payloadAsString);
                let initialSettings: InitialSettings = new InitialSettings();
                Object.assign(initialSettings,iInitialSettings);
                initialSettings.ueCompatible()
                Logger.verboseLog(payloadAsString);
                this.OnInitialSettings(initialSettings);
                break;
            }
            default: {
                console.error("unknown message sent on the Data channel");
                break;
            }
        }
    }

    /**
     * Fired when a Response message is sent from the UE Instance
     * @param message - Message Data Uint8Array
     */
    onResponse(message: Uint8Array) {
        Logger.verboseLog("DataChannelReceiveMessageType.Response");
        let responses = new TextDecoder("utf-16").decode(message.slice(1));
        Logger.verboseLog(responses);
        //add to response handlers 
    }

    /**
     * Fired when a Command message is sent from the UE Instance
     * @param message - Message Data Uint8Array
     */
    onCommand(message: Uint8Array) {
        Logger.verboseLog("DataChannelReceiveMessageType.Command");

        let commandAsString = new TextDecoder("utf-16").decode(message.slice(1));
        Logger.verboseLog("Data Channel Command: " + commandAsString);
        let command: InstanceCommand = JSON.parse(commandAsString);
        if (command.command === "onScreenKeyboard") {
            //show on screen Keyboard;
        }
    }

    /**
     * Send Data over the Data channel to the UE Instance
     * @param data - Message Data Array Buffer
     */
    sendData(data: ArrayBuffer) {
        if (this.dataChannel && this.dataChannel.readyState == "open") {
            this.dataChannel.send(data);
        } else {
            console.error("Message Failed: " + new Uint8Array(data));
        }
    }

    /**
     * Fired when the UE Instance updates who has Quality Ownership
     * @param hasQualityOwnership - Does the client have Quality Ownership
     */
    onQualityControlOwnership(hasQualityOwnership: boolean) { }

    /**
     * Fired when the UE Instance sends freeze frame data
     * @param message - Freeze Frame Data
     */
    processFreezeFrameMessage(message: Uint8Array) { }

    /**
     * Fired when the UE Instance sends a un Freeze Frame
     */
    onUnFreezeFrame() { }

    /**
     * Fired when the UE Instance sends the Video Encoder Avg QP
     * @param AvgQP - Avg QP
     */
    onVideoEncoderAvgQP(AvgQP: number) { }

    /**
     * Fired when the UE Instance sends Latency test Results
     * @param latencyTestResults - Latency Test Results
     */
    onLatencyTestResult(latencyTestResults: LatencyTestResults) { }

    /**
     * Fired when the UE Instance sends Initial Settings
     * @param InitialSettings - Initial Settings
     */
    OnInitialSettings(InitialSettings: InitialSettings) { }
}

export interface InstanceCommand {
    command: string;
}
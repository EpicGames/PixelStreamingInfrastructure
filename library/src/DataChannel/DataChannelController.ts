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

    /**
     * To Create and Set up a Data Channel
     * @param peerConnection - The RTC Peer Connection
     * @param label - Label of the Data Channel
     * @param datachannelOptions - Optional RTC DataChannel options
     */
    createDataChannel(peerConnection: RTCPeerConnection, label: string, datachannelOptions?: RTCDataChannelInit) {
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
        this.dataChannel.onopen = () => this.handleOnOpen();
        this.dataChannel.onclose = () => this.handleOnClose();
        this.dataChannel.onmessage = (ev: MessageEvent<any>) => this.handleOnMessage(ev);
    }

    /**
     * Handles when the Data Channel is opened
     */
    handleOnOpen() {
        Logger.Log(Logger.GetStackTrace(), "Data Channel: " + this.label + " is opened.", 7);
    }

    /**
     * Handles when the Data Channel is closed
     */
    handleOnClose() {
        Logger.Log(Logger.GetStackTrace(), "Data Channel: " + this.label + " is closed.", 7);
    }

    /**
     * Handles when a message is received 
     * @param event - Message Event
     */
    handleOnMessage(event: MessageEvent) {
        Logger.Log(Logger.GetStackTrace(), "Data Channel: " + this.label + " has received message.", 7);
    }

    /**
     * Fired when a Response message is sent from the UE Instance
     * @param message - Message Data Uint8Array
     */
    onResponse(message: Uint8Array) {
        Logger.Log(Logger.GetStackTrace(), "DataChannelReceiveMessageType.Response", 6);
        let responses = new TextDecoder("utf-16").decode(message.slice(1));
        Logger.Log(Logger.GetStackTrace(), responses, 6);
        //add to response handlers 
    }

    /**
     * Fired when a Command message is sent from the UE Instance
     * @param message - Message Data Uint8Array
     */
    onCommand(message: Uint8Array) {
        Logger.Log(Logger.GetStackTrace(), "DataChannelReceiveMessageType.Command", 6);

        let commandAsString = new TextDecoder("utf-16").decode(message.slice(1));
        Logger.Log(Logger.GetStackTrace(), "Data Channel Command: " + commandAsString, 6);
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
        // reset the afk inactivity
        this.resetAfkWarningTimerOnDataSend();

        if (this.dataChannel && this.dataChannel.readyState == "open") {
            this.dataChannel.send(data);
        } else {
            Logger.Error(Logger.GetStackTrace(), "Message Failed: " + new Uint8Array(data));
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

    /**
     * An override method for resetting the Afk warning timer when data is sent over the data channel 
     */
    resetAfkWarningTimerOnDataSend() { }
}

export interface InstanceCommand {
    command: string;
}
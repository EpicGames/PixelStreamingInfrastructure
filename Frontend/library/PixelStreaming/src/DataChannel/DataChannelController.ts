// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '../Logger/Logger';

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
     * return the current state of a datachannel controller instance
     * @returns the current DataChannelController instance
     */
    getDataChannelInstance(): DataChannelController {
        return this;
    }

    /**
     * To Create and Set up a Data Channel
     * @param peerConnection - The RTC Peer Connection
     * @param label - Label of the Data Channel
     * @param datachannelOptions - Optional RTC DataChannel options
     */
    createDataChannel(
        peerConnection: RTCPeerConnection,
        label: string,
        datachannelOptions?: RTCDataChannelInit
    ) {
        this.peerConnection = peerConnection;
        this.label = label;
        this.datachannelOptions = datachannelOptions;
        if (datachannelOptions == null) {
            this.datachannelOptions = {} as RTCDataChannelInit;
            this.datachannelOptions.ordered = true;
        }

        this.dataChannel = this.peerConnection.createDataChannel(
            this.label,
            this.datachannelOptions
        );
        this.setupDataChannel();
    }

    setupDataChannel() {
        //We Want an Array Buffer not a blob
        this.dataChannel.binaryType = 'arraybuffer';
        this.dataChannel.onopen = () => this.handleOnOpen();
        this.dataChannel.onclose = () => this.handleOnClose();
        this.dataChannel.onmessage = (ev: MessageEvent) =>
            this.handleOnMessage(ev);
        this.dataChannel.onerror = (ev: MessageEvent) => this.handleOnError(ev);
    }

    /**
     * Handles when the Data Channel is opened
     */
    handleOnOpen() {
        Logger.Log(
            Logger.GetStackTrace(),
            `Data Channel (${this.label}) opened.`,
            7
        );
    }

    /**
     * Handles when the Data Channel is closed
     */
    handleOnClose() {
        Logger.Log(
            Logger.GetStackTrace(),
            `Data Channel (${this.label}) closed.`,
            7
        );
    }

    /**
     * Handles when a message is received
     * @param event - Message Event
     */
    handleOnMessage(event: MessageEvent) {
        // Higher log level to prevent log spam with messages received
        Logger.Log(
            Logger.GetStackTrace(),
            `Data Channel (${this.label}) message: ${event}`,
            8
        );
    }

    /**
     * Handles when an error is thrown
     * @param event - Error Event
     */
    handleOnError(event: MessageEvent) {
        Logger.Log(
            Logger.GetStackTrace(),
            `Data Channel (${this.label}) error: ${event}`,
            7
        );
    }
}

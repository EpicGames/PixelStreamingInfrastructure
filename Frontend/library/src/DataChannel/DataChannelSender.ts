// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.8';
import { DataChannelController } from './DataChannelController';

/**
 * A class for sending data channel messages
 */
export class DataChannelSender {
    dataChannelProvider: DataChannelController;

    /**
     * @param dataChannelProvider - Data channel object type
     */
    constructor(dataChannelProvider: DataChannelController) {
        this.dataChannelProvider = dataChannelProvider;
    }

    canSend(): boolean {
        return (
            this.dataChannelProvider.getDataChannelInstance().dataChannel !== undefined &&
            this.dataChannelProvider.getDataChannelInstance().dataChannel.readyState === 'open'
        );
    }

    /**
     * Send Data over the Data channel to the UE Instance
     * @param data - Message Data Array Buffer
     * @param countsAsActivity - Whether sending this resets the AFK warning timer. False for messages the library
     * sends on its own, which are not the user doing anything.
     */
    sendData(data: ArrayBuffer, countsAsActivity = true) {
        const dataChannelInstance = this.dataChannelProvider.getDataChannelInstance();

        if (dataChannelInstance.dataChannel.readyState === 'open') {
            dataChannelInstance.dataChannel.send(data);
            Logger.Info(`Message Sent: ${new Uint8Array(data)}`);
            // reset the afk inactivity
            if (countsAsActivity) {
                this.resetAfkWarningTimerOnDataSend();
            }
        } else {
            Logger.Error(`Message Failed: ${new Uint8Array(data)}`);
        }
    }

    /**
     * An override method for resetting the Afk warning timer when data is sent over the data channel
     */
    resetAfkWarningTimerOnDataSend() {
        // Base Functionality: Do Nothing
    }
}

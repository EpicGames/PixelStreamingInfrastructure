// Copyright Epic Games, Inc. All Rights Reserved.

import { SendMessageController } from './SendMessageController';

export class ToStreamerMessagesController {
    sendMessageController: SendMessageController;

    /**
     * @param sendMessageController - Stream message controller instance
     */
    constructor(sendMessageController: SendMessageController) {
        this.sendMessageController = sendMessageController;
    }

    /**
     * Send Request to Take Quality Control to the UE Instance
     */
    SendRequestQualityControl() {
        this.sendMessageController.sendMessageToStreamer(
            'RequestQualityControl'
        );
    }

    /**
     * Send Max FPS Request to the UE Instance
     */
    SendMaxFpsRequest() {
        this.sendMessageController.sendMessageToStreamer('FpsRequest');
    }

    /**
     * Send Average Bitrate Request to the UE Instance
     */
    SendAverageBitrateRequest() {
        this.sendMessageController.sendMessageToStreamer(
            'AverageBitrateRequest'
        );
    }

    /**
     * Send a Start Streaming Message to the UE Instance
     */
    SendStartStreaming() {
        this.sendMessageController.sendMessageToStreamer('StartStreaming');
    }

    /**
     * Send a Stop Streaming Message to the UE Instance
     */
    SendStopStreaming() {
        this.sendMessageController.sendMessageToStreamer('StopStreaming');
    }

    /**
     * Send a Request Initial Settings to the UE Instance
     */
    SendRequestInitialSettings() {
        this.sendMessageController.sendMessageToStreamer(
            'RequestInitialSettings'
        );
    }
}

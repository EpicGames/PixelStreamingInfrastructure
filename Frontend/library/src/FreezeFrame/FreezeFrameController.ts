// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.8';
import { FreezeFrame } from './FreezeFrame';

/**
 * A class for controlling freeze frame functionality
 */
export class FreezeFrameController {
    freezeFrame: FreezeFrame;
    receiving = false;
    size = 0;
    jpeg: Uint8Array = undefined;
    valid = false;
    freezeFrameDelay = 50;
    // Chunks of the freeze frame that is arriving; joined into `jpeg` once the last one is in.
    private chunks: Uint8Array[] = [];
    private receivedBytes = 0;

    /**
     * Construct a freeze frame controller
     * @param rootDiv - the div that a freeze frame element will be injected into
     */
    constructor(rootDiv: HTMLElement) {
        this.freezeFrame = new FreezeFrame(rootDiv);
    }

    /**
     * Show the freeze frame if it is valid
     */
    showFreezeFrame() {
        if (this.valid) {
            this.freezeFrame.setElementForShow();
        }
    }

    /**
     * Hide the freeze frame and set the validity to false
     */
    hideFreezeFrame() {
        this.valid = false;
        this.freezeFrame.setElementForHide();
    }

    /**
     * Update the freeze frames image source and load it
     * @param jpeg - the freeze frame image as a byte array data
     * @param onLoadCallBack - a call back for managing if the play overlay needs to be shown or not
     */
    updateFreezeFrameAndShow(jpeg: Uint8Array, onLoadCallBack: () => void) {
        this.freezeFrame.updateImageElementSource(jpeg);
        this.freezeFrame.imageElement.onload = () => {
            this.freezeFrame.setDimensionsFromElementAndResize();
            onLoadCallBack();
        };
    }

    /**
     * Process the new freeze frame image and update it
     * @param view - the freeze frame image as a byte array data
     * @param onLoadCallBack - a call back for managing if the play overlay needs to be shown or not
     */
    processFreezeFrameMessage(view: Uint8Array, onLoadCallBack: () => void) {
        // Reset freeze frame if we got a freeze frame message and we are not "receiving" yet.
        if (!this.receiving) {
            this.receiving = true;
            this.valid = false;
            this.size = 0;
            this.jpeg = undefined;
            this.chunks = [];
            this.receivedBytes = 0;
        }

        // Extract total size of freeze frame (across all chunks)
        this.size = new DataView(view.slice(1, 5).buffer).getInt32(0, true);

        // Keep the jpeg part of the payload. The frame is joined once, when its last chunk arrives,
        // instead of reallocating the whole accumulated frame for every chunk.
        const jpegBytes = view.slice(1 + 4);
        this.chunks.push(jpegBytes);
        this.receivedBytes += jpegBytes.length;
        if (this.chunks.length === 1) {
            Logger.Info(`received first chunk of freeze frame: ${this.receivedBytes}/${this.size}`);
        }

        // Finished receiving freeze frame, we can show it now
        if (this.receivedBytes === this.size) {
            const jpeg = new Uint8Array(this.receivedBytes);
            let offset = 0;
            for (const chunk of this.chunks) {
                jpeg.set(chunk, offset);
                offset += chunk.length;
            }
            this.chunks = [];
            this.jpeg = jpeg;
            this.receiving = false;
            this.valid = true;
            Logger.Info(`received complete freeze frame ${this.size}`);
            this.updateFreezeFrameAndShow(this.jpeg, onLoadCallBack);
        }
        // We received more data than the freeze frame payload message indicate (this is an error)
        else if (this.receivedBytes > this.size) {
            Logger.Error(`received bigger freeze frame than advertised: ${this.receivedBytes}/${this.size}`);
            this.chunks = [];
            this.jpeg = undefined;
            this.receiving = false;
        }
    }
}

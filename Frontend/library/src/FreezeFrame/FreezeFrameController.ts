// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '../Logger/Logger';
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
        }

        // Extract total size of freeze frame (across all chunks)
        this.size = new DataView(view.slice(1, 5).buffer).getInt32(0, true);

        // Get the jpeg part of the payload
        const jpegBytes = view.slice(1 + 4);

        // Append to existing jpeg that holds the freeze frame
        if (this.jpeg) {
            const jpeg = new Uint8Array(this.jpeg.length + jpegBytes.length);
            jpeg.set(this.jpeg, 0);
            jpeg.set(jpegBytes, this.jpeg.length);
            this.jpeg = jpeg;
        }
        // No existing freeze frame jpeg, make one
        else {
            this.jpeg = jpegBytes;
            this.receiving = true;
            Logger.Log(
                Logger.GetStackTrace(),
                `received first chunk of freeze frame: ${this.jpeg.length}/${this.size}`,
                6
            );
        }

        // Finished receiving freeze frame, we can show it now
        if (this.jpeg.length === this.size) {
            this.receiving = false;
            this.valid = true;
            Logger.Log(
                Logger.GetStackTrace(),
                `received complete freeze frame ${this.size}`,
                6
            );
            this.updateFreezeFrameAndShow(this.jpeg, onLoadCallBack);
        }
        // We received more data than the freeze frame payload message indicate (this is an error)
        else if (this.jpeg.length > this.size) {
            Logger.Error(
                Logger.GetStackTrace(),
                `received bigger freeze frame than advertised: ${this.jpeg.length}/${this.size}`
            );
            this.jpeg = undefined;
            this.receiving = false;
        }
    }
}

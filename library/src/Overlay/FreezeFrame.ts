import { FreezeFrameOverlay } from "./FreezeFrameOverlay";
import { IFreezeFrameOverlay } from "./IFreezeFrameOverlay";

export class FreezeFrame {
    freezeFrameOverlay: IFreezeFrameOverlay;
    receiving = false;
    valid = false;
    size = 0;
    height = 0;
    width = 0;
    jpeg: Uint8Array = undefined;

    constructor() { }

    /**
    * Set the value of shouldShowPlayOverlay for this class
    * @param shouldShowPlayOverlay a boolean if the play overlay should be showing or not 
    */
    setShouldShowPlayOverlay(shouldShowPlayOverlay: boolean) {
        this.freezeFrameOverlay.shouldShowPlayOverlay = shouldShowPlayOverlay;
    }

    /**
     * Set the value of play overlay event click so it can be accessed within freeze frame
     * @param playOverlayClickEvent 
     */
    setPlayOverlayEvent(playOverlayClickEvent: EventListener){
        this.freezeFrameOverlay.playOverlayClickEvent = playOverlayClickEvent;
    }

    /**
     * Set the value of the freeze frame overlay 
     * @param freezeFrameOverlay a freeze frame overlay 
     */
    setFreezeFrameOverlay(freezeFrameOverlay: IFreezeFrameOverlay) {
        this.freezeFrameOverlay = freezeFrameOverlay;
    }

    /**
    * when we receive a freezeFrame process the byte array data 
    */
    processFreezeFrameMessage(view: Uint8Array) {
        // Reset freeze frame if we got a freeze frame message and we are not "receiving" yet.
        if (!this.receiving) {
            this.receiving = true;
            this.valid = false;
            this.size = 0;
            this.jpeg = undefined;
        }

        // Extract total size of freeze frame (across all chunks)
        this.size = (new DataView(view.slice(1, 5).buffer)).getInt32(0, true);

        // Get the jpeg part of the payload
        let jpegBytes = view.slice(1 + 4);

        // Append to existing jpeg that holds the freeze frame
        if (this.jpeg) {
            let jpeg = new Uint8Array(this.jpeg.length + jpegBytes.length);
            jpeg.set(this.jpeg, 0);
            jpeg.set(jpegBytes, this.jpeg.length);
            this.jpeg = jpeg;
        }
        // No existing freeze frame jpeg, make one
        else {
            this.jpeg = jpegBytes;
            this.receiving = true;
            console.log(`received first chunk of freeze frame: ${this.jpeg.length}/${this.size}`);
        }

        // Finished receiving freeze frame, we can show it now
        if (this.jpeg.length === this.size) {
            this.receiving = false;
            this.valid = true;
            console.log(`received complete freeze frame ${this.size}`);
            this.freezeFrameOverlay.setFreezeFrameData(this.width, this.height, this.valid, this.jpeg);
            this.freezeFrameOverlay.showFreezeFrame();
        }
        else if (this.jpeg.length > this.size) {
            // We received more data than the freeze frame payload message indicate (this is an error)
            console.error(`received bigger freeze frame than advertised: ${this.jpeg.length}/${this.size}`);
            this.jpeg = undefined;
            this.receiving = false;
            this.freezeFrameOverlay.setFreezeFrameData(this.width, this.height, this.valid, this.jpeg);
        }
    }
}
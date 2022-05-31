import { IOverlay } from "../Overlay/IOverlay";
export class freezeFrame implements IOverlay {
    protected rootDiv: HTMLDivElement;
    protected rootElement: HTMLDivElement;
    private imageElement: HTMLImageElement;

    constructor(rootDiv: HTMLDivElement) {
        this.rootDiv = rootDiv;

        // create the overlay
        this.rootElement = document.createElement('div');
        this.rootElement.id = 'freezeFrameOverlay';
        this.rootElement.style.display = 'none';
        this.rootElement.style.pointerEvents = 'none';
        this.rootElement.style.position = 'absolute';
        this.rootElement.style.zIndex = '20';

        // create the image place holder
        this.imageElement = document.createElement('img');
        this.imageElement.style.position = 'absolute';

        this.rootElement.appendChild(this.imageElement);
        this.rootElement.classList.add("hiddenState");
        this.rootDiv.appendChild(this.rootElement);
    }

    show(): void {
        throw new Error("Method not implemented.");
    }

    hide(): void {
        throw new Error("Method not implemented.");
    }

    update(){
        
    }

    resize(freezeFrameWidth: number, freezeFrameHeight: number) {
        if (freezeFrameWidth !== 0 && freezeFrameHeight !== 0) {
            let displayWidth = 0;
            let displayHeight = 0;
            let displayTop = 0;
            let displayLeft = 0;
            let checkBox = document.getElementById('enlarge-display-to-fill-window-tgl') as HTMLInputElement;;
            if (checkBox === undefined || (checkBox !== null && checkBox.checked)) {
                let windowAspectRatio = window.innerWidth / window.innerHeight;
                let videoAspectRatio = freezeFrameWidth / freezeFrameHeight;
                if (windowAspectRatio < videoAspectRatio) {
                    displayWidth = window.innerWidth;
                    displayHeight = Math.floor(window.innerWidth / videoAspectRatio);
                    displayTop = Math.floor((window.innerHeight - displayHeight) * 0.5);
                    displayLeft = 0;
                } else {
                    displayWidth = Math.floor(window.innerHeight * videoAspectRatio);
                    displayHeight = window.innerHeight;
                    displayTop = 0;
                    displayLeft = Math.floor((window.innerWidth - displayWidth) * 0.5);
                }
            } else {
                // Video is coming in at native resolution, we care more about the player size
                let playerAspectRatio = this.rootDiv.offsetWidth / this.rootDiv.offsetHeight;
                let videoAspectRatio = freezeFrameWidth / freezeFrameHeight;
                if (playerAspectRatio < videoAspectRatio) {
                    displayWidth = this.rootDiv.offsetWidth;
                    displayHeight = Math.floor(this.rootDiv.offsetWidth / videoAspectRatio);
                    displayTop = Math.floor((this.rootDiv.offsetHeight - displayHeight) * 0.5);
                    displayLeft = 0;
                } else {
                    displayWidth = Math.floor(this.rootDiv.offsetHeight * videoAspectRatio);
                    displayHeight = this.rootDiv.offsetHeight;
                    displayTop = 0;
                    displayLeft = Math.floor((this.rootDiv.offsetWidth - displayWidth) * 0.5);
                }
            }
            this.rootElement.style.width = this.rootDiv.offsetWidth + 'px';
            this.rootElement.style.height = this.rootDiv.offsetHeight + 'px';
            this.rootElement.style.left = 0 + 'px';
            this.rootElement.style.top = 0 + 'px';

            this.imageElement.style.width = displayWidth + 'px';
            this.imageElement.style.height = displayHeight + 'px';
            this.imageElement.style.left = displayLeft + 'px';
            this.imageElement.style.top = displayTop + 'px';
        }
    }

    /**
     * Override for checking if the video is enabled
     */
    setVideoEnabled(enabled: boolean) { }

    /**
     * Override for checking if the videoPlayer exists
     */
    checkIfVideoExists() { }

    /**
     * Override for calling resizePlayerStyle from the UiController
     */
    resizePlayerStyle() { }
}

export class FreezeFrameLogic {
    receiving = false;
    size = 0;
    jpeg: Uint8Array = undefined;
    height = 0;
    width = 0;
    valid = false;

    freezeFrame: freezeFrame;

    constructor() { }

    /**
     * resize the freezeFrame accordingly with the screen size
     */


    /**
    * when we receive a freezeFrame process the byte array data 
    */
    processFreezeFrameMessage(view: Uint8Array) {
        // Reset freeze frame if we got a freeze frame message and we are not "receiving" yet.
        if (!this.freezeFrame.receiving) {
            this.freezeFrame.receiving = true;
            this.freezeFrame.valid = false;
            this.freezeFrame.size = 0;
            this.freezeFrame.jpeg = undefined;
        }

        // Extract total size of freeze frame (across all chunks)
        this.freezeFrame.size = (new DataView(view.slice(1, 5).buffer)).getInt32(0, true);

        // Get the jpeg part of the payload
        let jpegBytes = view.slice(1 + 4);

        // Append to existing jpeg that holds the freeze frame
        if (this.freezeFrame.jpeg) {
            let jpeg = new Uint8Array(this.freezeFrame.jpeg.length + jpegBytes.length);
            jpeg.set(this.freezeFrame.jpeg, 0);
            jpeg.set(jpegBytes, this.freezeFrame.jpeg.length);
            this.freezeFrame.jpeg = jpeg;
        }
        // No existing freeze frame jpeg, make one
        else {
            this.freezeFrame.jpeg = jpegBytes;
            this.freezeFrame.receiving = true;
            console.log(`received first chunk of freeze frame: ${this.freezeFrame.jpeg.length}/${this.freezeFrame.size}`);
        }

        // Uncomment for debug
        //console.log(`Received freeze frame chunk: ${freezeFrame.jpeg.length}/${freezeFrame.size}`);

        // Finished receiving freeze frame, we can show it now
        if (this.freezeFrame.jpeg.length === this.freezeFrame.size) {
            this.freezeFrame.receiving = false;
            this.freezeFrame.valid = true;
            console.log(`received complete freeze frame ${this.freezeFrame.size}`);
            this.showFreezeFrame();
        }
        // We received more data than the freeze frame payload message indicate (this is an error)
        else if (this.freezeFrame.jpeg.length > this.freezeFrame.size) {
            console.error(`received bigger freeze frame than advertised: ${this.freezeFrame.jpeg.length}/${this.freezeFrame.size}`);
            this.freezeFrame.jpeg = undefined;
            this.freezeFrame.receiving = false;
        }
    }

    /**
    * show the freezeFrame overlay 
    */
    showFreezeFrameOverlay() {
        if (this.freezeFrame.valid) {
            this.freezeFrameOverlay.classList.add("freezeframeBackground");
            this.freezeFrameOverlay.style.display = 'block';
        }
    }

    /**
    * Remove and hide the freezeFrame overlay 
    */
    invalidateFreezeFrameOverlay() {
        this.freezeFrameOverlay.style.display = 'none';
        this.freezeFrame.valid = false;
        this.freezeFrameOverlay.classList.remove("freezeframeBackground");
        if (this.checkIfVideoExists) {
            this.setVideoEnabled(true);
        }
    }

    /**
     * Show the actual freeze frame Image from the byte array data  
     */
    showFreezeFrame() {
        let base64 = btoa(this.freezeFrame.jpeg.reduce((data, byte) => data + String.fromCharCode(byte), ''));
        this.freezeFrameImage.src = 'data:image/jpeg;base64,' + base64;
        this.freezeFrameImage.onload = function () {
            freezeFrameHeight = this.freezeFrameImage.naturalHeight;
            freezeFrameWidth = this.freezeFrameImage.naturalWidth;
            this.resizeFreezeFrameOverlay();
            if (this.iOverlayController.shouldShowPlayOverlay === true) {
                console.log("showing play overlay")
                this.iOverlayController.showPlayOverlay();
                this.resizePlayerStyle();
            } else {
                console.log("showing freeze frame")
                this.showFreezeFrameOverlay();
            }
            this.setVideoEnabled(false);
        }.bind(this);
    }

}

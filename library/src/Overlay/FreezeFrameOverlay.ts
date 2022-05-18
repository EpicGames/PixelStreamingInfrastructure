import { Overlay } from "./Overlay";
import { IFreezeFrameOverlay } from "./IFreezeFrameOverlay";

export class FreezeFrameOverlay extends Overlay implements IFreezeFrameOverlay {
    freezeFrameImage: HTMLImageElement;
    shouldShowPlayOverlay: boolean;
    freezeFrameWidth: number;
    freezeFrameHeight: number;
    freezeFrameValid: boolean;
    freezeFrameJpg: Uint8Array;

    /**
     * Set the required freeze frame object data for this class to use  
     * @param freezeFrameWidth a freeze frames width  
     * @param freezeFrameHeight a freeze frames height 
     * @param freezeFrameValid if a freeze frame is valid 
     * @param freezeFrameJpg a freeze frames jpg in a byte array 
     */
    setFreezeFrameData(freezeFrameWidth: number, freezeFrameHeight: number, freezeFrameValid: boolean, freezeFrameJpg: Uint8Array) {
        if (freezeFrameWidth != undefined) {
            this.freezeFrameWidth = freezeFrameWidth;
        }
        if (freezeFrameHeight != undefined) {
            this.freezeFrameHeight = freezeFrameHeight;
        }
        if (freezeFrameValid != undefined) {
            this.freezeFrameValid = freezeFrameValid;
        }
        if (freezeFrameJpg != undefined) {
            this.freezeFrameJpg = freezeFrameJpg;
        }
    }

    /**
     * resize the freezeFrame accordingly with the screen size
     */
    resizeFreezeFrameOverlay() {
        if (this.freezeFrameWidth !== 0 && this.freezeFrameHeight !== 0) {
            let displayWidth = 0;
            let displayHeight = 0;
            let displayTop = 0;
            let displayLeft = 0;

            // get the current status of fill display checkbox if it checked or undefined follow that logic
            let checkBox = document.getElementById('enlarge-display-to-fill-window-tgl') as HTMLInputElement;
            if (checkBox === undefined || (checkBox !== null && checkBox.checked)) {
                let windowAspectRatio = window.innerWidth / window.innerHeight;
                let videoAspectRatio = this.freezeFrameWidth / this.freezeFrameHeight;
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
                let playerAspectRatio = this.baseInsertDiv.offsetWidth / this.baseInsertDiv.offsetHeight;
                let videoAspectRatio = this.freezeFrameWidth / this.freezeFrameHeight;
                if (playerAspectRatio < videoAspectRatio) {
                    displayWidth = this.baseInsertDiv.offsetWidth;
                    displayHeight = Math.floor(this.baseInsertDiv.offsetWidth / videoAspectRatio);
                    displayTop = Math.floor((this.baseInsertDiv.offsetHeight - displayHeight) * 0.5);
                    displayLeft = 0;
                } else {
                    displayWidth = Math.floor(this.baseInsertDiv.offsetHeight * videoAspectRatio);
                    displayHeight = this.baseInsertDiv.offsetHeight;
                    displayTop = 0;
                    displayLeft = Math.floor((this.baseInsertDiv.offsetWidth - displayWidth) * 0.5);
                }
            }
            this.currentOverlayElement.style.width = this.baseInsertDiv.offsetWidth + 'px';
            this.currentOverlayElement.style.height = this.baseInsertDiv.offsetHeight + 'px';
            this.currentOverlayElement.style.left = 0 + 'px';
            this.currentOverlayElement.style.top = 0 + 'px';

            this.freezeFrameImage.style.width = displayWidth + 'px';
            this.freezeFrameImage.style.height = displayHeight + 'px';
            this.freezeFrameImage.style.left = displayLeft + 'px';
            this.freezeFrameImage.style.top = displayTop + 'px';
        }
    }

    /**
    * show the freezeFrame overlay 
    */
    showFreezeFrameOverlay() {
        if (this.freezeFrameValid) {
            this.currentOverlayElement.classList.add("freezeframeBackground");
            this.currentOverlayElement.style.display = 'block';
        }
    }

    /**
    * Remove and hide the freezeFrame overlay 
    */
    invalidateFreezeFrameOverlay() {
        this.currentOverlayElement.style.display = 'none';
        this.freezeFrameValid = false;
        this.currentOverlayElement.classList.remove("freezeframeBackground");
        if (this.checkIfVideoExists) {
            this.setVideoEnabled(true);
        }
    }

    /**
     * Show the actual freeze frame Image from the byte array data  
     */
    showFreezeFrame() {
        let base64 = btoa(this.freezeFrameJpg.reduce((data, byte) => data + String.fromCharCode(byte), ''));
        this.freezeFrameImage.src = 'data:image/jpeg;base64,' + base64;
        this.freezeFrameImage.onload = () => {
            this.freezeFrameHeight = this.freezeFrameImage.naturalHeight;
            this.freezeFrameWidth = this.freezeFrameImage.naturalWidth;
            this.resizeFreezeFrameOverlay();
            if (this.shouldShowPlayOverlay === true) {
                console.log("showing play overlay")
                this.returnNewPlayOverlay();
                this.resizePlayerStyle();
            } else {
                console.log("showing freeze frame")
                this.showFreezeFrameOverlay();
            }
            this.setVideoEnabled(false);
        };
    }

    /**
     * An override for returning a new play overlay 
     */
    returnNewPlayOverlay() { }

    /**
     * An override for checking if the video is enabled 
     */
    setVideoEnabled(enabled: boolean) { }

    /**
     * An override for checking if the videoPlayer exists
     */
    checkIfVideoExists() { }

    /**
     * An override for calling resizePlayerStyle from the UiController
     */
    resizePlayerStyle() { }

}
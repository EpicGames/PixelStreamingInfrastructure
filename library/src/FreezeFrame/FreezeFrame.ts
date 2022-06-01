/**
 * A class for managing the freeze frame object
 */
export class FreezeFrame {
    protected rootDiv: HTMLDivElement;
    protected rootElement: HTMLDivElement;
    imageElement: HTMLImageElement;
    freezeFrameHeight = 0;
    freezeFrameWidth = 0;
    enlargeDisplayToFillWindow: boolean;

    /**
     * Construct a freeze frame
     * @param rootDiv the div that a freeze frame element will be created into
     */
    constructor(rootDiv: HTMLDivElement) {
        this.rootDiv = rootDiv;

        // create the overlay
        this.rootElement = document.createElement('div');
        this.rootElement.id = 'freezeFrame';
        this.rootElement.style.display = 'none';
        this.rootElement.style.pointerEvents = 'none';
        this.rootElement.style.position = 'absolute';
        this.rootElement.style.zIndex = '20';

        // create the image place holder
        this.imageElement = document.createElement('img');
        this.imageElement.style.position = 'absolute';

        // append the image into the root element and append the element to the root div
        this.rootElement.appendChild(this.imageElement);
        this.rootDiv.appendChild(this.rootElement);
    }

    /**
     * Set the freeze frame element for showing 
     */
    setElementForShow() {
        this.rootElement.style.display = 'block';
    }

    /**
     * Set the freeze frame element for hiding 
     */
    setElementForHide() {
        this.rootElement.style.display = 'none';
    }

    /**
     * Update the freeze frames image source
     * @param jpeg the freeze frame image as a byte array data  
     */
    updateImageElementSource(jpeg: Uint8Array) {
        let base64 = btoa(jpeg.reduce((data, byte) => data + String.fromCharCode(byte), ''));
        this.imageElement.src = 'data:image/jpeg;base64,' + base64;
    }

    /**
     * Set the dimensions for the freeze frame from the element and resize it
     */
    setDimensionsFromElementAndResize() {
        this.freezeFrameHeight = this.imageElement.naturalHeight;
        this.freezeFrameWidth = this.imageElement.naturalWidth;
        this.resize();
    }

    /**
     * Resize a freeze frame element 
     */
    resize() {
        if (this.freezeFrameWidth !== 0 && this.freezeFrameHeight !== 0) {
            let displayWidth = 0;
            let displayHeight = 0;
            let displayTop = 0;
            let displayLeft = 0;
            if (this.enlargeDisplayToFillWindow === null || this.enlargeDisplayToFillWindow === true) {
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
                let playerAspectRatio = this.rootDiv.offsetWidth / this.rootDiv.offsetHeight;
                let videoAspectRatio = this.freezeFrameWidth / this.freezeFrameHeight;
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
}
/**
 * The Ui Controller class handles all methods that interact with the UI
 */
export class UiController {
    playerStyleAttributes: playerStyleAttributes;
    orientationChangeTimeout: ReturnType<typeof setTimeout>;
    lastTimeResized = new Date().getTime();
    resizeTimeout: number;

    constructor() {
        this.playerStyleAttributes = new playerStyleAttributes();
    }

    /**
     * Resizes the player element to fill the window 
     * @param playerElement - the player DOM element 
     */
    resizePlayerStyleToFillWindow(playerElement: HTMLDivElement) {
        let videoElement = playerElement.getElementsByTagName("VIDEO")[0] as HTMLVideoElement;
        // Fill the player display in window, keeping picture's aspect ratio.
        let windowAspectRatio = window.innerHeight / window.innerWidth;
        let playerAspectRatio = playerElement.clientHeight / playerElement.clientWidth;
        // We want to keep the video ratio correct for the video stream
        let videoWidth;
        let videoHeight;
        if (!videoElement === undefined) {
            videoWidth = parseInt(videoElement.getAttribute("videoWidth"));
            videoHeight = parseInt(videoElement.getAttribute("videoHeight"));
        }
        let videoAspectRatio = videoHeight / videoWidth;

        if (isNaN(videoAspectRatio)) {
            //Video is not initialised yet so set playerElement to size of window
            this.playerStyleAttributes.styleWidth = window.innerWidth;
            this.playerStyleAttributes.styleHeight = window.innerHeight;
            this.playerStyleAttributes.styleTop = 0;
            this.playerStyleAttributes.styleLeft = 0;
            playerElement.setAttribute('style', "top: " + this.playerStyleAttributes.styleTop + "px; left: " + this.playerStyleAttributes.styleLeft + "px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional);
            //playerElement.style = "top: " + this.playerStyleAttributes.styleTop + "px; left: " + this.playerStyleAttributes.styleLeft + "px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional;
        } else if (windowAspectRatio < playerAspectRatio) {
            // Window height is the constraining factor so to keep aspect ratio change width appropriately
            this.playerStyleAttributes.styleWidth = Math.floor(window.innerHeight / videoAspectRatio);
            this.playerStyleAttributes.styleHeight = window.innerHeight;
            this.playerStyleAttributes.styleTop = 0;
            this.playerStyleAttributes.styleLeft = Math.floor((window.innerWidth - this.playerStyleAttributes.styleWidth) * 0.5);
            //Video is now 100% of the playerElement, so set the playerElement style
            playerElement.setAttribute('style', "top: " + this.playerStyleAttributes.styleTop + "px; left: " + this.playerStyleAttributes.styleLeft + "px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional)
            //playerElement.style = "top: " + this.playerStyleAttributes.styleTop + "px; left: " + this.playerStyleAttributes.styleLeft + "px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional;
        } else {
            // Window width is the constraining factor so to keep aspect ratio change height appropriately
            this.playerStyleAttributes.styleWidth = window.innerWidth;
            this.playerStyleAttributes.styleHeight = Math.floor(window.innerWidth * videoAspectRatio);
            this.playerStyleAttributes.styleTop = Math.floor((window.innerHeight - this.playerStyleAttributes.styleHeight) * 0.5);
            this.playerStyleAttributes.styleLeft = 0;
            //Video is now 100% of the playerElement, so set the playerElement style
            playerElement.setAttribute('style', "top: " + this.playerStyleAttributes.styleTop + "px; left: " + this.playerStyleAttributes.styleLeft + "px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional)
            //playerElement.style = "top: " + this.playerStyleAttributes.styleTop + "px; left: " + this.playerStyleAttributes.styleLeft + "px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional;
        }
    }

    /**
     * Resizes the player element to fit the actual size of the stream
     * @param playerElement - the player DOM element
     */
    resizePlayerStyleToActualSize(playerElement: HTMLDivElement) {
        let videoElement = <HTMLVideoElement>playerElement.getElementsByTagName("VIDEO")[0];
        let videoElementLength;
        if (!videoElement === undefined) {
            videoElementLength = parseInt(videoElement.getAttribute("length"));
        }
        if (videoElementLength > 0) {
            // Display image in its actual size
            this.playerStyleAttributes.styleWidth = videoElement.videoWidth;
            this.playerStyleAttributes.styleHeight = videoElement.videoHeight;
            let Top = Math.floor((window.innerHeight - this.playerStyleAttributes.styleHeight) * 0.5);
            let Left = Math.floor((window.innerWidth - this.playerStyleAttributes.styleWidth) * 0.5);
            this.playerStyleAttributes.styleTop = (Top > 0) ? Top : 0;
            this.playerStyleAttributes.styleLeft = (Left > 0) ? Left : 0;
            //Video is now 100% of the playerElement, so set the playerElement style
            playerElement.setAttribute('style', "top: " + this.playerStyleAttributes.styleTop + "px; left: " + this.playerStyleAttributes.styleLeft + "px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional)
            //playerElement.style = "top: " + this.playerStyleAttributes.styleTop + "px; left: " + this.playerStyleAttributes.styleLeft + "px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional;
        }
    }

    /**
     * Resizes the player element to fit an arbitrary size 
     * @param playerElement - the player DOM element
     */
    resizePlayerStyleToArbitrarySize(playerElement: HTMLDivElement) {
        let videoElement = playerElement.getElementsByTagName("VIDEO")[0];
        //Video is now 100% of the playerElement, so set the playerElement style
        playerElement.setAttribute('style', "top: 0px; left: 0px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional)
        //playerElement.style = "top: 0px; left: 0px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional;
    }

    /**
     * An override for setting up the mouse and freezeFrame 
     * @param element - the player DOM element
     */
    setUpMouseAndFreezeFrame(element: HTMLDivElement) { }

    /**
     * An override for updating the video stream size
     */
    updateVideoStreamSize() { }

    /**
     * Resizes the player style based on the window height and width 
     * @returns - nil if requirements are satisfied 
     */
    resizePlayerStyle() {
        var playerElement = document.getElementById('player') as HTMLDivElement;

        if (!playerElement) {
            return;
        }

        this.updateVideoStreamSize();

        if (playerElement.classList.contains('fixed-size')) {
            this.setUpMouseAndFreezeFrame(playerElement)
            return;
        }

        let checkBox = document.getElementById('enlarge-display-to-fill-window-tgl') as HTMLInputElement;
        let videoWidth = parseInt(playerElement.getAttribute("videoWidth"))
        let videoHeight = parseInt(playerElement.getAttribute("videoHeight"))
        let windowSmallerThanPlayer = window.innerWidth < videoWidth || window.innerHeight < videoHeight;
        if (checkBox !== null) {
            if (checkBox.checked || windowSmallerThanPlayer) {
                this.resizePlayerStyleToFillWindow(playerElement);
            } else {
                this.resizePlayerStyleToActualSize(playerElement);
            }
        } else {
            this.resizePlayerStyleToArbitrarySize(playerElement);
        }

        this.setUpMouseAndFreezeFrame(playerElement)
    }

    /**
     * Registers the the resize windows tick box event 
     */
    registerResizeTickBoxEvent() {
        window.addEventListener('resize', this.resizePlayerStyle.bind(this), true);
        window.addEventListener('orientationchange', this.onOrientationChange);

        let resizeCheckBox = document.getElementById('enlarge-display-to-fill-window-tgl');
        if (resizeCheckBox !== null) {
            resizeCheckBox.onchange = function () {
                this.resizePlayerStyle();
            }.bind(this);
        }
    }

    /**
     * On the orientation change of a window clear the timeout 
     */
    onOrientationChange() {
        clearTimeout(this.orientationChangeTimeout);
        this.orientationChangeTimeout = setTimeout(() => { this.resizePlayerStyle() }, 500);
    }

}

/**
 * Handles the player style attributes so they can be instantiated
 */
export class playerStyleAttributes {
    styleWidth: number;
    styleHeight: number;
    styleTop: number;
    styleLeft: number;
    styleCursor = 'default';
    styleAdditional: number;
}
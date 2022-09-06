import { IVideoPlayer } from "../VideoPlayer/IVideoPlayer";

/**
 * The Ui Controller class handles all methods that interact with the UI
 */
export class UiController {
    videoPlayerProvider: IVideoPlayer;
    playerStyleAttributes: playerStyleAttributes;
    orientationChangeTimeout: ReturnType<typeof setTimeout>;
    lastTimeResized = new Date().getTime();
    resizeTimeout: number;
    enlargeDisplayToFillWindow: boolean;

    constructor(videoPlayerProvider: IVideoPlayer) {
        this.videoPlayerProvider = videoPlayerProvider;
        this.playerStyleAttributes = new playerStyleAttributes();

        // set resize events to the windows if it is resized or its orientation is changed
        window.addEventListener('resize', () => this.resizePlayerStyle(), true);
        window.addEventListener('orientationchange', () => this.onOrientationChange());
    }

    /**
     * Resizes the player element to fill the window 
     * @param videoElementParent - the player DOM element 
     */
    resizePlayerStyleToFillWindow(videoElementParent: HTMLDivElement) {
        let videoElement = this.videoPlayerProvider.getVideoElement();
        // Fill the player display in window, keeping picture's aspect ratio.
        let windowAspectRatio = window.innerHeight / window.innerWidth;
        let playerAspectRatio = videoElementParent.clientHeight / videoElementParent.clientWidth;
        // We want to keep the video ratio correct for the video stream
        let videoWidth;
        let videoHeight;
        if (!videoElement === undefined) {
            videoWidth = parseInt(videoElement.getAttribute("videoWidth"));
            videoHeight = parseInt(videoElement.getAttribute("videoHeight"));
        }
        let videoAspectRatio = videoHeight / videoWidth;

        if (isNaN(videoAspectRatio)) {
            //Video is not initialised yet so set videoElementParent to size of window
            this.playerStyleAttributes.styleWidth = window.innerWidth;
            this.playerStyleAttributes.styleHeight = window.innerHeight;
            this.playerStyleAttributes.styleTop = 0;
            this.playerStyleAttributes.styleLeft = 0;
            videoElementParent.setAttribute('style', "top: " + this.playerStyleAttributes.styleTop + "px; left: " + this.playerStyleAttributes.styleLeft + "px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional);
        } else if (windowAspectRatio < playerAspectRatio) {
            // Window height is the constraining factor so to keep aspect ratio change width appropriately
            this.playerStyleAttributes.styleWidth = Math.floor(window.innerHeight / videoAspectRatio);
            this.playerStyleAttributes.styleHeight = window.innerHeight;
            this.playerStyleAttributes.styleTop = 0;
            this.playerStyleAttributes.styleLeft = Math.floor((window.innerWidth - this.playerStyleAttributes.styleWidth) * 0.5);
            videoElementParent.setAttribute('style', "top: " + this.playerStyleAttributes.styleTop + "px; left: " + this.playerStyleAttributes.styleLeft + "px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional);
        } else {
            // Window width is the constraining factor so to keep aspect ratio change height appropriately
            this.playerStyleAttributes.styleWidth = window.innerWidth;
            this.playerStyleAttributes.styleHeight = Math.floor(window.innerWidth * videoAspectRatio);
            this.playerStyleAttributes.styleTop = Math.floor((window.innerHeight - this.playerStyleAttributes.styleHeight) * 0.5);
            this.playerStyleAttributes.styleLeft = 0;
            videoElementParent.setAttribute('style', "top: " + this.playerStyleAttributes.styleTop + "px; left: " + this.playerStyleAttributes.styleLeft + "px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional);
        }
    }

    /**
     * Resizes the player element to fit the actual size of the stream
     * @param videoElementParent - the player DOM element
     */
    resizePlayerStyleToActualSize(videoElementParent: HTMLDivElement) {
        let videoElement = this.videoPlayerProvider.getVideoElement();
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
            videoElementParent.setAttribute('style', "top: " + this.playerStyleAttributes.styleTop + "px; left: " + this.playerStyleAttributes.styleLeft + "px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional);
        }
    }

    /**
     * Resizes the player element to fit an arbitrary size 
     * @param videoElementParent - the player DOM element
     */
    resizePlayerStyleToArbitrarySize(videoElementParent: HTMLDivElement) {
        videoElementParent.setAttribute('style', "top: 0px; left: 0px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional);
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
        let videoElementParent = this.videoPlayerProvider.getVideoParentElement() as HTMLDivElement;

        if (!videoElementParent) {
            return;
        }

        this.updateVideoStreamSize();

        if (videoElementParent.classList.contains('fixed-size')) {
            this.setUpMouseAndFreezeFrame(videoElementParent);
            return;
        }

        // controls for resizing the player 
        let videoWidth = parseInt(videoElementParent.getAttribute("videoWidth"))
        let videoHeight = parseInt(videoElementParent.getAttribute("videoHeight"))
        let windowSmallerThanPlayer = window.innerWidth < videoWidth || window.innerHeight < videoHeight;
        if (this.enlargeDisplayToFillWindow !== null) {
            if (this.enlargeDisplayToFillWindow === true || windowSmallerThanPlayer) {
                this.resizePlayerStyleToFillWindow(videoElementParent);
            } else {
                this.resizePlayerStyleToActualSize(videoElementParent);
            }
        } else {
            this.resizePlayerStyleToArbitrarySize(videoElementParent);
        }

        this.setUpMouseAndFreezeFrame(videoElementParent);
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
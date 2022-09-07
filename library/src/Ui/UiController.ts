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
     */
    resizePlayerStyleToFillWindow() {
        let videoElement = this.videoPlayerProvider.getVideoElement();
        let videoElementParent = this.videoPlayerProvider.getVideoParentElement() as any;

        // Fill the player display in window, keeping picture's aspect ratio.
        let windowAspectRatio = window.innerHeight / window.innerWidth;
        let playerAspectRatio = videoElementParent.clientHeight / videoElementParent.clientWidth;
        // We want to keep the video ratio correct for the video stream
        let videoAspectRatio = videoElement.videoHeight / videoElement.videoWidth;
        if (isNaN(videoAspectRatio)) {
            //Video is not initialised yet so set videoElementParent to size of window
            this.playerStyleAttributes.styleWidth = window.innerWidth;
            this.playerStyleAttributes.styleHeight = window.innerHeight;
            this.playerStyleAttributes.styleTop = 0;
            this.playerStyleAttributes.styleLeft = 0;
            videoElementParent.style = "top: " + this.playerStyleAttributes.styleTop + "px; left: " + this.playerStyleAttributes.styleLeft + "px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional;
        } else if (windowAspectRatio < playerAspectRatio) {
            // Window height is the constraining factor so to keep aspect ratio change width appropriately
            this.playerStyleAttributes.styleWidth = Math.floor(window.innerHeight / videoAspectRatio);
            this.playerStyleAttributes.styleHeight = window.innerHeight;
            this.playerStyleAttributes.styleTop = 0;
            this.playerStyleAttributes.styleLeft = Math.floor((window.innerWidth - this.playerStyleAttributes.styleWidth) * 0.5);
            videoElementParent.style = "top: " + this.playerStyleAttributes.styleTop + "px; left: " + this.playerStyleAttributes.styleLeft + "px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional;
        } else {
            // Window width is the constraining factor so to keep aspect ratio change height appropriately
            this.playerStyleAttributes.styleWidth = window.innerWidth;
            this.playerStyleAttributes.styleHeight = Math.floor(window.innerWidth * videoAspectRatio);
            this.playerStyleAttributes.styleTop = Math.floor((window.innerHeight - this.playerStyleAttributes.styleHeight) * 0.5);
            this.playerStyleAttributes.styleLeft = 0;
            videoElementParent.style = "top: " + this.playerStyleAttributes.styleTop + "px; left: " + this.playerStyleAttributes.styleLeft + "px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional;
        }
    }

    /**
     * Resizes the player element to fit the actual size of the stream
     */
    resizePlayerStyleToActualSize() {
        let videoElement = this.videoPlayerProvider.getVideoElement() as any;
        let videoElementParent = this.videoPlayerProvider.getVideoParentElement() as any;

        if (videoElement.length > 0) {
            // Display image in its actual size
            this.playerStyleAttributes.styleWidth = videoElement.videoWidth;
            this.playerStyleAttributes.styleHeight = videoElement.videoHeight;
            let Top = Math.floor((window.innerHeight - this.playerStyleAttributes.styleHeight) * 0.5);
            let Left = Math.floor((window.innerWidth - this.playerStyleAttributes.styleWidth) * 0.5);
            this.playerStyleAttributes.styleTop = (Top > 0) ? Top : 0;
            this.playerStyleAttributes.styleLeft = (Left > 0) ? Left : 0;
            videoElementParent.style = "top: " + this.playerStyleAttributes.styleTop + "px; left: " + this.playerStyleAttributes.styleLeft + "px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional;
        }
    }

    /**
     * Resizes the player element to fit an arbitrary size 
     */
    resizePlayerStyleToArbitrarySize() {
        let videoElementParent = this.videoPlayerProvider.getVideoParentElement() as any;
        videoElementParent.style = "top: 0px; left: 0px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional;
    }

    /**
     * An override for setting up the mouse and freezeFrame 
     */
    setUpMouseAndFreezeFrame() { }

    /**
     * An override for updating the video stream size
     */
    updateVideoStreamSize() { }

    /**
     * Resizes the player style based on the window height and width 
     * @returns - nil if requirements are satisfied 
     */
    resizePlayerStyle() {
        let videoElementParent = this.videoPlayerProvider.getVideoParentElement() as any;

        if (!videoElementParent) {
            return;
        }

        this.updateVideoStreamSize();

        if (videoElementParent.classList.contains('fixed-size')) {
            this.setUpMouseAndFreezeFrame();
            return;
        }

        // controls for resizing the player 
        let windowSmallerThanPlayer = window.innerWidth < videoElementParent.videoWidth || window.innerHeight < videoElementParent.videoHeight;
        console.log(this.enlargeDisplayToFillWindow);
        if (this.enlargeDisplayToFillWindow !== null) {
            if (this.enlargeDisplayToFillWindow === true || windowSmallerThanPlayer) {
                console.log("resize to fill");
                this.resizePlayerStyleToFillWindow();
            } else {
                console.log("resize to actual");
                this.resizePlayerStyleToActualSize();
            }
        } else {
            console.log("resize to arbitrary");
            this.resizePlayerStyleToArbitrarySize();
        }

        this.setUpMouseAndFreezeFrame();
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
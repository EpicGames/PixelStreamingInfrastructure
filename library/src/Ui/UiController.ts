import { IVideoPlayer } from "../VideoPlayer/IVideoPlayer";
import { PlayerStyleAttributes } from "./PlayerStyleAttributes";

/**
 * The Ui Controller class handles all methods that interact with the UI
 */
export class UiController {
    videoPlayerProvider: IVideoPlayer;
    playerStyleAttributes: PlayerStyleAttributes;
    orientationChangeTimeout: ReturnType<typeof setTimeout>;
    lastTimeResized = new Date().getTime();
    resizeTimeout: number;
    enlargeDisplayToFillWindow = true;

    /**
     * @param videoPlayerProvider Video Player instance  
     * @param playerStyleAttributes Player style attributes instance 
     */
    constructor(videoPlayerProvider: IVideoPlayer, playerStyleAttributes: PlayerStyleAttributes) {
        this.videoPlayerProvider = videoPlayerProvider;
        this.playerStyleAttributes = playerStyleAttributes;

        // set resize events to the windows if it is resized or its orientation is changed
        window.addEventListener('resize', () => this.resizePlayerStyle(), true);
        window.addEventListener('orientationchange', () => this.onOrientationChange());
    }

    /**
     * Resizes the player element to fill the parent element 
     */
    resizePlayerStyleToFillParentElement() {
        const videoElement = this.videoPlayerProvider.getVideoElement();
        const videoElementParent = this.videoPlayerProvider.getVideoParentElement() as any;

        // Fill the player display in window, keeping picture's aspect ratio.
		const elementAspectRatio = videoElementParent.innerHeight / videoElementParent.innerWidth;
        const playerAspectRatio = videoElementParent.clientHeight / videoElementParent.clientWidth;
        // We want to keep the video ratio correct for the video stream
        const videoAspectRatio = videoElement.videoHeight / videoElement.videoWidth;
        if (isNaN(videoAspectRatio)) {
            //Video is not initialised yet so set videoElementParent to size of parent element
			this.playerStyleAttributes.styleWidth = videoElementParent.innerWidth;
			this.playerStyleAttributes.styleHeight = videoElementParent.innerHeight;
			this.playerStyleAttributes.styleTop = 0;
			this.playerStyleAttributes.styleLeft = 0;
            videoElementParent.style = "top: " + this.playerStyleAttributes.styleTop + "px; left: " + this.playerStyleAttributes.styleLeft + "px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional;
		} else if (elementAspectRatio < playerAspectRatio) {
            // Parent element height is the constraining factor so to keep aspect ratio change width appropriately
			this.playerStyleAttributes.styleWidth = Math.floor(videoElementParent.innerHeight / videoAspectRatio);
			this.playerStyleAttributes.styleHeight = videoElementParent.innerHeight;
            this.playerStyleAttributes.styleTop = 0;
			this.playerStyleAttributes.styleLeft = Math.floor((videoElementParent.innerWidth - this.playerStyleAttributes.styleWidth) * 0.5);
            videoElementParent.style = "top: " + this.playerStyleAttributes.styleTop + "px; left: " + this.playerStyleAttributes.styleLeft + "px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional;
        } else {
            // Parent element width is the constraining factor so to keep aspect ratio change height appropriately
			this.playerStyleAttributes.styleWidth = videoElementParent.innerWidth;
			this.playerStyleAttributes.styleHeight = Math.floor(videoElementParent.innerWidth * videoAspectRatio);
			this.playerStyleAttributes.styleTop = Math.floor((videoElementParent.innerHeight - this.playerStyleAttributes.styleHeight) * 0.5);
            this.playerStyleAttributes.styleLeft = 0;
            videoElementParent.style = "top: " + this.playerStyleAttributes.styleTop + "px; left: " + this.playerStyleAttributes.styleLeft + "px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional;
        }
    }

    /**
     * Resizes the player element to fit the actual size of the stream
     */
    resizePlayerStyleToActualSize() {
        const videoElement = this.videoPlayerProvider.getVideoElement() as any;
        const videoElementParent = this.videoPlayerProvider.getVideoParentElement() as any;

        if (videoElement) {
            // Display image in its actual size
            this.playerStyleAttributes.styleWidth = videoElement.videoWidth;
            this.playerStyleAttributes.styleHeight = videoElement.videoHeight;
            const Top = Math.floor((window.innerHeight - this.playerStyleAttributes.styleHeight) * 0.5);
            const Left = Math.floor((window.innerWidth - this.playerStyleAttributes.styleWidth) * 0.5);
            this.playerStyleAttributes.styleTop = (Top > 0) ? Top : 0;
            this.playerStyleAttributes.styleLeft = (Left > 0) ? Left : 0;
            videoElementParent.style = "top: " + this.playerStyleAttributes.styleTop + "px; left: " + this.playerStyleAttributes.styleLeft + "px; width: " + this.playerStyleAttributes.styleWidth + "px; height: " + this.playerStyleAttributes.styleHeight + "px; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional;
        }
    }

    /**
     * Resizes the player element to fit an arbitrary size 
     */
    resizePlayerStyleToArbitrarySize() {
        const videoElementParent = this.videoPlayerProvider.getVideoParentElement() as any;
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
        const videoElementParent = this.videoPlayerProvider.getVideoParentElement() as any;

        if (!videoElementParent) {
            return;
        }

        this.updateVideoStreamSize();

        if (videoElementParent.classList.contains('fixed-size')) {
            this.setUpMouseAndFreezeFrame();
            return;
        }

        // controls for resizing the player 
        const windowSmallerThanPlayer = window.innerWidth < videoElementParent.videoWidth || window.innerHeight < videoElementParent.videoHeight;
        if (this.enlargeDisplayToFillWindow !== null) {
            if (this.enlargeDisplayToFillWindow === true || windowSmallerThanPlayer) {
                this.resizePlayerStyleToFillParentElement();
            } else {
                this.resizePlayerStyleToActualSize();
            }
        } else {
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
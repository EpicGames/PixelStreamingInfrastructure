import { VideoPlayer } from "../VideoPlayer/VideoPlayer";
import { PlayerStyleAttributes } from "./PlayerStyleAttributes";

/**
 * The Ui Controller class handles all methods that interact with the UI
 */
export class UiController {
    videoPlayerProvider: VideoPlayer;
    playerStyleAttributes: PlayerStyleAttributes;
    orientationChangeTimeout: ReturnType<typeof setTimeout>;
    lastTimeResized = new Date().getTime();
    resizeTimeout: number;

    /**
     * @param videoPlayerProvider Video Player instance  
     * @param playerStyleAttributes Player style attributes instance 
     */
    constructor(videoPlayerProvider: VideoPlayer, playerStyleAttributes: PlayerStyleAttributes) {
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
        const videoElementParent = this.videoPlayerProvider.getVideoParentElement();

		//Video is not initialised yet so set videoElementParent to size of parent element
		this.playerStyleAttributes.styleWidth = "100%";
		this.playerStyleAttributes.styleHeight = "100%";
		this.playerStyleAttributes.styleTop = 0;
		this.playerStyleAttributes.styleLeft = 0;
		videoElementParent.setAttribute("style", "top: " + this.playerStyleAttributes.styleTop + "px; left: " + this.playerStyleAttributes.styleLeft + "px; width: " + this.playerStyleAttributes.styleWidth + "; height: " + this.playerStyleAttributes.styleHeight + "; cursor: " + this.playerStyleAttributes.styleCursor + "; " + this.playerStyleAttributes.styleAdditional);
    }

    /**
     * An override for setting up the mouse and freezeFrame 
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setUpMouseAndFreezeFrame() { }

    /**
     * An override for updating the video stream size
     */
	// eslint-disable-next-line @typescript-eslint/no-empty-function
    updateVideoStreamSize() { }

    /**
     * Resizes the player style based on the window height and width 
     * @returns - nil if requirements are satisfied 
     */
    resizePlayerStyle() {
        const videoElementParent = this.videoPlayerProvider.getVideoParentElement();

        if (!videoElementParent) {
            return;
        }

        this.updateVideoStreamSize();

        if (videoElementParent.classList.contains('fixed-size')) {
            this.setUpMouseAndFreezeFrame();
            return;
        }

        // controls for resizing the player 
		this.resizePlayerStyleToFillParentElement();
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
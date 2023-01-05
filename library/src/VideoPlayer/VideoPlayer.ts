import { Config, Flags } from "../Config/Config";

/**
 * Extra types for the HTMLElement 
 */
declare global {
    interface HTMLElement {
        pressMouseButtons?(mouseEvent: MouseEvent): void;
        releaseMouseButtons?(mouseEvent: MouseEvent): void;
        mozRequestPointerLock?(): void;
    }
}

/**
 * The video player html element 
 */
export class VideoPlayer {

    private config: Config;
    private videoElem: HTMLVideoElement;

    /**
     * @param videoElementParent the html div the the video player will be injected into 
     */
    constructor(videoElemParent: HTMLElement, config: Config) {
        this.config = config;
        this.videoElem = document.createElement("video");
        this.videoElem.id = "streamingVideo";
        this.videoElem.disablePictureInPicture = true;
        this.videoElem.playsInline = true;
        this.videoElem.style.width = "100%";
        this.videoElem.style.height = "100%";
        this.videoElem.style.position = "absolute";
        this.videoElem.style.pointerEvents = "all";
        videoElemParent.appendChild(this.videoElem);

        // set play for video
        this.videoElem.onclick = () => {
            if (this.videoElem.paused) {
                this.videoElem.play();
            }
        }

		this.videoElem.onloadedmetadata = () => {
			this.onVideoInitialised();
		}
    }

    /**
     * Sets up the video element with any application config and plays the video element.
     * @returns A promise for if playing the video was successful or not.
     */
    play() : Promise<void> {
        this.videoElem.muted = this.config.isFlagEnabled(Flags.StartVideoMuted);
        this.videoElem.autoplay = this.config.isFlagEnabled(Flags.AutoPlayVideo);
        return this.videoElem.play();
    }

    /**
     * @returns True if the video element is paused.
     */
    isPaused() : boolean {
        return this.videoElem.paused;
    }

    /**
     * @returns - whether the video element is playing.
     */
    isVideoReady(): boolean {
        return this.videoElem.readyState !== undefined && this.videoElem.readyState > 0;
    }

    /** 
     * @returns True if the video element has a valid video source (srcObject).
     */
    hasVideoSource(): boolean {
        return this.videoElem.srcObject !== undefined && this.videoElem.srcObject !== null;
    }

    /**
     * Get the current context of the html video element
     * @returns - the current context of the video element
     */
    getVideoElement(): HTMLVideoElement {
        return this.videoElem;
    }

    /**
     * Get the current context of the html video elements parent
     * @returns - the current context of the video elements parent
     */
    getVideoParentElement(): HTMLElement {
        return this.videoElem.parentElement;
    }

    /**
    * Set the Video Elements src object tracks to enable
    * @param enabled - Enable Tracks on the Src Object
    */
    setVideoEnabled(enabled: boolean) {
        // this is a temporary hack until type scripts video element is updated to reflect the need for tracks on a html video element 
        const videoElement = this.videoElem as any;
        videoElement.srcObject.getTracks().forEach((track: MediaStreamTrack) => track.enabled = enabled);
    }

	/**
	 * An override for when the video has been initialised with a srcObject
	 */
	onVideoInitialised() {
		// Default Functionality: Do Nothing
	}
}
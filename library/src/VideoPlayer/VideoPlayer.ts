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
    private videoElement: HTMLVideoElement;

    /**
     * @param videoElementParent the html div the the video player will be injected into 
     * @param config the applications configuration. We're interested in the startVideoMuted flag
     */
    constructor(videoElementParent: HTMLElement, config: Config) {
        this.videoElement = document.createElement("video");
		this.config = config;
        this.videoElement.id = "streamingVideo";
        this.videoElement.disablePictureInPicture = true;
        this.videoElement.playsInline = true;
        this.videoElement.style.width = "100%";
        this.videoElement.style.height = "100%";
        this.videoElement.style.position = "absolute";
        this.videoElement.style.pointerEvents = "all";
        videoElementParent.appendChild(this.videoElement);

        // set play for video
        this.videoElement.onclick = () => {
            if (this.videoElement.paused) {
                this.videoElement.play();
            }
        }

		this.videoElement.onloadedmetadata = () => {
			this.onVideoInitialised();
		}
    }

	/**
	 * Sets up the video element with any application config and plays the video element.
	 * @returns A promise for if playing the video was successful or not.
	 */
	play(): Promise<void> {
		this.videoElement.muted = this.config.isFlagEnabled(Flags.StartVideoMuted);
		this.videoElement.autoplay = this.config.isFlagEnabled(Flags.AutoPlayVideo);
		return this.videoElement.play();
	}

	/**
	 * @returns True if the video element is paused.
	 */
	isPaused(): boolean {
		return this.videoElement.paused;
	}

    /**
     * @returns - whether the video element is playing.
     */
    isVideoReady(): boolean {
        return this.videoElement.readyState !== undefined && this.videoElement.readyState > 0;
    }

	/** 
	 * @returns True if the video element has a valid video source (srcObject).
	 */
	hasVideoSource(): boolean {
		return this.videoElement.srcObject !== undefined && this.videoElement.srcObject !== null;
	}

    /**
     * Get the current context of the html video element
     * @returns - the current context of the video element
     */
    getVideoElement(): HTMLVideoElement {
        return this.videoElement;
    }

    /**
     * Get the current context of the html video elements parent
     * @returns - the current context of the video elements parent
     */
    getVideoParentElement(): HTMLElement {
        return this.videoElement.parentElement;
    }

    /**
    * Set the Video Elements src object tracks to enable
    * @param enabled - Enable Tracks on the Src Object
    */
    setVideoEnabled(enabled: boolean) {
        // this is a temporary hack until type scripts video element is updated to reflect the need for tracks on a html video element 
        const videoElement = this.videoElement;
        (<MediaStream>videoElement.srcObject).getTracks().forEach((track: MediaStreamTrack) => track.enabled = enabled);
    }

	/**
	 * An override for when the video has been initialised with a srcObject
	 */
	onVideoInitialised() {
		// Default Functionality: Do Nothing
	}
}
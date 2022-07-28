import { IVideoPlayer } from "./IVideoPlayer";
import { Logger } from "../Logger/Logger";

export class VideoPlayer implements IVideoPlayer {
    videoElement: HTMLVideoElement;

    constructor(rootDiv: HTMLDivElement, startVideoMuted: boolean) {
        this.videoElement = document.createElement("video");
        this.videoElement.id = "streamingVideo";
        this.videoElement.muted = startVideoMuted;
        this.videoElement.disablePictureInPicture = true;
        this.videoElement.playsInline = true;
        this.videoElement.style.width = "100%";
        this.videoElement.style.height = "100%";
        this.videoElement.style.position = "absolute";
        rootDiv.appendChild(this.videoElement);
    }

    /**
     * Get the current context of the html video element
     * @returns the current context of the video element
     */
    getVideoElement(): HTMLVideoElement {
        return this.videoElement;
    }

    /**
     * Get the current context of the html video elements parent
     * @returns the current context of the video elements parent
     */
    getVideoParentElement(): HTMLElement {
        return this.videoElement.parentElement;
    }

    /**
     * Set the click actions for when the Element is mouse clicked
     * @param event - Mouse Event
     */
    setClickActions(event: MouseEvent) {
        if (this.videoElement.paused) {
            this.videoElement.play();
        }

        // minor hack to alleviate ios not supporting pointerlock
        if (this.videoElement.requestPointerLock) {
            this.videoElement.requestPointerLock();
        }
    }

    /**
    * Set the mouse enter and mouse leave events 
    */
    setMouseEnterAndLeaveEvents(mouseEnterCallBack: () => void, mouseLeaveCallBack: () => void) {
        // Handle when the Mouse has entered the element
        this.videoElement.onmouseenter = (event: MouseEvent) => {
            Logger.Log(Logger.GetStackTrace(), "Mouse Entered", 6);
            mouseEnterCallBack();
        };

        // Handles when the mouse has left the element 
        this.videoElement.onmouseleave = (event: MouseEvent) => {
            Logger.Log(Logger.GetStackTrace(), "Mouse Left", 6);
            mouseLeaveCallBack();
        };
    }

}
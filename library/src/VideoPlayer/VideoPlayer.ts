import { IVideoPlayer } from "./IVideoPlayer";

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

    getVideoElement(): HTMLVideoElement {
        return this.videoElement;
    }

    getVideoParentElement(): HTMLElement{
        return this.videoElement.parentElement;
    }

}
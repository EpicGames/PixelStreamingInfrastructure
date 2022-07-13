export interface IVideoPlayer {

    /**
     * return the video player element 
     */
    getVideoElement(): HTMLVideoElement;

    /**
     * return the video player root element 
     */
    getVideoParentElement(): HTMLElement;
}
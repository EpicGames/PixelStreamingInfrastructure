export interface IVideoPlayer {
    
    /**
     * return the video player element 
     */
    getVideoElement(): any;

    /**
     * return the video player root element 
     */
    getVideoRootElement(): HTMLElement;
}
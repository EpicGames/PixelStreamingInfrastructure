export interface IVideoPlayer {

    /**
     * return the video player element 
     */
    getVideoElement(): HTMLVideoElement;

    /**
     * return the video player root element 
     */
    getVideoParentElement(): HTMLElement;

    /**
     * Set the click actions for when the Element is mouse clicked
     * @param event - Mouse Event
     */
    setClickActions(event: MouseEvent): void;
}
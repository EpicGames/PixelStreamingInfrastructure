export interface IFreezeFrameOverlay {

    shouldShowPlayOverlay: boolean;

    /**
     * Set the required freeze frame object data for this class to use  
     * @param freezeFrameWidth a freeze frames width  
     * @param freezeFrameHeight a freeze frames height 
     * @param freezeFrameValid if a freeze frame is valid 
     * @param freezeFrameJpg a freeze frames jpg in a byte array 
     */
    setFreezeFrameData(freezeFrameWidth: number, freezeFrameHeight: number, freezeFrameValid: boolean, freezeFrameJpg: Uint8Array): void;

    /**
     * Returns a new play overlay 
     */
    returnNewPlayOverlay(): void;

    /**
     * Override for checking if the video is enabled 
     */
    setVideoEnabled(enabled: boolean): void;

    /**
     * Override for checking if the videoPlayer exists
     */
    checkIfVideoExists(): void;

    /**
     * Override for calling resizePlayerStyle from the UiController
     */
    resizePlayerStyle(): void;

    /**
     * resize the freezeFrame accordingly with the screen size
     */
    resizeFreezeFrameOverlay(): void;

    /**
    * show the freezeFrame overlay 
    */
    showFreezeFrameOverlay(): void;

    /**
    * Remove and hide the freezeFrame overlay 
    */
    invalidateFreezeFrameOverlay(): void;

    /**
     * Show the actual freeze frame Image from the byte array data  
     */
    showFreezeFrame(): void;

}
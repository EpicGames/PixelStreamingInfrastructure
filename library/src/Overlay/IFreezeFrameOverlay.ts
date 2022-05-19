export interface IFreezeFrameOverlay {

    shouldShowPlayOverlay: boolean;

    playOverlayClickEvent: EventListener;

    /**
     * Create a clickable div with text and onclick functions
     * @param baseInsertDiv the parent div element that this overlay will be inserted into 
     * @param overlayDivId the id for the base div of the overlay 
     * @param overlayDivClass the html class you are applying 
     * @param overlayHtmlElement the created html element you are applying
     * @param overlayClickEvent the event listener you are applying to your custom element     
     */
    createNewOverlayElement(baseInsertDiv: HTMLDivElement, applyOnCreation: boolean, overlayDivId?: string, overlayDivClass?: string, overlayHtmlElement?: HTMLElement, overlayClickEvent?: EventListener): void;

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
    returnNewPlayOverlay(overlayClickEvent: EventListener): void;

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
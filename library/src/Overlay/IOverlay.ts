/**
 * The interface for Overlay 
 */
export interface IOverlay {

    currentElement: HTMLDivElement;

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
     * hide the overlay by setting a hiddenState class and runs any onHideOverlay functionality 
     */
    hideOverlay(): void;

    /**
     * An override function that users can pass in custom functionality for before an overlay is shown 
     */
    beforeShowOverlay(): any;

    /**
    * An override function that users can pass in custom functionality for after an overlay has shown 
    */
    afterShowOverlay(): any;

    /**
     * An override function that users can pass in custom functionality for before an overlay is hidden 
     */
    beforeHideOverlay(): any;

    /**
    * An override function that users can pass in custom functionality for after an overlay has hidden
    */
    afterHideOverlay(): any;

    /**
     * Update an overlays div html contents 
     * @param htmlContent a string of html content you wish to replace into you div
     */
    updateOverlayContents(htmlContent: string): void;
}
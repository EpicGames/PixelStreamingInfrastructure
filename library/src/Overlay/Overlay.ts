import { IOverlay } from "./IOverlay";

export class Overlay implements IOverlay {
    baseInsertDiv: HTMLDivElement;
    currentOverlayElement: HTMLDivElement;
    //shouldShowPlayOverlay = true;

    /**
     * Create a clickable div with text and onclick functions
     * @param baseInsertDiv the parent div element that this overlay will be inserted into 
     * @param overlayDivId the id for the base div of the overlay 
     * @param overlayDivClass the html class you are applying 
     * @param overlayHtmlElement the created html element you are applying
     * @param overlayClickEvent the event listener you are applying to your custom element     
     */
    constructor(baseInsertDiv: HTMLDivElement, overlayDivId: string, overlayDivClass?: string, overlayHtmlElement?: HTMLElement, overlayClickEvent?: EventListener) {
        this.baseInsertDiv = baseInsertDiv;

        let preExistingOverlay = document.getElementById(overlayDivId) as HTMLDivElement;
        // an overlay may already exist inside its parent so lets check if not we will make a new one
        if (!this.baseInsertDiv.contains(preExistingOverlay)) {
            this.currentOverlayElement = document.createElement('div');
            this.currentOverlayElement.id = overlayDivId;
        } else {
            this.currentOverlayElement = preExistingOverlay;
        }

        // While this overlay has child elements remove them so we can add the new ones
        while (this.currentOverlayElement.lastChild) {
            this.currentOverlayElement.removeChild(this.currentOverlayElement.lastChild);
        }

        // if the user passes a custom html elements add them in
        if (overlayHtmlElement) {
            this.currentOverlayElement.appendChild(overlayHtmlElement);
        }

        // if the user passes click functionality then add an event listener to it
        if (overlayClickEvent) {
            this.addOverlayOnClickEvent(overlayClickEvent);
        }

        // If the overlay has any previous classes remove them so we can set the new ones
        this.updateOverlayClasses(overlayDivClass);

        // create into the baseInsertDiv and run any show functionality
        this.beforeShowOverlay();
        this.baseInsertDiv.appendChild(this.currentOverlayElement);
        this.afterShowOverlay();
    }

    /**
     * Add an on click event to an overlay 
     * @param overlayClickEvent the on click event to be activated
     */
    addOverlayOnClickEvent(overlayClickEvent: EventListener) {
        this.currentOverlayElement.addEventListener('click', function onOverlayClick(event: Event) {
            overlayClickEvent(event);
            this.overlay.removeEventListener('click', onOverlayClick);
        }.bind(this));
    }

    /**
     * Update all classes on an overlay 
     * @param overlayDivClass a string of html classes you wish to apply to an overlay  
     */
    updateOverlayClasses(overlayDivClass: string) {
        // If the overlay has any previous classes remove them so we can set the new ones
        let cl = this.currentOverlayElement.classList;
        for (let i = cl.length - 1; i >= 0; i--) {
            cl.remove(cl[i]);
        }

        this.currentOverlayElement.classList.add(overlayDivClass);
    }

    /**
     * hide the overlay by setting a hiddenState class and runs any onHideOverlay functionality 
     */
    hideOverlay() {
        this.beforeHideOverlay();
        this.updateOverlayClasses('hiddenState');
        this.afterHideOverlay();
    }

    /**
     * Update an overlays div html contents 
     * @param htmlContent a string of html content you wish to replace into you div
     */
    updateOverlayContents(htmlContent: string) {
        this.currentOverlayElement.innerHTML = htmlContent;
    }

    /**
     * An override function that users can pass in custom functionality for before an overlay is shown 
     */
    beforeShowOverlay() { }

    /**
     * An override function that users can pass in custom functionality for after an overlay has shown 
     */
    afterShowOverlay() { }

    /**
     * An override function that users can pass in custom functionality for before an overlay is hidden 
     */
    beforeHideOverlay() { }

    /**
     * An override function that users can pass in custom functionality for after an overlay has hidden
     */
    afterHideOverlay() { }
}

    // /**
    // * Shows the play overlay
    // *  @param event the event listener you want to activate when you click this overlay
    // */
    // showPlayOverlay(event: EventListener) {
    //     let img = document.createElement('img');
    //     img.id = 'playButton';
    //     img.src = Images.playButton;
    //     img.alt = 'Start Streaming';
    //     this.setOverlay('clickableState', img, event);
    //     this.shouldShowPlayOverlay = false;
    // }

// add a progress bar if the progress is given currently unused leaving here in case
// if (progress !== undefined) {
//     let progressBar: overlayHtmlElement = document.createElement('div');
//     progressBar.className = 'progress'
//     let progressBarInner: overlayHtmlElement = document.createElement('div');
//     progressBarInner.className = 'progress-bar progress-bar-striped active'
//     progressBarInner.style.width = progress + "%"
//     progressBar.appendChild(progressBarInner);
//     overlayHtmlElement.appendChild(progressBar);
// }

// add a spinner 
// if (progress !== undefined) {
//     let spinnerSpan: HTMLSpanElement = document.createElement('span');
//     spinnerSpan.className = "visually-hidden"
//     spinnerSpan.innerHTML = "Loading..."

//     let spinnerDiv: HTMLDivElement = document.createElement('div');
//     spinnerDiv.id = "loading-spinner"
//     spinnerDiv.className = "spinner-border ms-2"
//     spinnerDiv.setAttribute("role", "status");

//     spinnerDiv.appendChild(spinnerSpan);
//     overlayHtmlElement.appendChild(spinnerDiv);
// }
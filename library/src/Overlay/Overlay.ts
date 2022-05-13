import { Images } from "./Images";
import { IOverlay } from "./IOverlay";

export class Overlay implements IOverlay {
    baseParentDiv: HTMLDivElement;
    overlay: HTMLDivElement;
    //shouldShowPlayOverlay = true;
    //playButtonImage: string;

    /**
     * Create a clickable div with text and onclick functions
     * @param baseParentDiv the parent div element that this overlay will be inserted into 
     * @param htmlClass the html class you are applying 
     * @param htmlElement the created html element you are applying
     * @param onClickEvent the event listener you are applying to your custom element     
     */
    constructor(baseParentDiv: HTMLDivElement, htmlClass?: string, htmlElement?: HTMLElement, onClickEvent?: EventListener) {
        this.baseParentDiv = baseParentDiv;

        let preExistingOverlay = document.getElementById('videoPlayOverlay') as HTMLDivElement;
        // an overlay may already exist inside its parent so lets check if not we will make a new one
        if (!this.baseParentDiv.contains(preExistingOverlay)) {
            this.overlay = document.createElement('div');
            this.overlay.id = 'videoPlayOverlay';
        } else {
            this.overlay = preExistingOverlay;
        }

        // While this overlay has child elements remove them so we can add the new ones
        while (this.overlay.lastChild) {
            this.overlay.removeChild(this.overlay.lastChild);
        }

        // if the user passes a custom html elements add them in
        if (htmlElement) {
            this.overlay.appendChild(htmlElement);
        }

        // if the user passes click functionality then add an event listener to it
        if (onClickEvent) {
            this.addOverlayOnClickEvent(onClickEvent);
        }

        // If the overlay has any previous classes remove them so we can set the new ones
        this.updateOverlayClasses(htmlClass);

        // create into the baseParentDiv and run any show functionality
        this.beforeShowOverlay();
        this.baseParentDiv.appendChild(this.overlay);
        this.afterShowOverlay();
    }

    /**
     * Add an on click event to an overlay 
     * @param onClickEvent the on click event to be activated
     */
    addOverlayOnClickEvent(onClickEvent: EventListener) {
        this.overlay.addEventListener('click', function onOverlayClick(event: Event) {
            onClickEvent(event);
            this.overlay.removeEventListener('click', onOverlayClick);
        }.bind(this));
    }

    /**
     * Update all classes on an overlay 
     * @param htmlClass a string of html classes you wish to apply to an overlay  
     */
    updateOverlayClasses(htmlClass: string) {
        // If the overlay has any previous classes remove them so we can set the new ones
        let cl = this.overlay.classList;
        for (let i = cl.length - 1; i >= 0; i--) {
            cl.remove(cl[i]);
        }

        this.overlay.classList.add(htmlClass);
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
        this.overlay.innerHTML = htmlContent;
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

// //to show the connect overlay the overlay Event listener must be preset and passed in
    // /**
    //  * Shows the starting connect overlay
    //  * @param event the event listener you want to activate when you click this overlay
    //  */
    // showConnectOverlay(event: EventListener) {
    //     let startText = document.createElement('div');
    //     startText.id = 'playButton';
    //     startText.innerHTML = 'Click to start';
    //     this.setOverlay('clickableState', startText, event);
    // }

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
//     let progressBar: HTMLElement = document.createElement('div');
//     progressBar.className = 'progress'
//     let progressBarInner: HTMLElement = document.createElement('div');
//     progressBarInner.className = 'progress-bar progress-bar-striped active'
//     progressBarInner.style.width = progress + "%"
//     progressBar.appendChild(progressBarInner);
//     htmlElement.appendChild(progressBar);
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
//     htmlElement.appendChild(spinnerDiv);
// }
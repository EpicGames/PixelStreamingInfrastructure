import { Overlay } from "./Overlay";

export class AfkOverlay extends Overlay {
    baseInsertDiv: HTMLDivElement;
    overlayDivId: string;
    overlayDivClass: string;
    overlayHtmlElement: HTMLElement;
    overlayClickEvent: EventListener;
    afkOverlayUpdateHtml: string;
    countDown = 0;

    /**
     * Set the overlays parameters before construction
     * @param baseInsertDiv the parent div element that this overlay will be inserted into 
     * @param overlayDivId the id for the base div of the overlay
     * @param overlayDivClass the html class you are applying 
     * @param overlayHtmlElement the created html element you are applying
     * @param overlayClickEvent the event listener you are applying to your custom element 
     */
    setOverlayParameters(baseInsertDiv: HTMLDivElement, overlayDivId: string, overlayDivClass?: string, overlayHtmlElement?: HTMLElement, overlayClickEvent?: EventListener) {
        this.baseInsertDiv = baseInsertDiv;
        this.overlayDivId = overlayDivId;
        this.overlayDivClass = overlayDivClass;
        this.overlayHtmlElement = overlayHtmlElement;
        this.overlayClickEvent = overlayClickEvent;
    }

    /**
     * set the afk overlays update html text 
     * @param updateHtml 
     */
    setAfkOverlayUpdateHtml(updateHtml: string) {
        this.afkOverlayUpdateHtml = updateHtml;
    }

    /**
     * Gets the latest countDown number and updates the overlay html as the html will contain the countDown variable
     * @param countDown 
     * @param afkOverlayUpdateHtml 
     */
    updateAfkOverlayContents(countDown: number, afkOverlayUpdateHtml: string) {
        this.countDown = countDown;
        this.updateOverlayContents(afkOverlayUpdateHtml);
    }
}
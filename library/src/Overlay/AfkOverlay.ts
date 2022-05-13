import { Overlay } from "./Overlay";

export class AfkOverlay extends Overlay {
    baseParentDiv: HTMLDivElement;
    htmlClass: string;
    htmlElement: HTMLElement;
    onClickEvent: EventListener;
    afkOverlayUpdateHtml: string;
    countdown = 0;

    /**
     * Set the overlays parameters before construction
     * @param baseParentDiv the parent div element that this overlay will be inserted into 
     * @param htmlClass the html class you are applying 
     * @param htmlElement the created html element you are applying
     * @param onClickEvent the event listener you are applying to your custom element 
     */
    setOverlayParameters(baseParentDiv: HTMLDivElement, htmlClass?: string, htmlElement?: HTMLElement, onClickEvent?: EventListener) {
        this.baseParentDiv = baseParentDiv;
        this.htmlClass = htmlClass;
        this.htmlElement = htmlElement;
        this.onClickEvent = onClickEvent;
    }

    /**
     * set the afk overlays update html text 
     * @param updateHtml 
     */
    setAfkOverlayUpdateHtml(updateHtml: string) {
        this.afkOverlayUpdateHtml = updateHtml;
    }

    /**
     * Gets the latest countdown number and updates the overlay html as the html will contain the countdown variable
     * @param countdown 
     * @param afkOverlayUpdateHtml 
     */
    updateAfkOverlayContents(countdown: number, afkOverlayUpdateHtml: string) {
        this.countdown = countdown;
        this.updateOverlayContents(afkOverlayUpdateHtml);
    }
}
import * as libspsfrontend from '@tensorworks/libspsfrontend'
import { EventEmitter } from "events";
/**
 * Class for the base overlay structure 
 */
export class OverlayBase implements libspsfrontend.IOverlay {
    protected rootElement: HTMLDivElement;
    protected rootDiv: HTMLDivElement;
    public textElement: HTMLDivElement;

    /**
     * Construct an overlay 
     * @param rootDiv the root element this overlay will be inserted into 
     * @param rootElement the root element that is the overlay
     */
    protected constructor(rootDiv: HTMLDivElement, rootElement: HTMLDivElement, textElement: HTMLDivElement) {
        this.rootDiv = rootDiv;
        this.rootElement = rootElement;
        this.textElement = textElement;
        this.rootElement.appendChild(this.textElement);
        this.hide();
        this.rootDiv.appendChild(this.rootElement);
    }

    /**
     * Show the overlay 
     */
    public show(): void {
        this.rootElement.classList.remove("hiddenState");
    }

    /**
     * Hide the overlay
     */
    public hide(): void {
        this.rootElement.classList.add("hiddenState");
    }
}

/**
 * Class for the base action overlay structure 
 */
export class ActionOverlayBase extends OverlayBase implements libspsfrontend.IActionOverlay {
    eventEmitter: EventEmitter;
    contentElementSpanId: string;

    /**
     * Construct an action overlay 
     * @param rootDiv the root element this overlay will be inserted into 
     * @param rootElement the root element that is the overlay
     * @param contentElement an element that contains text for the action overlay 
     */
    public constructor(rootDiv: HTMLDivElement, rootElement: HTMLDivElement, contentElement: HTMLDivElement, contentElementSpanId?: string) {
        super(rootDiv, rootElement, contentElement);
        this.eventEmitter = new EventEmitter();
        this.contentElementSpanId = contentElementSpanId;
    }

    /**
     * Update the text overlays inner text 
     * @param text the update text to be inserted into the overlay 
     */
    public update(text: string): void {
        if ((text != null || text != undefined) && (this.contentElementSpanId != null || this.contentElementSpanId != undefined)) {
            document.getElementById(this.contentElementSpanId).innerHTML = text;
        }
    }

    /**
     * Set a method as an event emitter callback 
     * @param callBack the method that is to be called when the event is emitted 
     */
    onAction(callBack: (...args: any[]) => void) {
        this.eventEmitter.on("action", callBack);
    }

    /**
     * Activate an event that is attached to the event emitter 
     */
    activate() {
        this.eventEmitter.emit("action");
    }

}

/**
 * Class for the afk overlay base 
 */
export class AfkOverlayBase extends ActionOverlayBase implements libspsfrontend.IAfkOverlay {
    private countDownSpanElementId: string;

    /**
     * Construct an Afk overlay 
     * @param rootDiv the root element this overlay will be inserted into 
     * @param rootElement the root element that is the overlay
     * @param textElement an element that contains text for the action overlay  
     * @param countDownSpanElementId the id of the span that holds the countdown element 
     */
    public constructor(rootDiv: HTMLDivElement, rootElement: HTMLDivElement, textElement: HTMLDivElement, countDownSpanElementId: string) {
        super(rootDiv, rootElement, textElement);
        this.countDownSpanElementId = countDownSpanElementId;
    }

    /**
     * Update the count down spans number for the overlay 
     * @param countdown the count down number to be inserted into the span for updating
     */
    public updateCountdown(countdown: number): void {
        document.getElementById(this.countDownSpanElementId).innerHTML = countdown.toString();
    }

}

/**
 * Class for the text overlay base 
 */
export class TextOverlayBase extends OverlayBase implements libspsfrontend.ITextOverlay {

    /**
     * Construct a text overlay 
     * @param rootDiv the root element this overlay will be inserted into 
     * @param rootElement the root element that is the overlay
     * @param textElement an element that contains text for the action overlay  
     */
    public constructor(rootDiv: HTMLDivElement, rootElement: HTMLDivElement, textElement: HTMLDivElement) {
        super(rootDiv, rootElement, textElement);
    }

    /**
     * Update the text overlays inner text 
     * @param text the update text to be inserted into the overlay 
     */
    public update(text: string): void {
        if (text != null || text != undefined) {
            this.textElement.innerHTML = text;
        }
    }
}
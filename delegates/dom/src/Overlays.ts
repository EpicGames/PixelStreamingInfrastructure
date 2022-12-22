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
 * Show an overlay for when the session is unattended, it begins a countdown timer, which when elapsed will disconnect the stream.
 */
export class AfkOverlay extends ActionOverlayBase implements libspsfrontend.IAfkOverlay {
    
    /**
    * @returns The created root element of this overlay.
    */
    public static createRootElement() : HTMLDivElement {
        let afkOverlayHtml = document.createElement('div');
		afkOverlayHtml.id = "afkOverlay";
		afkOverlayHtml.className = "clickableState";
        return afkOverlayHtml;
    }
    
    /**
     * @returns The created content element of this overlay, which contain some text for an afk count down.
     */
    public static createContentElement() : HTMLDivElement {
        let afkOverlayHtmlInner = document.createElement('div');
		afkOverlayHtmlInner.id = 'afkOverlayInner';
		afkOverlayHtmlInner.innerHTML = '<center>No activity detected<br>Disconnecting in <span id="afkCountDownNumber"></span> seconds<br>Click to continue<br></center>';
        return afkOverlayHtmlInner;
    }

    /**
     * Construct an Afk overlay 
     * @param parentElement the element this overlay will be inserted into 
     */
    public constructor(rootDiv: HTMLDivElement) {
        super(rootDiv, AfkOverlay.createRootElement(), AfkOverlay.createContentElement());

        this.rootElement.addEventListener('click', () => {
            this.activate();
        });
    }

    /**
     * Update the count down spans number for the overlay 
     * @param countdown the count down number to be inserted into the span for updating
     */
    public updateCountdown(countdown: number): void {
        document.getElementById("afkCountDownNumber").innerHTML = countdown.toString();
    }

}

/**
 * Overlay shown during disconnection, has a reconnection element that can be clicked to reconnect.
 */
export class DisconnectOverlay extends ActionOverlayBase {

    /**
     * @returns The created root element of this overlay.
     */
    public static createRootElement() : HTMLDivElement {
        let disconnectOverlayHtml = document.createElement('div');
		disconnectOverlayHtml.id = "disconnectOverlay";
		disconnectOverlayHtml.className = "clickableState";
		return disconnectOverlayHtml;
    }

    /**
     * @returns The created content element of this overlay, which contain whatever content this element contains, like text or a button.
     */
    public static createContentElement() : HTMLDivElement {
        // build the inner html container 
		let disconnectOverlayHtmlInnerContainer = document.createElement('div');
		disconnectOverlayHtmlInnerContainer.id = 'disconnectButton';

		// build the span that holds error text
		let disconnectOverlayInnerSpan = document.createElement('span');
		disconnectOverlayInnerSpan.id = 'disconnectText';
		disconnectOverlayInnerSpan.innerHTML = 'Click To Restart';

		// build the image element that holds the reconnect element
		let restartSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		restartSvg.setAttribute('width', "40");
		restartSvg.setAttribute('height', "40");
		restartSvg.setAttribute('fill', "currentColor");
		restartSvg.setAttribute('class', "bi bi-arrow-counterclockwise m-2");
		restartSvg.setAttribute('viewBox', "0 0 16 16");

		// build the arrow path 
		let restartSvgPathArrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		restartSvgPathArrow.setAttribute('fill-rule', "evenodd");
		restartSvgPathArrow.setAttribute('d', "M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z");

		// build the circle path
		let restartSvgPathCircle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		restartSvgPathCircle.setAttribute('d', "M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z");

		// bring it all together
		restartSvg.appendChild(restartSvgPathArrow);
		restartSvg.appendChild(restartSvgPathCircle);

		// append the span and images to the content container 
		disconnectOverlayHtmlInnerContainer.appendChild(disconnectOverlayInnerSpan);
		disconnectOverlayHtmlInnerContainer.appendChild(restartSvg);
        return disconnectOverlayHtmlInnerContainer;
    }

    /**
     * Construct a disconnect overlay with a retry connection icon.
     * @param parentElem the parent element this overlay will be inserted into. 
     */
     public constructor(parentElem: HTMLDivElement) {
        super(parentElem, DisconnectOverlay.createRootElement(), DisconnectOverlay.createContentElement(), "disconnectText");

		// add the new event listener 
		this.rootElement.addEventListener('click', () => {
            this.activate();
        });
    }

}

/**
 * Overlay shown during connection, has a button that can be clicked to initiate a connection.
 */
export class ConnectOverlay extends ActionOverlayBase {

    /**
    * @returns The created root element of this overlay.
    */
    public static createRootElement() : HTMLDivElement {
        let connectElem = document.createElement('div');
        connectElem.id = "connectOverlay";
        connectElem.className = "clickableState";
        return connectElem;
    }
    
    /**
     * @returns The created content element of this overlay, which contain whatever content this element contains, like text or a button.
     */
    public static createContentElement() : HTMLDivElement {
        let connectContentElem = document.createElement('div');
		connectContentElem.id = 'connectButton';
		connectContentElem.innerHTML = 'Click to start';
        return connectContentElem;
    }

    /**
     * Construct a connect overlay with a connection button.
     * @param parentElem the parent element this overlay will be inserted into. 
     */
        public constructor(parentElem: HTMLDivElement) {
        super(parentElem, ConnectOverlay.createRootElement(), ConnectOverlay.createContentElement());

        // add the new event listener 
        this.rootElement.addEventListener('click', () => {
            this.activate();
        });
    }
}

// TODO: Remove this .png and replace with css generated button
import playButton from './assets/images/Play.png';

/**
 * Overlay shown when stream is ready to play.
 */
 export class PlayOverlay extends ActionOverlayBase {

    /**
    * @returns The created root element of this overlay.
    */
    public static createRootElement() : HTMLDivElement {
        let playElem = document.createElement('div');
        playElem.id = "playOverlay";
        playElem.className = "clickableState";
        return playElem;
    }
    
    /**
     * @returns The created content element of this overlay, which contain whatever content this element contains, like text or a button.
     */
    public static createContentElement() : HTMLDivElement {
        let playOverlayHtmlInner = document.createElement('img');
		playOverlayHtmlInner.id = 'playButton';
		playOverlayHtmlInner.src = playButton;
		playOverlayHtmlInner.alt = 'Start Streaming';
        return playOverlayHtmlInner;
    }

    /**
     * Construct a connect overlay with a connection button.
     * @param parentElem the parent element this overlay will be inserted into. 
     */
        public constructor(parentElem: HTMLDivElement) {
        super(parentElem, PlayOverlay.createRootElement(), PlayOverlay.createContentElement());

        // add the new event listener 
        this.rootElement.addEventListener('click', () => {
            this.activate();
        });
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

/**
 * Generic overlay used to show textual info to the user.
 */
 export class InfoOverlay extends TextOverlayBase {

    /**
    * @returns The created root element of this overlay.
    */
    public static createRootElement() : HTMLDivElement {
        let infoOverlayHtml = document.createElement('div');
		infoOverlayHtml.id = "infoOverlay";
		infoOverlayHtml.className = "textDisplayState";
        return infoOverlayHtml;
    }
    
    /**
     * @returns The created content element of this overlay, which contain whatever content this element contains, like text or a button.
     */
    public static createContentElement() : HTMLDivElement {
        let infoOverlayHtmlInner = document.createElement('div');
		infoOverlayHtmlInner.id = 'messageOverlayInner';
        return infoOverlayHtmlInner;
    }

    /**
     * Construct a connect overlay with a connection button.
     * @param parentElem the parent element this overlay will be inserted into. 
     */
        public constructor(parentElem: HTMLDivElement) {
        super(parentElem, InfoOverlay.createRootElement(), InfoOverlay.createContentElement());
    }
}

/**
 * Generic overlay used to show textual error info to the user.
 */
 export class ErrorOverlay extends TextOverlayBase {

    /**
    * @returns The created root element of this overlay.
    */
    public static createRootElement() : HTMLDivElement {
        let errorOverlayHtml = document.createElement('div');
		errorOverlayHtml.id = "errorOverlay";
		errorOverlayHtml.className = "textDisplayState";
        return errorOverlayHtml;
    }
    
    /**
     * @returns The created content element of this overlay, which contain whatever content this element contains, like text or a button.
     */
    public static createContentElement() : HTMLDivElement {
        let errorOverlayHtmlInner = document.createElement('div');
		errorOverlayHtmlInner.id = 'errorOverlayInner';
        return errorOverlayHtmlInner;
    }

    /**
     * Construct a connect overlay with a connection button.
     * @param parentElem the parent element this overlay will be inserted into. 
     */
    public constructor(parentElem: HTMLDivElement) {
        super(parentElem, ErrorOverlay.createRootElement(), ErrorOverlay.createContentElement());
    }
}
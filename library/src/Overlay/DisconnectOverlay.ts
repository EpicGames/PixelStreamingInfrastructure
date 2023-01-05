import { ActionOverlay } from "./ActionOverlay";

/**
 * Overlay shown during disconnection, has a reconnection element that can be clicked to reconnect.
 */
export class DisconnectOverlay extends ActionOverlay {

	/**
	 * @returns The created root element of this overlay.
	 */
	public static createRootElement(): HTMLElement {
		const disconnectOverlayHtml = document.createElement('div');
		disconnectOverlayHtml.id = "disconnectOverlay";
		disconnectOverlayHtml.className = "clickableState";
		return disconnectOverlayHtml;
	}

	/**
	 * @returns The created content element of this overlay, which contain whatever content this element contains, like text or a button.
	 */
	public static createContentElement(): HTMLElement {
		// build the inner html container 
		const disconnectOverlayHtmlInnerContainer = document.createElement('div');
		disconnectOverlayHtmlInnerContainer.id = 'disconnectButton';

		// build the span that holds error text
		const disconnectOverlayInnerSpan = document.createElement('span');
		disconnectOverlayInnerSpan.id = 'disconnectText';
		disconnectOverlayInnerSpan.innerHTML = 'Click To Restart';

		// build the image element that holds the reconnect element
		const restartSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		restartSvg.setAttribute('width', "40");
		restartSvg.setAttribute('height', "40");
		restartSvg.setAttribute('fill', "currentColor");
		restartSvg.setAttribute('class', "bi bi-arrow-counterclockwise m-2");
		restartSvg.setAttribute('viewBox', "0 0 16 16");

		// build the arrow path 
		const restartSvgPathArrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		restartSvgPathArrow.setAttribute('fill-rule', "evenodd");
		restartSvgPathArrow.setAttribute('d', "M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z");

		// build the circle path
		const restartSvgPathCircle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
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
	public constructor(parentElem: HTMLElement) {
		super(parentElem, DisconnectOverlay.createRootElement(), DisconnectOverlay.createContentElement(), "disconnectText");

		// add the new event listener 
		this.rootElement.addEventListener('click', () => {
			this.activate();
		});
	}
}
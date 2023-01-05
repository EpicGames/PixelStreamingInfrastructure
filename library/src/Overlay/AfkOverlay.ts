import { ActionOverlay } from "./ActionOverlay";

/**
 * Show an overlay for when the session is unattended, it begins a countdown timer, which when elapsed will disconnect the stream.
 */
export class AfkOverlay extends ActionOverlay {

	/**
	* @returns The created root element of this overlay.
	*/
	public static createRootElement(): HTMLElement {
		const afkOverlayHtml = document.createElement('div');
		afkOverlayHtml.id = "afkOverlay";
		afkOverlayHtml.className = "clickableState";
		return afkOverlayHtml;
	}

	/**
	 * @returns The created content element of this overlay, which contain some text for an afk count down.
	 */
	public static createContentElement(): HTMLElement {
		const afkOverlayHtmlInner = document.createElement('div');
		afkOverlayHtmlInner.id = 'afkOverlayInner';
		afkOverlayHtmlInner.innerHTML = '<center>No activity detected<br>Disconnecting in <span id="afkCountDownNumber"></span> seconds<br>Click to continue<br></center>';
		return afkOverlayHtmlInner;
	}

	/**
	 * Construct an Afk overlay 
	 * @param parentElement the element this overlay will be inserted into 
	 */
	public constructor(rootDiv: HTMLElement) {
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
		const countdownTimer = document.getElementById("afkCountDownNumber");
		if(countdownTimer != null) {
			countdownTimer.innerHTML = countdown.toString();
		}
	}

}
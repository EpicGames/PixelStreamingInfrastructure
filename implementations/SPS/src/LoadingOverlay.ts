import * as libfrontend from "@epicgames/libfrontend";

export class LoadingOverlay extends libfrontend.TextOverlay {
	maxDrops = 50;
	maxSize = 5;
	maxDuration = 5;
	minDelay = -20;
	rainDrops: Array<Raindrop> = [];

	private static _rootElement: HTMLElement;
	private static _textElement: HTMLElement;
	private static _spinner: HTMLElement;

	/**
	* @returns The created root element of this overlay.
	*/
	public static rootElement(): HTMLElement {
		if (!LoadingOverlay._rootElement) {
			LoadingOverlay._rootElement = document.createElement('div');
			LoadingOverlay._rootElement.id = "loadingOverlay";
			LoadingOverlay._rootElement.className = "textDisplayState";
		}
		return LoadingOverlay._rootElement;
	}

	/**
	 * @returns The created content element of this overlay, which contain whatever content this element contains, like text or a button.
	 */
	public static textElement(): HTMLElement {
		if (!LoadingOverlay._textElement) {
			LoadingOverlay._textElement = document.createElement('div');
			LoadingOverlay._textElement.id = 'loadingOverlayText';
		}
		return LoadingOverlay._textElement;
	}


	public static spinner(): HTMLElement {
		if(!LoadingOverlay._spinner) {
			// build the spinner div
			const size = LoadingOverlay._rootElement.clientWidth * 0.03;
			LoadingOverlay._spinner = document.createElement('div');
			LoadingOverlay._spinner.id = "loading-spinner"
			LoadingOverlay._spinner.className = "loading-spinner";
			LoadingOverlay._spinner.setAttribute("style", "width: " + size + "px; height: " + size + "px;");

			const SpinnerSectionOne = document.createElement("div");
			SpinnerSectionOne.setAttribute("style", "width: " + size * 0.8 + "px; height: " + size * 0.8 + "px; border-width: " + size * 0.125 + "px;");
			LoadingOverlay._spinner.appendChild(SpinnerSectionOne);

			const SpinnerSectionTwo = document.createElement("div");
			SpinnerSectionTwo.setAttribute("style", "width: " + size * 0.8 + "px; height: " + size * 0.8 + "px; border-width: " + size * 0.125 + "px;");
			LoadingOverlay._spinner.appendChild(SpinnerSectionTwo);

			const SpinnerSectionThree = document.createElement("div");
			SpinnerSectionThree.setAttribute("style", "width: " + size * 0.8 + "px; height: " + size * 0.8 + "px; border-width: " + size * 0.125 + "px;");
			LoadingOverlay._spinner.appendChild(SpinnerSectionThree);
		}
		return LoadingOverlay._spinner;
	}
	/**
	 * Construct a connect overlay with a connection button.
	 * @param parentElem the parent element this overlay will be inserted into. 
	 */
	public constructor(parentElem: HTMLElement) {
		super(parentElem, LoadingOverlay.rootElement(), LoadingOverlay.textElement());
	}

	public animate() {
		// Update the existing drops to have an increased speed
		for(let raindrop of this.rainDrops) {
			raindrop.element.setAttribute("style", "animation-duration:" + (1 + Math.random() * this.maxDuration) + "s;")
		}

		let i = 0;
		while(i < this.maxDrops) {
			const dropContainer = document.createElement("div");
			dropContainer.id = "dropContainer";
			dropContainer.classList.add("raindrop");

			const raindrop = new Raindrop();
			raindrop.size = Math.random() * this.maxSize + 0.2;
			raindrop.delay = Math.random() * this.minDelay;
			raindrop.duration = Math.random() * this.maxDuration;
			raindrop.offsetLeft = Math.floor(Math.random() * LoadingOverlay.rootElement().clientWidth);
			raindrop.element = dropContainer;

			

			const drop = document.createElement("drop");
			drop.setAttribute("style", "left: " + raindrop.offsetLeft + "px; width:" + raindrop.size + "px; overflow: visible;");
			dropContainer.setAttribute("style", "animation-delay:" + raindrop.delay + "s; animation-duration:" + (1 + raindrop.duration) + "s;");

			const head = document.createElement("div");
			head.id = "drophead";
			raindrop.headsize = raindrop.size * 3;
			head.setAttribute("style", "left: -" + raindrop.size + "px; width:" + raindrop.headsize + "px; height: " + raindrop.headsize + "px;");
			drop.appendChild(head);

			dropContainer.appendChild(drop);
			LoadingOverlay.rootElement().append(dropContainer);
			this.rainDrops.push(raindrop);
			i++;
		}

		this.maxDrops /= 1.5
		this.maxDuration /= 1.5;
	}

	/**
	 * Update the text overlays inner text 
	 * @param text the update text to be inserted into the overlay 
	 */
	public update(text: string): void {
		if (text != null || text != undefined) {
			this.textElement.innerHTML = "";

			let textContainer = document.createElement("div");
			textContainer.innerHTML = text;
			this.textElement.append(textContainer);

			this.textElement.append(LoadingOverlay.spinner());
		}
	}
}

class Raindrop {
	size: number;
	delay: number;
	duration: number;
	offsetLeft: number;
	headsize: number;
	element: HTMLElement;
}
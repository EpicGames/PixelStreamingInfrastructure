// Copyright Epic Games, Inc. All Rights Reserved.

/**
 * Class for the base overlay structure
 */
export class OverlayBase {
    protected rootElement: HTMLElement;
    protected rootDiv: HTMLElement;
    public textElement: HTMLElement;

    /**
     * Construct an overlay
     * @param rootDiv the root element this overlay will be inserted into
     * @param rootElement the root element that is the overlay
     */
    protected constructor(
        rootDiv: HTMLElement,
        rootElement: HTMLElement,
        textElement: HTMLElement
    ) {
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
        this.rootElement.classList.remove('hiddenState');
    }

    /**
     * Hide the overlay
     */
    public hide(): void {
        this.rootElement.classList.add('hiddenState');
    }
}

// Copyright Epic Games, Inc. All Rights Reserved.

import { OverlayBase } from './BaseOverlay';

/**
 * Class for the text overlay base
 */
export class TextOverlay extends OverlayBase {
    /**
     * Construct a text overlay
     * @param rootDiv the root element this overlay will be inserted into
     * @param rootElement the root element that is the overlay
     * @param textElement an element that contains text for the action overlay
     */
    public constructor(
        rootDiv: HTMLElement,
        rootElement: HTMLElement,
        textElement: HTMLElement
    ) {
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

// Copyright Epic Games, Inc. All Rights Reserved.

import { TextOverlay } from './TextOverlay';

/**
 * Generic overlay used to show textual info to the user.
 */
export class InfoOverlay extends TextOverlay {
    /**
     * @returns The created root element of this overlay.
     */
    public static createRootElement(): HTMLElement {
        const infoOverlayHtml = document.createElement('div');
        infoOverlayHtml.id = 'infoOverlay';
        infoOverlayHtml.className = 'textDisplayState';
        return infoOverlayHtml;
    }

    /**
     * @returns The created content element of this overlay, which contain whatever content this element contains, like text or a button.
     */
    public static createContentElement(): HTMLElement {
        const infoOverlayHtmlInner = document.createElement('div');
        infoOverlayHtmlInner.id = 'messageOverlayInner';
        return infoOverlayHtmlInner;
    }

    /**
     * Construct a connect overlay with a connection button.
     * @param parentElem the parent element this overlay will be inserted into.
     */
    public constructor(parentElem: HTMLElement) {
        super(
            parentElem,
            InfoOverlay.createRootElement(),
            InfoOverlay.createContentElement()
        );
    }
}

// Copyright Epic Games, Inc. All Rights Reserved.

import { TextOverlay } from './TextOverlay';

/**
 * Generic overlay used to show textual error info to the user.
 */
export class ErrorOverlay extends TextOverlay {
    /**
     * @returns The created root element of this overlay.
     */
    public static createRootElement(): HTMLElement {
        const errorOverlayHtml = document.createElement('div');
        errorOverlayHtml.id = 'errorOverlay';
        errorOverlayHtml.className = 'textDisplayState';
        return errorOverlayHtml;
    }

    /**
     * @returns The created content element of this overlay, which contain whatever content this element contains, like text or a button.
     */
    public static createContentElement(): HTMLElement {
        const errorOverlayHtmlInner = document.createElement('div');
        errorOverlayHtmlInner.id = 'errorOverlayInner';
        return errorOverlayHtmlInner;
    }

    /**
     * Construct a connect overlay with a connection button.
     * @param parentElem the parent element this overlay will be inserted into.
     */
    public constructor(parentElem: HTMLElement) {
        super(
            parentElem,
            ErrorOverlay.createRootElement(),
            ErrorOverlay.createContentElement()
        );
    }
}

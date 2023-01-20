// Copyright Epic Games, Inc. All Rights Reserved.

import { ActionOverlay } from './ActionOverlay';

/**
 * Overlay shown during disconnection, has a reconnection element that can be clicked to reconnect.
 */
export class DisconnectOverlay extends ActionOverlay {
    /**
     * @returns The created root element of this overlay.
     */
    public static createRootElement(): HTMLElement {
        const disconnectOverlayHtml = document.createElement('div');
        disconnectOverlayHtml.id = 'disconnectOverlay';
        disconnectOverlayHtml.className = 'clickableState';
        return disconnectOverlayHtml;
    }

    /**
     * @returns The created content element of this overlay, which contain whatever content this element contains, like text or a button.
     */
    public static createContentElement(): HTMLElement {
        // build the inner html container
        const disconnectOverlayHtmlContainer = document.createElement('div');
        disconnectOverlayHtmlContainer.id = 'disconnectButton';
        disconnectOverlayHtmlContainer.innerHTML = 'Click To Restart';

        return disconnectOverlayHtmlContainer;
    }

    /**
     * Construct a disconnect overlay with a retry connection icon.
     * @param parentElem the parent element this overlay will be inserted into.
     */
    public constructor(parentElem: HTMLElement) {
        super(
            parentElem,
            DisconnectOverlay.createRootElement(),
            DisconnectOverlay.createContentElement()
        );

        // add the new event listener
        this.rootElement.addEventListener('click', () => {
            this.activate();
        });
    }
}

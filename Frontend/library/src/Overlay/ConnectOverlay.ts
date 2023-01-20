// Copyright Epic Games, Inc. All Rights Reserved.

import { ActionOverlay } from './ActionOverlay';

/**
 * Overlay shown during connection, has a button that can be clicked to initiate a connection.
 */
export class ConnectOverlay extends ActionOverlay {
    /**
     * @returns The created root element of this overlay.
     */
    public static createRootElement(): HTMLElement {
        const connectElem = document.createElement('div');
        connectElem.id = 'connectOverlay';
        connectElem.className = 'clickableState';
        return connectElem;
    }

    /**
     * @returns The created content element of this overlay, which contain whatever content this element contains, like text or a button.
     */
    public static createContentElement(): HTMLElement {
        const connectContentElem = document.createElement('div');
        connectContentElem.id = 'connectButton';
        connectContentElem.innerHTML = 'Click to start';
        return connectContentElem;
    }

    /**
     * Construct a connect overlay with a connection button.
     * @param parentElem the parent element this overlay will be inserted into.
     */
    public constructor(parentElem: HTMLElement) {
        super(
            parentElem,
            ConnectOverlay.createRootElement(),
            ConnectOverlay.createContentElement()
        );

        // add the new event listener
        this.rootElement.addEventListener('click', () => {
            this.activate();
        });
    }
}
